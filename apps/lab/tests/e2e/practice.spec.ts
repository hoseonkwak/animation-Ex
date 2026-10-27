import { expect, test } from '@playwright/test'

test('준비된 Kit에서 자체 시작 코드를 불러오고 초기화해도 같은 버전을 유지한다', async ({
  page,
}) => {
  await page.goto('/examples/interactive-card-hover')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const card = preview.getByRole('button', { name: /움직이는 카드/ })
  await expect(card).toBeVisible()
  await card.hover({ position: { x: 30, y: 30 } })
  await expect
    .poll(() => card.evaluate((element) => (element as HTMLElement).style.getPropertyValue('--ry')))
    .not.toBe('0.0deg')
  await page.getByRole('button', { name: '원본 참고' }).click()
  await expect(page.getByLabel('원본 참고')).toContainText('practice-card-hover-v1')
  await page.getByLabel('원본 참고').getByRole('button', { name: '닫기' }).click()
  await page.getByRole('textbox', { name: 'HTML 코드' }).fill('<main>직접 수정</main>')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(preview.locator('main')).toHaveText('직접 수정')
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: '초기화' }).click()
  await expect(preview.getByRole('button', { name: /움직이는 카드/ })).toBeVisible()
  await page.reload()
  await expect(preview.getByRole('button', { name: /움직이는 카드/ })).toBeVisible()
})

test('Dark 테마와 움직임 줄이기 설정을 작업 공간과 Kit에 적용한다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => localStorage.setItem('kwak-motion:theme', 'dark'))
  await page.goto('/examples/interactive-card-hover')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const card = page
    .frameLocator('iframe[title="내 코드 실행 화면"]')
    .getByRole('button', { name: /움직이는 카드/ })
  await expect(card).toBeVisible()
  expect(await card.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s')
})

test('Kit을 불러오지 못하면 오류를 알리고 같은 예제를 빈 코드로 연습할 수 있다', async ({
  page,
}) => {
  await page.route('**/api/v1/examples/interactive-card-hover/practice-kit', (route) =>
    route.fulfill({ status: 503, body: '{}' }),
  )
  await page.goto('/examples/interactive-card-hover')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  await expect(page.getByText('시작 코드를 불러오지 못했습니다.')).toBeVisible()
  await page.getByRole('button', { name: '빈 코드로 시작' }).click()
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await expect(page.frameLocator('iframe[title="내 코드 실행 화면"]').locator('.stage')).toHaveText(
    '여기에서 시작해보세요',
  )
})

test('예제에서 빈 코드 연습을 시작하고 저장된 코드가 실행·복원된다', async ({ page, request }) => {
  const response = await request.get('/api/v1/examples?limit=1')
  const first = (await response.json()).data.items[0] as { slug: string }
  await page.goto(`/examples/${first.slug}`)
  await page.getByRole('link', { name: '빈 코드로 연습하기' }).click()

  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  await expect(preview.locator('.stage')).toHaveText('여기에서 시작해보세요')

  await page
    .getByRole('textbox', { name: 'HTML 코드' })
    .fill('<main id="result">직접 만든 화면</main>')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(preview.locator('#result')).toHaveText('직접 만든 화면')
  await expect(page.getByText('저장됨', { exact: true })).toBeVisible()
  const exportForm = page.locator('form[action="https://codepen.io/cpe/pen/define/"]')
  await expect(exportForm).toHaveAttribute('method', 'post')
  const exportData = JSON.parse(await exportForm.locator('input[name="data"]').inputValue()) as {
    html: string
  }
  expect(exportData.html).toBe('<main id="result">직접 만든 화면</main>')
  await page.getByRole('button', { name: '코드 복사' }).click()
  await expect(page.locator('#practice-copy-html')).toHaveValue(
    '<main id="result">직접 만든 화면</main>',
  )
  await page.getByRole('button', { name: '닫기' }).click()

  await page.reload()
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toHaveValue(
    '<main id="result">직접 만든 화면</main>',
  )
  await expect(preview.locator('#result')).toHaveText('직접 만든 화면')
})

test('좁은 화면에서는 코드와 실행 화면을 탭으로 전환한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toBeVisible()
  await expect(page.locator('iframe[title="내 코드 실행 화면"]')).toHaveCount(0)
  await page.getByRole('tab', { name: '실행 화면' }).click()
  await expect(page.locator('iframe[title="내 코드 실행 화면"]')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toBeHidden()
  await page.getByRole('tab', { name: '코드', exact: true }).click()
  await expect(page.locator('iframe[title="내 코드 실행 화면"]')).toHaveCount(0)
})

