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

test('홈은 첫 12개에서 끝나고 푸터까지 내려갈 수 있다', async ({ page }) => {
  let exampleRequests = 0
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/api/v1/examples' && url.searchParams.get('sort') === 'featured') {
      exampleRequests += 1
    }
  })

  await page.goto('/')
  await expect(page.locator('.example-card')).toHaveCount(12)
  await expect(page.getByRole('link', { name: '전체 예제 탐색하기' })).toHaveAttribute(
    'href',
    '/explore',
  )

  await page.locator('.site-footer').scrollIntoViewIfNeeded()
  await expect(page.locator('.site-footer')).toBeInViewport()
  await expect(page.locator('.example-card')).toHaveCount(12)
  expect(exampleRequests).toBe(1)
})

test('홈 미리보기를 누르면 큰 모달에서만 CodePen이 실행되고 닫으면 제거된다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/')

  const firstCard = page.getByTestId('home-example-grid').locator('.example-card').first()
  const trigger = firstCard.locator('.preview-thumbnail')
  await trigger.click()
  await expect(page.getByRole('dialog', { name: /미리보기/ })).toBeVisible()
  await expect(page.getByTestId('codepen-preview')).toHaveAttribute(
    'src',
    /https:\/\/codepen\.io\/hoseonkwak\/embed\//,
  )
  await expect(page.getByTestId('codepen-preview')).toHaveCount(1)
  await expect(page.locator('.preview-thumbnail')).toHaveCount(12)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /미리보기/ })).not.toBeVisible()
  await expect(page.getByTestId('codepen-preview')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('작은 화면에서는 미리보기가 화면 전체를 사용한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const trigger = page.locator('.preview-thumbnail').first()
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: /미리보기/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: '미리보기 닫기' })).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'CodePen 열기' })).toBeVisible()
  await expect(dialog.locator('iframe')).toBeVisible()
  const bounds = await dialog.boundingBox()
  expect(bounds?.width).toBe(390)
  expect(bounds?.height).toBe(844)

  await dialog.getByRole('button', { name: '미리보기 닫기' }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
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

test('넓은 화면에서도 탐색 제목의 조사가 혼자 줄바꿈되지 않는다', async ({ page }) => {
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/explore')
    const heading = page.locator('.explore-copy h1')
    const layout = await heading.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        lines: element.getBoundingClientRect().height / Number.parseFloat(style.lineHeight),
        contentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }
    })
    expect(layout.lines).toBeCloseTo(2, 1)
    expect(layout.contentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1)
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

test('다른 예제 미리보기를 열 때 이전 iframe을 제거한다', async ({ page }) => {
  await page.goto('/explore')
  await expect(page.locator('.example-card')).toHaveCount(12)
  await expect(page.locator('.preview-thumbnail img')).toHaveCount(12)
  await expect(page.getByTestId('codepen-preview')).toHaveCount(0)

  const cards = page.locator('.example-card')
  await cards.nth(0).locator('.preview-thumbnail').click()
  await expect(page.getByTestId('codepen-preview')).toHaveCount(1)
  await page.getByRole('button', { name: '미리보기 닫기' }).click()
  await expect(page.getByTestId('codepen-preview')).toHaveCount(0)
  await cards.nth(1).locator('.preview-thumbnail').click()
  await expect(page.getByRole('dialog', { name: /미리보기/ })).toBeVisible()
  await expect(page.getByTestId('codepen-preview')).toHaveCount(1)
})

test('예제 그리드를 2·3·4열로 바꾸고 선택을 기억한다', async ({ page }) => {
  const columns = () =>
    page
      .getByTestId('example-grid')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/explore')
  await expect(page.locator('.example-card')).toHaveCount(12)
  expect(await columns()).toBe(3)

  await page.getByRole('button', { name: '크게 보기 · 2열' }).click()
  expect(await columns()).toBe(2)
  await page.getByRole('button', { name: '촘촘히 보기 · 4열' }).click()
  expect(await columns()).toBe(4)
  await page.reload()
  await expect(page.getByRole('button', { name: '촘촘히 보기 · 4열' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(await columns()).toBe(4)

  await page.setViewportSize({ width: 1024, height: 900 })
  await page.getByRole('button', { name: '기본 보기 · 3열' }).click()
  expect(await columns()).toBe(3)

  await page.setViewportSize({ width: 768, height: 900 })
  expect(await columns()).toBe(3)

  await page.setViewportSize({ width: 640, height: 900 })
  await expect(page.getByRole('group', { name: '예제 보기 방식' })).toBeHidden()
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
