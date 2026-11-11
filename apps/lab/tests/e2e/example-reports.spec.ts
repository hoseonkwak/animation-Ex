import { expect, test } from '@playwright/test'

test('예제 문제 신고를 관리자가 확인하고 처리한다', async ({ page }) => {
  await page.goto('/examples/gsap-basic-tween')
  await page.getByRole('link', { name: '문제 신고', exact: true }).click()
  await expect(page).toHaveURL(/#report-example$/)
  await page.getByLabel('문제 유형').selectOption('not-working')
  await page
    .getByLabel(/자세한 설명/)
    .fill('실행 화면이 비어 있고 다시 실행해도 동작하지 않습니다.')
  await page.getByRole('button', { name: '문제 신고하기' }).click()
  await expect(page.getByText('신고를 접수했습니다.')).toBeVisible()

  await page.goto('/admin/review')
  const panel = page.getByRole('region', { name: '예제 문제 신고' })
  await expect(panel.getByRole('heading', { name: /예제 문제 신고/ })).toContainText('1')
  await expect(panel.getByLabel('신고된 예제')).toContainText('GSAP 기초 예제 1')
  await panel.getByLabel('처리 근거').fill('실행 화면 오류를 직접 확인했습니다.')
  await panel.getByRole('button', { name: '신고 닫기' }).click()
  await expect(panel.getByText('신고를 닫았습니다.')).toBeVisible()
  await expect(panel.getByText('미처리 신고가 없습니다.')).toBeVisible()

  await page.goto('/examples/gsap-basic-tween')
  await expect(page.getByRole('heading', { name: 'GSAP 기초 예제 1' })).toBeVisible()
})
