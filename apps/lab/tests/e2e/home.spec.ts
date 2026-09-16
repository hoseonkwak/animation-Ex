import { expect, test } from '@playwright/test'

test('P1-UX-01 Vue 애플리케이션이 로드된다', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('좋은 움직임을 찾고')
  await expect(page.locator('.example-card')).toHaveCount(4)
  await expect(page.getByTestId('codepen-preview')).toHaveCount(1)
  await expect(page.getByTestId('codepen-preview').first()).toHaveAttribute(
    'src',
    /https:\/\/codepen\.io\/hoseonkwak\/embed\//,
  )

  await expect(page.getByRole('link', { name: '애니메이션 둘러보기' })).toHaveAttribute(
    'href',
    '/explore',
  )
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

test('사용자가 실행한 Preview를 우선하고 동시 실행 수를 2개로 유지한다', async ({ page }) => {
  await page.goto('/explore')
  await expect(page.locator('.example-card')).toHaveCount(12)
  await expect(page.getByTestId('codepen-preview')).toHaveCount(2)

  const inactiveCard = page
    .locator('.example-card')
    .filter({ has: page.getByRole('button', { name: '실행', exact: true }) })
    .first()
  const exampleId = await inactiveCard.getAttribute('data-example-id')
  const selectedCard = page.locator(`[data-example-id="${exampleId}"]`)
  await selectedCard.getByRole('button', { name: '실행', exact: true }).click()

  await expect(selectedCard.getByTestId('codepen-preview')).toHaveCount(1)
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
