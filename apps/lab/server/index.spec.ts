import { afterEach, describe, expect, it, vi } from 'vitest'

import worker from './index'

describe('health API', () => {
  afterEach(() => vi.restoreAllMocks())

  it('서비스 상태와 request ID를 반환한다', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/api/v1/health'),
      { DB: {} as D1Database },
      {
        waitUntil() {},
        passThroughOnException() {},
      },
    )
    const body = (await response.json()) as {
      data: { service: string; status: string }
      meta: { requestId: string }
    }

    expect(response.status).toBe(200)
    expect(body.data).toEqual({ service: 'kwak-motion-lab', status: 'ok' })
    expect(body.meta.requestId).toBeTruthy()
  })

  it('iframe이 API를 문서로 여는 요청을 거절한다', async () => {
    const request = {
      url: 'https://example.test/api/v1/health',
      method: 'GET',
      headers: { get: (name: string) => (name === 'Sec-Fetch-Dest' ? 'iframe' : null) },
    } as Request
    const response = await worker.fetch(request, { DB: {} as D1Database }, {
      waitUntil() {},
      passThroughOnException() {},
    } as ExecutionContext)
    const body = (await response.json()) as { error: { code: string } }

    expect(response.status).toBe(403)
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(body.error.code).toBe('FRAME_NAVIGATION_FORBIDDEN')
  })

  it('예상하지 못한 오류를 request ID가 있는 구조화 로그로 남긴다', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = await worker.fetch(
      new Request('https://example.test/api/v1/discovery'),
      {
        DB: {
          prepare() {
            throw new Error('database unavailable')
          },
        } as unknown as D1Database,
        APP_ENVIRONMENT: 'preview',
      },
      { waitUntil() {}, passThroughOnException() {} } as ExecutionContext,
    )
    const body = (await response.json()) as { error: { code: string; requestId: string } }
    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'request_error',
        requestId: body.error.requestId,
        method: 'GET',
        path: '/api/v1/discovery',
        environment: 'preview',
        errorName: 'Error',
      }),
    )
  })
})
