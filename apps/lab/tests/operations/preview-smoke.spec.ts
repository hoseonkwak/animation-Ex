// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  PreviewSmokeError,
  runPreviewSmoke,
  runProductionSmoke,
} from '../../scripts/preview-smoke.mjs'

function previewFetch(pathOverrides: Record<string, Response> = {}) {
  const responses: Record<string, Response> = {
    '/api/v1/health': Response.json({ data: { service: 'kwak-motion-lab', status: 'ok' } }),
    '/api/v1/examples?limit=1': Response.json({ data: { items: [{ slug: 'sample' }] } }),
    '/robots.txt': new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'x-robots-tag': 'noindex, nofollow' },
    }),
    '/': new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }),
    '/api/v1/admin/operations': new Response(null, { status: 302 }),
    ...pathOverrides,
  }
  return async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : input)
    const response = responses[`${url.pathname}${url.search}`]
    if (!response) throw new Error(`fixture가 없습니다: ${url.pathname}${url.search}`)
    return response.clone()
  }
}

describe('preview remote smoke', () => {
  it('공개 조회, noindex와 관리자 차단을 함께 확인한다', async () => {
    const results = await runPreviewSmoke('https://preview.example.test', {
      fetchImpl: previewFetch(),
    })

    expect(results).toHaveLength(5)
    expect(results.every((result) => result.status === 'pass')).toBe(true)
  })

  it('production robots 정책을 Preview 성공으로 처리하지 않는다', async () => {
    const run = runPreviewSmoke('https://preview.example.test', {
      fetchImpl: previewFetch({
        '/robots.txt': new Response('User-agent: *\nAllow: /\n'),
      }),
    })

    await expect(run).rejects.toBeInstanceOf(PreviewSmokeError)
    await expect(run).rejects.toMatchObject({
      results: expect.arrayContaining([
        expect.objectContaining({ name: 'preview robots', status: 'fail' }),
      ]),
    })
  })

  it('production 공개 색인, 관리자 경로 차단과 sitemap을 확인한다', async () => {
    const results = await runProductionSmoke('https://www.example.test', {
      fetchImpl: previewFetch({
        '/robots.txt': new Response(
          'User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://www.example.test/sitemap.xml\n',
        ),
      }),
    })

    expect(results).toHaveLength(5)
    expect(results.every((result) => result.status === 'pass')).toBe(true)
  })

  it('원격 HTTP 주소와 URL 내 인증 정보를 거절한다', async () => {
    await expect(
      runPreviewSmoke('http://preview.example.test', { fetchImpl: previewFetch() }),
    ).rejects.toThrow('HTTPS')
    await expect(
      runPreviewSmoke('https://owner:secret@preview.example.test', {
        fetchImpl: previewFetch(),
      }),
    ).rejects.toThrow('인증 정보')
  })
})
