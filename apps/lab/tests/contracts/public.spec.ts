// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'

import worker from '../../server/index'
import { createMigratedDatabase } from './database'

const context = { waitUntil() {}, passThroughOnException() {} } as ExecutionContext

describe('WP6 public API', () => {
  afterEach(() => vi.restoreAllMocks())

  it('공개 Section, Pattern과 Collection만 허브에 반환한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase()
    const response = await worker.fetch(
      new Request('https://example.test/api/v1/discovery'),
      { DB: d1 },
      context,
    )
    const body = (await response.json()) as {
      data: { sections: Array<{ key: string }>; patterns: unknown[]; collections: unknown[] }
    }
    expect(response.status).toBe(200)
    expect(body.data.sections.map((item) => item.key)).toContain('hero')
    expect(body.data.patterns).toHaveLength(3)
    expect(body.data.collections).toHaveLength(3)
    sqlite.close()
  })

  it('동일 URL 제보를 반복해도 같은 202 응답을 주고 한 행만 저장한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase()
    const request = () =>
      new Request('http://localhost/api/v1/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          url: 'https://Example.com/motion/#demo',
          note: '좋은 움직임',
          turnstileToken: 'local-test-token',
        }),
      })
    const env = { DB: d1, LOCAL_ADMIN_SIMULATION: 'true' }
    expect((await worker.fetch(request(), env, context)).status).toBe(202)
    expect((await worker.fetch(request(), env, context)).status).toBe(202)
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM submissions').get()).toEqual({ count: 1 })
    sqlite.close()
  })

  it('기존 Source URL은 존재 여부를 숨기고 새 Submission을 만들지 않는다', async () => {
    const { sqlite, d1 } = createMigratedDatabase()
    const response = await worker.fetch(
      new Request('http://localhost/api/v1/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          url: 'https://codepen.io/hoseonkwak/pen/LEVeYQO',
          turnstileToken: 'local-test-token',
        }),
      }),
      { DB: d1, LOCAL_ADMIN_SIMULATION: 'true' },
      context,
    )
    expect(response.status).toBe(202)
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM submissions').get()).toEqual({ count: 0 })
    sqlite.close()
  })

  it('8KB를 넘는 제보 본문을 거절한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase()
    const response = await worker.fetch(
      new Request('http://localhost/api/v1/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/motion',
          note: 'a'.repeat(9 * 1024),
          turnstileToken: 'local-test-token',
        }),
      }),
      { DB: d1, LOCAL_ADMIN_SIMULATION: 'true' },
      context,
    )
    expect(response.status).toBe(413)
    sqlite.close()
  })
  it('sitemap에는 공개 예제와 Section만 포함하고 draft는 제외한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase()
    const response = await worker.fetch(
      new Request('https://example.test/sitemap.xml'),
      { DB: d1 },
      context,
    )
    const xml = await response.text()
    expect(response.headers.get('content-type')).toContain('application/xml')
    expect(xml).toContain('/examples/gsap-basic-tween')
    expect(xml).toContain('/sections/hero')
    expect(xml).not.toContain('hidden-draft-example')
    sqlite.close()
  })
})
