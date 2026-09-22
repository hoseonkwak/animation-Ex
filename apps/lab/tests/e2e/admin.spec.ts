import { expect, test } from '@playwright/test'

test('P1-ADMIN-01 owner Candidate Inbox에서 실제 Preview를 확인한다', async ({ page }) => {
  await page.goto('/admin/review')
  await expect(page.getByRole('region', { name: '운영 상태' })).toContainText('환경 local')
  await expect(page.getByRole('region', { name: '운영 상태' })).toContainText('무료 한도 0%')

  await expect(page.getByRole('heading', { name: 'Candidate Inbox' })).toBeVisible()
  await expect(page.getByRole('button', { name: /GSAP ScrollTrigger Tutorial/ })).toBeVisible()
  const preview = page.locator('.admin-preview-stage iframe')
  await expect(preview).toHaveAttribute('src', /codepen\.io\/GreenSock\/embed\/LYpgKPe/)
  await expect(page.getByRole('button', { name: '승인 및 공개' })).toBeDisabled()

  await page.getByRole('button', { name: '정상 실행 확인' }).click()
  await expect(page.getByText('실행 확인을 저장했습니다.')).toBeVisible()
  await expect(page.getByRole('button', { name: '승인 및 공개' })).toBeEnabled()
})

test('P1-ADMIN 인증 없는 관리자 API 요청은 401이다', async ({ request }) => {
  const response = await request.get('/api/v1/admin/candidates')
  expect(response.status()).toBe(401)
})
