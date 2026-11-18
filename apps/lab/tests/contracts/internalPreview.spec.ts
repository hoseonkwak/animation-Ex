// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import worker from '../../server/index'
import { createMigratedDatabase } from './database'

vi.mock('../../server/internalPreviewCatalog.json', () => ({
  default: {
    'gsap-basic-tween': {
      version: 'verified-test-version',
      canonicalUrl: 'https://codepen.io/hoseonkwak/pen/LEVeYQO',
      origins: ['https://cdn.jsdelivr.net'],
      files: ['/index.html', '/main.js', '/update-log.txt'],
    },
  },
}))
const context = { waitUntil() {}, passThroughOnException() {} } as ExecutionContext

describe('검증된 자체 실행 스냅샷', () => {
  it('목록·상세는 검증 버전을 선택하고 원본 CodePen 주소도 유지한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase()
    try {
      const response = await worker.fetch(
        new Request('http://localhost/api/v1/examples/gsap-basic-tween'),
        { DB: d1 } as never,
        context,
      )
      const { data } = (await response.json()) as {
        data: { preview: Record<string, string>; runtimeVerified: boolean }
      }
      expect(data.preview).toMatchObject({
        kind: 'internal',
        runtimeUrl: '/runtime/gsap-basic-tween/verified-test-version/index.html',
        version: 'verified-test-version',
      })
      expect(data.preview.embedUrl).toContain('codepen.io')
      expect(data.runtimeVerified).toBe(true)
      const list = await worker.fetch(
        new Request('http://localhost/api/v1/examples'),
        { DB: d1 } as never,
        context,
      )
      const payload = (await list.json()) as {
        data: { items: Array<{ slug: string; preview: { kind: string } }> }
      }
      expect(
        payload.data.items.find((item) => item.slug === 'gsap-basic-tween')?.preview.kind,
      ).toBe('internal')
    } finally {
      sqlite.close()
    }
  })
  it('공개된 정확한 버전·파일만 제공하고 원본 변경·공개 중지는 즉시 차단한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase()
    const fetch = vi.fn(
      async () =>
        new Response('<main>Internal example</main>', { headers: { 'content-type': 'text/html' } }),
    )
    const env = { DB: d1, ASSETS: { fetch } } as never
    const get = (path: string) =>
      worker.fetch(
        new Request('http://localhost' + path, { headers: { Cookie: 'admin=private' } }),
        env,
        context,
      )
    const url = '/runtime/gsap-basic-tween/verified-test-version/index.html'
    try {
      const response = await get(url)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-security-policy')).toContain('sandbox allow-scripts;')
      expect(response.headers.get('content-security-policy')).not.toContain('allow-same-origin')
      expect(response.headers.get('content-security-policy')).not.toContain("connect-src 'self'")
      expect(response.headers.get('access-control-allow-origin')).toBe('*')
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect((fetch.mock.calls[0] as unknown as [Request])[0].headers.get('Cookie')).toBeNull()
      expect((await get(url.replace('index.html', 'secret.js'))).status).toBe(404)
      expect((await get(url.replace('verified-test-version', 'unknown'))).status).toBe(404)
      sqlite
        .prepare(
          "UPDATE animation_entries SET status='unpublished',published_at=NULL WHERE slug='gsap-basic-tween'",
        )
        .run()
      expect((await get(url)).status).toBe(404)
      expect(fetch).toHaveBeenCalledTimes(1)
    } finally {
      sqlite.close()
    }
  })
  it('중첩 변경 이력은 실행 불가능한 일반 텍스트로만 제공한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase()
    try {
      const response = await worker.fetch(
        new Request(
          'http://localhost/runtime/gsap-basic-tween/verified-test-version/update-log.txt',
        ),
        {
          DB: d1,
          ASSETS: {
            fetch: async () =>
              new Response('<script>parent.secret</script>', {
                headers: { 'content-type': 'text/html' },
              }),
          },
        } as never,
        context,
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(response.headers.get('content-security-policy')).toContain('sandbox allow-scripts')
      expect(response.headers.get('content-security-policy')).not.toContain('frame-ancestors')
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    } finally {
      sqlite.close()
    }
  })
})
