import { expect, test } from '@playwright/test'

test('상세에서 출처를 확인하고 Saved 목록을 브라우저에 보존한다', async ({ page }) => {
  await page.goto('/examples/gsap-basic-tween')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('GSAP 기초 예제 1')
  await expect(page.getByText('Created by hoseonkwak')).toBeVisible()
  await expect(page.locator('.detail-frame iframe')).toHaveAttribute(
    'src',
    /codepen\.io\/hoseonkwak\/embed\/LEVeYQO/,
  )

  await page.getByRole('button', { name: '저장', exact: true }).click()
  await page.getByRole('button', { name: '나중에 연습', exact: true }).click()
  await expect(page.getByRole('button', { name: '저장됨' })).toBeVisible()
  await page.goto('/saved')
  await expect(page.getByRole('link', { name: 'GSAP 기초 예제 1' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: 'GSAP 기초 예제 1' })).toBeVisible()
  await page.getByRole('tab', { name: /나중에 연습 1/ }).click()
  await expect(page.getByRole('link', { name: 'GSAP 기초 예제 1' })).toBeVisible()
})

test('Sections에서 공개 예제가 있는 Hero 영역만 탐색한다', async ({ page }) => {
  await page.goto('/sections')
  const hero = page.getByRole('link', { name: /히어로/ })
  await expect(hero).toContainText('1개')
  await hero.click()
  await expect(page).toHaveURL('/sections/hero')
  await expect(page.locator('.example-card')).toHaveCount(1)
})

test('URL 제보는 중복 여부를 공개하지 않고 같은 성공 화면을 반환한다', async ({ page }) => {
  await page.goto('/submit')
  const url = 'https://example.com/inspiring-motion'
  await page.getByLabel('URL', { exact: true }).fill(url)
  await page.getByRole('button', { name: '제보하기' }).click()
  await expect(page.getByRole('heading', { name: '제보를 접수했습니다.' })).toBeVisible({
    timeout: 15_000,
  })

  await page.getByRole('button', { name: '다른 URL 제보' }).click()
  await page.getByLabel('URL', { exact: true }).fill(url)
  await page.getByRole('button', { name: '제보하기' }).click()
  await expect(page.getByRole('heading', { name: '제보를 접수했습니다.' })).toBeVisible({
    timeout: 15_000,
  })
})

test('선택한 Dark 테마를 새로고침 뒤 복원한다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
})
test('Phase 1 Header에는 Practice와 Learn 진입점이 없다', async ({ page }) => {
  await page.goto('/about')
  const header = page.locator('.site-header')
  await expect(header.getByRole('link', { name: 'Explore' })).toBeVisible()
  await expect(header.getByText('Practice', { exact: true })).toHaveCount(0)
  await expect(header.getByText('Learn', { exact: true })).toHaveCount(0)
})

test('알 수 없는 공개 경로는 404와 noindex를 제공한다', async ({ page }) => {
  await page.goto('/missing-public-page')
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
})
