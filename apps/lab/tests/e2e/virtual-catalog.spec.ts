import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function mockLongCatalog(page: Page): Promise<string[]> {
  const response = await page.request.get('/api/v1/examples?limit=1')
  const template = await response.json()
  const original = template.data.items[0]
  const items = Array.from({ length: 96 }, (_, index) => ({
    ...original,
    id: `virtual-${index}`,
    slug: `virtual-${index}`,
    title: `가상 목록 예제 ${index}`,
  }))
  const requestedCursors: string[] = []

  await page.route('**/api/v1/examples?**', async (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('cursor') ?? '0'
    requestedCursors.push(cursor)
    const start = Number(cursor)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...template,
        data: {
          ...template.data,
          items: items.slice(start, start + 12),
          nextCursor: start + 12 < items.length ? String(start + 12) : null,
        },
      }),
    })
  })

  return requestedCursors
}

test('전체 탐색에는 다음 결과 버튼이 있고 카테고리에는 없다', async ({ page }) => {
  await page.goto('/explore')
  await expect(page.getByRole('button', { name: '다음 결과 불러오기' })).toBeVisible()

  await page.goto('/explore?section=card')
  await expect(page.locator('.example-card').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '다음 결과 불러오기' })).toHaveCount(0)
})

test('카테고리 목록은 화면 밖 행을 제거하며 다음 페이지를 자동으로 가져온다', async ({ page }) => {
  const requestedCursors = await mockLongCatalog(page)
  await page.goto('/explore?section=card')
  const firstRow = page.locator('.virtual-example-row').first()
  await expect(firstRow).toHaveAttribute('data-row-index', '0')
  for (let pageNumber = 2; pageNumber <= 8; pageNumber += 1) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(() => requestedCursors.length).toBeGreaterThanOrEqual(pageNumber)
    expect(await page.locator('.example-card').count()).toBeLessThanOrEqual(60)
  }
  await expect.poll(() => firstRow.getAttribute('data-row-index').then(Number)).toBeGreaterThan(0)
  await expect(page.locator('[data-example-id="virtual-0"]')).toHaveCount(0)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('[data-example-id="virtual-0"]')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '다음 결과 불러오기' })).toHaveCount(0)
})

test('빠르게 스크롤해도 목록 영역에 카드가 보인다', async ({ page }) => {
  await page.setViewportSize({ width: 1265, height: 720 })
  await mockLongCatalog(page)
  await page.goto('/explore?section=button')
  await expect(page.locator('.example-card').first()).toBeVisible()

  for (const distance of [1400, 2400, 3400]) {
    await page.evaluate((y) => window.scrollTo(0, y), distance)
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    )
    const visibleCards = await page.locator('.example-card').evaluateAll(
      (cards) =>
        cards.filter((card) => {
          const rect = card.getBoundingClientRect()
          return rect.bottom > 72 && rect.top < window.innerHeight
        }).length,
    )
    expect(visibleCards).toBeGreaterThan(0)
  }
})

test('카테고리가 많아도 데스크톱과 모바일에서 끝 항목이 잘리지 않는다', async ({ page }) => {
  const response = await page.request.get('/api/v1/discovery')
  const template = await response.json()
  const sections = Array.from({ length: 12 }, (_, index) => ({
    key: `section-${index}`,
    label: `카테고리 ${index}`,
    count: index + 1,
  }))
  await page.route('**/api/v1/discovery', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...template,
        data: { ...template.data, sections },
      }),
    }),
  )

  for (const width of [1412, 320]) {
    await page.setViewportSize({ width, height: 780 })
    await page.goto('/')
    await expect(page.locator('.category-pill')).toHaveCount(13)
    const bounds = await page.locator('.category-list').evaluate((list) => {
      const container = list.getBoundingClientRect()
      return [...list.querySelectorAll('.category-pill')].every((pill) => {
        const item = pill.getBoundingClientRect()
        return item.left >= container.left - 1 && item.right <= container.right + 1
      })
    })
    expect(bounds).toBe(true)
  }
})
