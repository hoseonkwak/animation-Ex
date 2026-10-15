// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import worker from '../../server/index'

const ownerId = '12345678'
const sessionSecret = 'github-oauth-contract-session-secret'
const context = { waitUntil() {}, passThroughOnException() {} } as ExecutionContext
const env = {
  DB: {} as D1Database,
  APP_ENVIRONMENT: 'production' as const,
  ADMIN_GITHUB_USER_ID: ownerId,
  ADMIN_SESSION_SECRET: sessionSecret,
  GITHUB_CLIENT_ID: 'github-client-id',
  GITHUB_CLIENT_SECRET: 'github-client-secret',
  LOCAL_ADMIN_SIMULATION: 'false',
}

function cookieValue(header: string, name: string): string {
  const match = header.match(new RegExp(`${name}=([^;,]+)`))
  if (!match?.[1]) throw new Error(`${name} cookie not found`)
  return match[1]
}

afterEach(() => vi.restoreAllMocks())

describe('GitHub owner OAuth', () => {
  it('최소 권한 GitHub 로그인 요청과 CSRF state 쿠키를 만든다', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/api/v1/auth/github/start'),
      env,
      context,
    )
    const location = new URL(response.headers.get('location')!)
    const state = location.searchParams.get('state')

    expect(response.status).toBe(302)
    expect(location.origin).toBe('https://github.com')
    expect(location.pathname).toBe('/login/oauth/authorize')
    expect(location.searchParams.get('client_id')).toBe('github-client-id')
    expect(location.searchParams.get('scope')).toBeNull()
    expect(location.searchParams.get('redirect_uri')).toBe(
      'https://example.test/api/v1/auth/github/callback',
    )
    expect(state).toBeTruthy()
    expect(response.headers.get('set-cookie')).toContain(`kwak_admin_oauth_state=${state}`)
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(response.headers.get('set-cookie')).toContain('Secure')
    expect(response.headers.get('set-cookie')).toContain('SameSite=Lax')
  })

  it('owner 숫자 ID를 확인하고 서명된 관리자 세션을 발급한다', async () => {
    const start = await worker.fetch(
      new Request('https://example.test/api/v1/auth/github/start'),
      env,
      context,
    )
    const stateCookieHeader = start.headers.get('set-cookie')!
    const state = cookieValue(stateCookieHeader, 'kwak_admin_oauth_state')
    const github = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ access_token: 'temporary-token' }))
      .mockResolvedValueOnce(Response.json({ id: Number(ownerId), login: 'owner' }))

    const callback = await worker.fetch(
      new Request(
        `https://example.test/api/v1/auth/github/callback?code=one-time-code&state=${state}`,
        { headers: { Cookie: `kwak_admin_oauth_state=${state}` } },
      ),
      env,
      context,
    )
    const callbackCookies = callback.headers.get('set-cookie')!
    const session = cookieValue(callbackCookies, 'kwak_admin_session')

    expect(callback.status).toBe(302)
    expect(callback.headers.get('location')).toBe('https://example.test/admin/review')
    expect(callbackCookies).toContain('HttpOnly')
    expect(callbackCookies).toContain('Secure')
    expect(github).toHaveBeenCalledTimes(2)
    expect(github.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer temporary-token',
    })

    const status = await worker.fetch(
      new Request('https://example.test/api/v1/auth/session', {
        headers: { Cookie: `kwak_admin_session=${session}` },
      }),
      env,
      context,
    )
    expect(await status.json()).toMatchObject({
      data: { authenticated: true, provider: 'github' },
    })

    const otherOrigin = await worker.fetch(
      new Request('https://preview.example.test/api/v1/auth/session', {
        headers: { Cookie: `kwak_admin_session=${session}` },
      }),
      env,
      context,
    )
    expect(await otherOrigin.json()).toMatchObject({ data: { authenticated: false } })
  })

  it('state 불일치와 허용되지 않은 GitHub 계정을 거절한다', async () => {
    const invalidState = await worker.fetch(
      new Request(
        'https://example.test/api/v1/auth/github/callback?code=one-time-code&state=wrong',
        { headers: { Cookie: 'kwak_admin_oauth_state=expected' } },
      ),
      env,
      context,
    )
    expect(invalidState.status).toBe(302)
    expect(invalidState.headers.get('location')).toBe(
      'https://example.test/admin/review?auth=failed',
    )

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ access_token: 'temporary-token' }))
      .mockResolvedValueOnce(Response.json({ id: 99999999, login: 'someone-else' }))
    const forbidden = await worker.fetch(
      new Request(
        'https://example.test/api/v1/auth/github/callback?code=one-time-code&state=expected',
        { headers: { Cookie: 'kwak_admin_oauth_state=expected' } },
      ),
      env,
      context,
    )
    expect(forbidden.status).toBe(302)
    expect(forbidden.headers.get('location')).toBe(
      'https://example.test/admin/review?auth=forbidden',
    )
  })

  it('설정 누락과 변조된 세션을 안전하게 처리한다', async () => {
    const missingConfiguration = await worker.fetch(
      new Request('https://example.test/api/v1/auth/github/start'),
      { DB: {} as D1Database },
      context,
    )
    expect(missingConfiguration.status).toBe(503)

    const session = await worker.fetch(
      new Request('https://example.test/api/v1/auth/session', {
        headers: { Cookie: 'kwak_admin_session=forged.value' },
      }),
      env,
      context,
    )
    expect(await session.json()).toMatchObject({ data: { authenticated: false } })
  })

  it('로그아웃은 같은 출처에서만 세션 쿠키를 제거한다', async () => {
    const forbidden = await worker.fetch(
      new Request('https://example.test/api/v1/auth/logout', { method: 'POST' }),
      env,
      context,
    )
    expect(forbidden.status).toBe(403)

    const response = await worker.fetch(
      new Request('https://example.test/api/v1/auth/logout', {
        method: 'POST',
        headers: { Origin: 'https://example.test' },
      }),
      env,
      context,
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('kwak_admin_session=')
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })
})
