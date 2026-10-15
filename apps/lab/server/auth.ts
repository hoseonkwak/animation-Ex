import { AdminApiError } from './admin'

export interface AdminAuthEnv {
  ADMIN_GITHUB_USER_ID?: string
  ADMIN_SESSION_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  LOCAL_ADMIN_SIMULATION?: string
}

export interface AdminIdentity {
  provider: 'github' | 'local'
  subject: string
}

interface SessionPayload {
  aud: string
  exp: number
  iat: number
  sub: string
  v: 1
}

interface GitHubTokenResponse {
  access_token?: string
  error?: string
}

interface GitHubUserResponse {
  id?: number
}

const sessionCookieName = 'kwak_admin_session'
const oauthStateCookieName = 'kwak_admin_oauth_state'
const sessionLifetimeSeconds = 60 * 60 * 8
const oauthStateLifetimeSeconds = 60 * 10

function encodeBase64Url(value: Uint8Array): string {
  let binary = ''
  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function encodeText(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function decodeText(value: Uint8Array): string {
  return new TextDecoder().decode(value)
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength)
  copy.set(value)
  return copy.buffer
}

function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie')
  if (!cookie) return null
  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim()
    }
  }
  return null
}

async function importSessionKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(encodeText(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(value: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await importSessionKey(secret),
    toArrayBuffer(encodeText(value)),
  )
  return encodeBase64Url(new Uint8Array(signature))
}

export async function createAdminSessionToken(
  githubUserId: string,
  secret: string,
  audience: string,
  now = Date.now(),
): Promise<string> {
  const issuedAt = Math.floor(now / 1000)
  const payload: SessionPayload = {
    aud: audience,
    exp: issuedAt + sessionLifetimeSeconds,
    iat: issuedAt,
    sub: `github:${githubUserId}`,
    v: 1,
  }
  const encodedPayload = encodeBase64Url(encodeText(JSON.stringify(payload)))
  return `${encodedPayload}.${await sign(encodedPayload, secret)}`
}

export function createAdminSessionCookie(token: string): string {
  return `${sessionCookieName}=${token}; Path=/; Max-Age=${sessionLifetimeSeconds}; HttpOnly; Secure; SameSite=Lax`
}

export function clearAdminSessionCookie(): string {
  return `${sessionCookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
}

export function clearOAuthStateCookie(): string {
  return `${oauthStateCookieName}=; Path=/api/v1/auth/github/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
}

async function verifyAdminSessionToken(
  token: string,
  secret: string,
  audience: string,
  now = Date.now(),
): Promise<SessionPayload | null> {
  const [encodedPayload, encodedSignature, extra] = token.split('.')
  if (!encodedPayload || !encodedSignature || extra) return null
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await importSessionKey(secret),
      toArrayBuffer(decodeBase64Url(encodedSignature)),
      toArrayBuffer(encodeText(encodedPayload)),
    )
    if (!valid) return null
    const payload = JSON.parse(decodeText(decodeBase64Url(encodedPayload))) as SessionPayload
    const nowSeconds = Math.floor(now / 1000)
    if (
      payload.v !== 1 ||
      payload.aud !== audience ||
      !payload.sub ||
      payload.iat > nowSeconds + 60 ||
      payload.exp <= nowSeconds
    ) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export async function authenticateAdminRequest(
  request: Request,
  env: AdminAuthEnv,
): Promise<AdminIdentity> {
  const url = new URL(request.url)
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  const localIdentity =
    isLocal && env.LOCAL_ADMIN_SIMULATION === 'true'
      ? request.headers.get('X-Local-Access-Email')
      : null
  if (localIdentity) return { provider: 'local', subject: `local:${localIdentity}` }

  const token = readCookie(request, sessionCookieName)
  if (!token) {
    throw new AdminApiError(401, 'ADMIN_AUTH_REQUIRED', 'GitHub 관리자 로그인이 필요합니다.')
  }
  if (!env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32) {
    throw new AdminApiError(
      503,
      'ADMIN_AUTH_NOT_CONFIGURED',
      '관리자 세션 비밀값 설정이 완료되지 않았습니다.',
    )
  }
  const payload = await verifyAdminSessionToken(token, env.ADMIN_SESSION_SECRET, url.origin)
  if (!payload) {
    throw new AdminApiError(401, 'ADMIN_SESSION_INVALID', '관리자 세션이 만료되었습니다.')
  }
  if (!env.ADMIN_GITHUB_USER_ID || payload.sub !== `github:${env.ADMIN_GITHUB_USER_ID}`) {
    throw new AdminApiError(403, 'ADMIN_FORBIDDEN', '허용된 관리자 계정이 아닙니다.')
  }
  return { provider: 'github', subject: payload.sub }
}

function requireGitHubConfiguration(env: AdminAuthEnv): {
  clientId: string
  clientSecret: string
  ownerId: string
  sessionSecret: string
} {
  if (
    !env.GITHUB_CLIENT_ID ||
    !env.GITHUB_CLIENT_SECRET ||
    !env.ADMIN_GITHUB_USER_ID ||
    !env.ADMIN_SESSION_SECRET ||
    env.ADMIN_SESSION_SECRET.length < 32
  ) {
    throw new AdminApiError(
      503,
      'ADMIN_AUTH_NOT_CONFIGURED',
      'GitHub 관리자 인증 설정이 완료되지 않았습니다.',
    )
  }
  return {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    ownerId: env.ADMIN_GITHUB_USER_ID,
    sessionSecret: env.ADMIN_SESSION_SECRET,
  }
}

export function beginGitHubOAuth(request: Request, env: AdminAuthEnv): Response {
  const { clientId } = requireGitHubConfiguration(env)
  const url = new URL(request.url)
  const state = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', `${url.origin}/api/v1/auth/github/callback`)
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('allow_signup', 'false')
  return new Response(null, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store',
      Location: authorizeUrl.toString(),
      'Set-Cookie': `${oauthStateCookieName}=${state}; Path=/api/v1/auth/github/callback; Max-Age=${oauthStateLifetimeSeconds}; HttpOnly; Secure; SameSite=Lax`,
    },
  })
}