test('데스크톱 편집기 폭을 키보드로 조절하고 복원한다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  const divider = page.getByRole('separator', { name: '편집기와 실행 화면 폭 조절' })
  await expect(divider).toHaveAttribute('aria-valuenow', '50')
  await divider.focus()
  await divider.press('ArrowRight')
  await expect(divider).toHaveAttribute('aria-valuenow', '55')
  await page.reload()
  await expect(divider).toHaveAttribute('aria-valuenow', '55')
})

test('연습 이름을 바꾸면 새로고침과 최근 연습 목록에 유지된다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('textbox', { name: '연습 이름' }).fill('스크롤 카드 연습')
  await expect(page.getByText('저장 중', { exact: true })).toBeVisible()
  await expect(page.getByText('저장됨', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('textbox', { name: '연습 이름' })).toHaveValue('스크롤 카드 연습')
  await page.getByRole('link', { name: '연습 목록으로' }).click()
  await expect(page.getByRole('link', { name: '스크롤 카드 연습' })).toBeVisible()
})

test('초기화 전에 현재 코드를 보관하고 이전 코드로 복구한다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('textbox', { name: 'HTML 코드' }).fill('<main>복구할 내용</main>')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: '초기화' }).click()
  await expect(page.getByRole('button', { name: '이전 코드 복구' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toHaveValue(
    '<main class="stage">여기에서 시작해보세요</main>',
  )
  await page.reload()
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: '이전 코드 복구' }).click()
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toHaveValue(
    '<main>복구할 내용</main>',
  )
})

test('CodePen 내보내기는 버튼을 눌렀을 때 현재 코드를 POST한다', async ({ page }) => {
  let submitted: string | null = null
  await page.context().route('https://codepen.io/cpe/pen/define/', async (route) => {
    submitted = route.request().postData()
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<title>CodePen test</title>',
    })
  })
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('textbox', { name: 'HTML 코드' }).fill('<main>내 코드</main>')
  expect(submitted).toBeNull()
  const popup = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'CodePen으로 보내기' }).click()
  await popup
  await expect.poll(() => submitted).not.toBeNull()
  const body = new URLSearchParams(submitted ?? '')
  const data = JSON.parse(body.get('data') ?? '{}') as { html: string }
  expect(data.html).toBe('<main>내 코드</main>')
})

test('손상된 초안은 삭제하지 않고 목록과 작업 공간에 오류를 표시한다', async ({ page }) => {
  await page.goto('/practice')
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kwak-motion-practice', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite')
      transaction.objectStore('drafts').put({ id: 'bad-draft', title: '손상된 초안', code: null })
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
    db.close()
  })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('손상된 연습 기록 1개')
  await page.goto('/practice/drafts/bad-draft')
  await expect(page.getByRole('heading', { name: '연습 공간을 열 수 없습니다.' })).toBeVisible()
  await expect(page.getByText('데이터는 삭제하지 않았습니다.')).toBeVisible()
})

test('브라우저 저장에 실패하면 자동 실행을 멈추고 코드 복사 경로를 남긴다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.evaluate(() => {
    Object.defineProperty(IDBObjectStore.prototype, 'put', {
      configurable: true,
      value: () => {
        throw new DOMException('Storage full', 'QuotaExceededError')
      },
    })
  })
  await page.getByRole('textbox', { name: 'HTML 코드' }).fill('<main>잃으면 안 되는 코드</main>')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('브라우저에 코드를 저장하지 못했습니다')
  await expect(page.getByRole('button', { name: '자동 실행 꺼짐' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await page.getByRole('button', { name: '코드 복사' }).click()
  await expect(page.locator('#practice-copy-html')).toHaveValue('<main>잃으면 안 되는 코드</main>')
  await page.getByRole('button', { name: '닫기' }).click()
  await page.getByRole('button', { name: '저장 없이 한 번 실행' }).click()
  await expect(page.frameLocator('iframe[title="내 코드 실행 화면"]').locator('main')).toHaveText(
    '잃으면 안 되는 코드',
  )
})

test('연습 코드가 부모 앱에 접근하지 못하고 네트워크 요청이 차단된다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/health')) requests.push(request.url())
  })
  await page.getByRole('tab', { name: 'JS' }).click()
  await page
    .getByRole('textbox', { name: 'JavaScript 코드' })
    .fill(
      "try { parent.document.title = 'unsafe' } catch { console.log('parent blocked') }; try { localStorage.getItem('kwak-motion:theme') } catch { console.log('storage blocked') }; try { top.location.href = '/api/v1/health' } catch { console.log('top blocked') }; console.log(window.open('/api/v1/health') ? 'popup opened' : 'popup blocked'); const form = document.createElement('form'); form.action = '/api/v1/health'; document.body.append(form); form.submit(); fetch('/api/v1/health').catch(() => console.log('network blocked'))",
    )
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await page.getByRole('button', { name: /^Console/ }).click()
  await expect(page.getByRole('log')).toContainText('parent blocked')
  await expect(page.getByRole('log')).toContainText('storage blocked')
  await expect(page.getByRole('log')).toContainText('top blocked')
  await expect(page.getByRole('log')).toContainText('popup blocked')
  await expect(page.getByRole('log')).toContainText('network blocked')
  expect(await page.title()).not.toBe('unsafe')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  expect(requests).toHaveLength(0)
  await expect(page.locator('iframe[title="내 코드 실행 화면"]')).toHaveAttribute(
    'sandbox',
    'allow-scripts',
  )
})

