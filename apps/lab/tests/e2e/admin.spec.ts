import { expect, test } from '@playwright/test'

test('P1-ADMIN-01 owner Candidate Inbox에서 실제 Preview를 확인한다', async ({ page }) => {
  await page.goto('/admin/review')
  await expect(page.getByRole('region', { name: '운영 상태' })).toContainText('환경 local')
  await expect(page.getByRole('region', { name: '운영 상태' })).toContainText('무료 한도 0%')

  await expect(page.getByRole('heading', { name: 'Candidate Inbox' })).toBeVisible()
  await expect(page.getByRole('region', { name: '자동 사전 분류' })).toContainText('실행 확인 1')
  await expect(page.getByRole('button', { name: /GSAP ScrollTrigger Tutorial/ })).toBeVisible()
  const preview = page.locator('.admin-preview-stage iframe')
  await expect(preview).toHaveAttribute('src', /codepen\.io\/GreenSock\/embed\/LYpgKPe/)
  await expect(page.getByText('실행 화면을 확인했다면 승인 버튼 한 번으로')).toBeVisible()

  await page.getByRole('button', { name: '실행 실패 기록' }).click()
  await expect(page.getByText('실행 실패를 기록했습니다.')).toBeVisible()
  await expect(page.getByRole('region', { name: '자동 사전 분류' })).toContainText('기존 실패 1')
  await expect(page.getByRole('button', { name: '승인 및 공개' })).toBeEnabled()
  await expect(page.getByText('기존 실행 실패가 있어 정상 실행을 다시 확인해야 합니다.')).toBeVisible()
})

test('P1-ADMIN 인증 없는 관리자 API 요청은 401이다', async ({ request }) => {
  const response = await request.get('/api/v1/admin/candidates')
  expect(response.status()).toBe(401)
  expect((await request.get('/api/v1/admin/candidates/triage')).status()).toBe(401)
})

test('공개 화면 푸터에서 관리자 검수 화면으로 이동한다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('contentinfo').getByRole('link', { name: '관리자' }).click()
  await expect(page).toHaveURL(/\/admin\/review$/)
  await expect(page.getByRole('heading', { name: 'Candidate Inbox' })).toBeVisible()
})
