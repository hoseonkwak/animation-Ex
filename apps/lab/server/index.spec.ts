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