test('연습 코드가 iframe을 앱 API로 이동시키면 접근을 거절한다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('tab', { name: 'JS' }).click()
  await page
    .getByRole('textbox', { name: 'JavaScript 코드' })
    .fill("location.href = '/api/v1/health'")
  const denied = page.waitForResponse((response) => response.url().includes('/api/v1/health'))
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  const response = await denied
  expect(response.status()).toBe(403)
  expect(response.headers()['x-frame-options']).toBe('DENY')
})

test('원본 참고는 요청할 때만 Embed를 시작하고 닫으면 제거한다', async ({ page, request }) => {
  const response = await request.get('/api/v1/examples?limit=1')
  const first = (await response.json()).data.items[0] as { slug: string }
  await page.goto(`/examples/${first.slug}`)
  await page.getByRole('link', { name: '빈 코드로 연습하기' }).click()
  await page.getByRole('button', { name: '원본 참고' }).click()
  const panel = page.getByLabel('원본 참고')
  await expect(panel.locator('iframe')).toHaveCount(0)
  await panel.getByRole('button', { name: '원본 실행 화면 보기' }).click()
  await expect(panel.locator('iframe')).toHaveCount(1)
  await panel.getByRole('button', { name: '닫기' }).click()
  await expect(panel).toHaveCount(0)
})

test('연속된 실행 환경 중단 뒤 자동 실행을 멈추고 정상 실행으로 복구한다', async ({ page }) => {
  test.setTimeout(40_000)
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('tab', { name: 'JS' }).click()
  await page.getByRole('textbox', { name: 'JavaScript 코드' }).fill('window.setInterval = () => 0')
  const run = page.getByRole('button', { name: 'Run', exact: true })
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await run.click()
    await expect(page.getByText('정상 실행')).toBeVisible()
    await expect(page.getByText('응답 없음')).toBeVisible({ timeout: 8_000 })
  }
  await expect(page.getByRole('button', { name: '자동 실행 꺼짐' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByRole('alert')).toContainText('연속 3회 응답하지 않아')
  await page.getByRole('textbox', { name: 'JavaScript 코드' }).fill('console.log("다시 실행됨")')
  await run.click()
  await expect(page.getByText('정상 실행')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 5_000 })
})

test('과도한 Console 출력을 50개와 메시지당 500자로 제한한다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('tab', { name: 'JS' }).click()
  await page
    .getByRole('textbox', { name: 'JavaScript 코드' })
    .fill('for (let i = 0; i < 100; i++) console.log(String(i).padStart(3, "0") + "x".repeat(600))')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await page.getByRole('button', { name: 'Console 50' }).click()
  const entries = page.getByRole('log').locator('p')
  await expect(entries).toHaveCount(50)
  expect((await entries.first().textContent())?.length).toBeLessThanOrEqual(500)
  await expect(entries.last()).toContainText('099')
})

test('화면 설정 저장소가 막혀도 IndexedDB 초안을 편집하고 실행한다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.addInitScript(() => {
    const read = Storage.prototype.getItem
    const write = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('kwak-motion:practice')) throw new DOMException('Blocked', 'SecurityError')
      return read.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('kwak-motion:practice')) throw new DOMException('Blocked', 'SecurityError')
      return write.call(this, key, value)
    }
  })
  await page.reload()
  await page.getByRole('textbox', { name: 'HTML 코드' }).fill('<main>저장소 분리</main>')
  await page.getByRole('button', { name: '자동 실행 켜짐' }).click()
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.frameLocator('iframe[title="내 코드 실행 화면"]').locator('main')).toHaveText(
    '저장소 분리',
  )
  await expect(page.getByText('저장됨', { exact: true })).toBeVisible()
})
