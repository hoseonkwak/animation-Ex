import { expect, test } from '@playwright/test'

test('P1-UX-01 Vue 애플리케이션이 로드된다', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('웹 애니메이션 예제')
  await expect(page.getByRole('heading', { name: '카테고리' })).toBeVisible()
  await expect(page.locator('.category-pill')).toHaveCount(6)
  await expect(page.locator('.example-card')).toHaveCount(12)
  await expect(page.locator('.preview-thumbnail')).toHaveCount(12)
  await expect(page.locator('.preview-thumbnail img')).toHaveCount(12)
  await expect(page.getByTestId('codepen-preview')).toHaveCount(0)

  await expect(page.getByRole('link', { name: '모든 예제 보기' })).toHaveAttribute(
    'href',
    '/explore',
  )
})

test('홈 썸네일을 눌렀을 때만 CodePen 실행 화면으로 바뀐다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/')

  const firstCard = page.getByTestId('home-example-grid').locator('.example-card').first()
  await firstCard.locator('.preview-thumbnail').click()
  await expect(firstCard.getByTestId('codepen-preview')).toHaveCount(1)
  await expect(firstCard.getByTestId('codepen-preview')).toHaveAttribute(
    'src',
    /https:\/\/codepen\.io\/hoseonkwak\/embed\//,
  )
  await expect(page.getByTestId('codepen-preview')).toHaveCount(1)
  await expect(page.locator('.preview-thumbnail')).toHaveCount(11)
})

test('작은 화면에서 홈과 탐색 페이지가 가로로 넘치지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 })

  for (const path of ['/', '/explore']) {
    await page.goto(path)
    await expect(page.locator('.example-card').first()).toBeVisible()
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1)
  }
})

test('검색·필터 상태를 URL에 저장하고 새로고침 뒤 복원한다', async ({ page }) => {
  await page.goto('/explore')

  await page.getByRole('heading', { name: '실행 가능한 예제' }).scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: '스크롤', exact: true }).click()
  await expect(page).toHaveURL(/trigger=scroll/)
  await expect(page.locator('.example-card')).toHaveCount(3)

  await page.reload()
  await expect(page.getByRole('button', { name: '스크롤', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.example-card')).toHaveCount(3)

  await page.goBack()
  await expect(page).not.toHaveURL(/trigger=scroll/)
  await expect(page.locator('.example-card')).toHaveCount(12)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400)
})

test('썸네일을 클릭한 Preview만 실행하고 동시 실행 수를 2개로 유지한다', async ({ page }) => {
  await page.goto('/explore')
  await expect(page.locator('.example-card')).toHaveCount(12)
  await expect(page.locator('.preview-thumbnail img')).toHaveCount(12)
  await expect(page.getByTestId('codepen-preview')).toHaveCount(0)

  const cards = page.locator('.example-card')
  await cards.nth(0).locator('.preview-thumbnail').click()
  await expect(cards.nth(0).getByTestId('codepen-preview')).toHaveCount(1)
  await cards.nth(1).locator('.preview-thumbnail').click()
  await cards.nth(2).locator('.preview-thumbnail').click()

  await expect(cards.nth(0).locator('.preview-thumbnail')).toHaveCount(1)
  await expect(cards.nth(2).getByTestId('codepen-preview')).toHaveCount(1)
  await expect(page.getByTestId('codepen-preview')).toHaveCount(2)
})

test('화면 너비에 따라 결과 그리드를 4·3·2·1열로 바꾼다', async ({ page }) => {
  const columns = () =>
    page
      .getByTestId('example-grid')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/explore')
  await expect(page.locator('.example-card')).toHaveCount(12)
  expect(await columns()).toBe(4)

  await page.setViewportSize({ width: 1024, height: 900 })
  expect(await columns()).toBe(3)

  await page.setViewportSize({ width: 768, height: 900 })
  expect(await columns()).toBe(2)

  await page.setViewportSize({ width: 320, height: 900 })
  expect(await columns()).toBe(1)
})

test('WP0 Worker health API가 개발 서버에서 응답한다', async ({ request }) => {
  const response = await request.get('/api/v1/health')
  const body = await response.json()

  expect(response.ok()).toBe(true)
  expect(body.data).toEqual({ service: 'kwak-motion-lab', status: 'ok' })
  expect(body.meta.requestId).toBeTruthy()
})

test('WP1 공개 API는 draft 예제를 노출하지 않는다', async ({ request }) => {
  const listResponse = await request.get('/api/v1/examples')
  const listBody = await listResponse.json()
  const draftResponse = await request.get('/api/v1/examples/hidden-draft-example')

  expect(listBody.data.items).toHaveLength(15)
  expect(JSON.stringify(listBody)).not.toContain('hidden-draft-example')
  expect(draftResponse.status()).toBe(404)
})
