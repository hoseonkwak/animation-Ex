import { describe, expect, it } from 'vitest'

import worker from './index'

describe('health API', () => {
  it('서비스 상태와 request ID를 반환한다', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/api/v1/health'),
      {},
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
})