export async function completeGitHubOAuth(
  request: Request,
  env: AdminAuthEnv,
): Promise<{ identity: AdminIdentity; sessionCookie: string }> {
  const { clientId, clientSecret, ownerId, sessionSecret } = requireGitHubConfiguration(env)
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expectedState = readCookie(request, oauthStateCookieName)
  if (!code || !state || !expectedState || state !== expectedState) {
    throw new AdminApiError(400, 'OAUTH_STATE_INVALID', '로그인 요청 상태를 확인할 수 없습니다.')
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${url.origin}/api/v1/auth/github/callback`,
    }),
  })
  const tokenBody = (await tokenResponse.json()) as GitHubTokenResponse
  if (!tokenResponse.ok || !tokenBody.access_token || tokenBody.error) {
    throw new AdminApiError(502, 'GITHUB_OAUTH_FAILED', 'GitHub 로그인을 완료하지 못했습니다.')
  }

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${tokenBody.access_token}`,
      'User-Agent': 'kwak-motion-lab',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  const user = (await userResponse.json()) as GitHubUserResponse
  if (!userResponse.ok || typeof user.id !== 'number') {
    throw new AdminApiError(
      502,
      'GITHUB_IDENTITY_FAILED',
      'GitHub 사용자 정보를 확인하지 못했습니다.',
    )
  }
  if (String(user.id) !== ownerId) {
    throw new AdminApiError(403, 'ADMIN_FORBIDDEN', '허용된 관리자 계정이 아닙니다.')
  }

  const identity = { provider: 'github', subject: `github:${user.id}` } as const
  const token = await createAdminSessionToken(String(user.id), sessionSecret, url.origin)
  return { identity, sessionCookie: createAdminSessionCookie(token) }
}
