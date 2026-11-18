import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import catalog from '../../server/internalPreviewCatalog.json' with { type: 'json' }
import { internalPreviewPolicy } from '../../src/shared/internalPreviewPolicy'

test('미리보기와 상세는 CodePen 요청 없이 자체 코드를 실행하고 닫기·재시작을 지원한다', async ({
  page,
}) => {
  const [snapshotSlug, snapshot] = Object.entries(catalog)[0]!
  const runtimeUrl = `/runtime/${snapshotSlug}/${snapshot.version}/index.html`
  let codepenEmbeds = 0
  await page.route('https://codepen.io/**/embed/**', (route) => {
    codepenEmbeds++
    return route.abort()
  })
  await page.route('**/api/v1/examples**', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    const decorate = (item: Record<string, unknown>) => ({
      ...item,
      title: '자체 실행 검증',
      runtimeVerified: true,
      preview: {
        ...(item.preview as object),
        kind: 'internal',
        runtimeUrl,
        version: snapshot.version,
      },
    })
    if (new URL(route.request().url()).pathname.endsWith('/gsap-basic-tween'))
      body.data = decorate(body.data)
    else if (body.data.items)
      body.data.items = body.data.items.map((item: Record<string, unknown>) =>
        item.slug === 'gsap-basic-tween' ? decorate(item) : item,
      )
    await route.fulfill({ response, json: body })
  })
  // 공개 상태·파일 허용 목록은 Worker 계약 검사에서 별도로 검증한다.
  await page.route('**/runtime/**', async (route) => {
    const url = new URL(route.request().url())
    const prefix = `/runtime/${snapshotSlug}/${snapshot.version}`
    const file = url.pathname.slice(prefix.length)
    if (!url.pathname.startsWith(prefix + '/') || !snapshot.files.includes(file))
      return route.fulfill({ status: 404, body: 'Not found' })
    const bytes = await readFile(path.join('public', url.pathname))
    const contentType = file.endsWith('.html')
      ? 'text/html'
      : file.endsWith('.js')
        ? 'text/javascript'
        : file.endsWith('.css')
          ? 'text/css'
          : 'application/octet-stream'
    await route.fulfill({
      body: bytes,
      contentType,
      headers: {
        'Content-Security-Policy': internalPreviewPolicy(
          url.origin + prefix + '/',
          snapshot.origins,
          file.endsWith('.txt'),
        ),
        'Access-Control-Allow-Origin': '*',
      },
    })
  })
  await page.goto('/explore')
  const card = page.locator('[data-example-id="entry-basic-1"]')
  await expect(card.getByText('자체 실행', { exact: true })).toBeVisible()
  await card.getByRole('button', { name: '자체 실행 검증 미리보기' }).click()
  const modal = page.getByRole('dialog', { name: '자체 실행 검증 미리보기' })
  const frame = modal.locator('iframe')
  await expect(frame).toHaveAttribute('src', runtimeUrl)
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts')
  await expect
    .poll(() => frame.contentFrame().locator('body').locator(':scope > *').count())
    .toBeGreaterThan(0)
  await modal.getByRole('button', { name: '미리보기 닫기' }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.goto('/examples/gsap-basic-tween')
  await expect(page.getByRole('heading', { name: '자체 실행 화면' })).toBeVisible()
  const detailFrame = page.locator('.detail-frame iframe')
  await expect(detailFrame).toHaveAttribute('src', runtimeUrl)
  await expect(detailFrame).toHaveAttribute('sandbox', 'allow-scripts')
  await page.getByRole('button', { name: '다시 실행', exact: true }).click()
  await expect(detailFrame).toBeVisible()
  expect(codepenEmbeds).toBe(0)
})
