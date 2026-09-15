import { expect, test } from '@playwright/test'

test('P1-UX-01 Vue 애플리케이션이 로드된다', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('좋은 움직임을 찾고')
})

test('WP0 Worker health API가 개발 서버에서 응답한다', async ({ request }) => {
  const response = await request.get('/api/v1/health')
  const body = await response.json()

  expect(response.ok()).toBe(true)
  expect(body.data).toEqual({ service: 'kwak-motion-lab', status: 'ok' })
  expect(body.meta.requestId).toBeTruthy()
})
