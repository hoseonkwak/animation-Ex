import { expect, test } from '@playwright/test'

test('Practice 홈에서 준비된 Kit 10개를 보고 바로 연습한다', async ({ page }, testInfo) => {
  await page.goto('/practice')
  await expect(page.getByRole('heading', { name: '시작 코드가 있는 예제' })).toBeVisible()
  await expect(page.locator('.practice-kit-grid .example-card')).toHaveCount(10)
  if (process.env.KWAK_CAPTURE_KITS === '1') {
    await page.screenshot({
      path: testInfo.outputPath('practice-home-desktop.png'),
      fullPage: true,
    })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  if (process.env.KWAK_CAPTURE_KITS === '1') {
    await page.screenshot({ path: testInfo.outputPath('practice-home-mobile.png'), fullPage: true })
  }
  const card = page.locator('[data-example-id="entry-basic-1"]')
  await expect(card.getByRole('button', { name: /실행 화면 보기/ })).toBeVisible()
  const thumbnail = card.locator('.preview-thumbnail img')
  await expect(thumbnail).toHaveAttribute('src', '/practice-thumbnails/gsap-basic-tween.png')
  await expect
    .poll(() => thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)
  await card.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await expect(page.getByRole('textbox', { name: 'JavaScript 코드' })).toHaveCount(0)
  await page.getByRole('tab', { name: 'JS' }).click()
  await expect(page.getByRole('textbox', { name: 'JavaScript 코드' })).toHaveValue(/gsap\.to/)
})

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

test('GSAP Kit이 격리 실행 화면에서 움직이고 CodePen에도 같은 버전을 전달한다', async ({
  page,
}) => {
  await page.goto('/examples/gsap-basic-tween')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const box = preview.getByLabel('움직이는 상자')
  await expect(box).toBeVisible()
  await expect
    .poll(() => box.evaluate((element) => (element as HTMLElement).style.transform))
    .toContain('translate')
  const exportData = JSON.parse(
    await page
      .locator('form[action="https://codepen.io/cpe/pen/define/"] input[name="data"]')
      .inputValue(),
  ) as { js_external: string }
  expect(exportData.js_external).toBe('https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js')
  await page.reload()
  await expect(preview.getByLabel('움직이는 상자')).toBeVisible()
  await page.getByRole('button', { name: '원본 참고' }).click()
  await expect(page.getByLabel('원본 참고')).toContainText('GSAP 3.15.0')
})

test('GSAP Kit은 움직임 줄이기 설정에서 최종 상태를 표시한다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/examples/gsap-basic-tween')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const box = page.frameLocator('iframe[title="내 코드 실행 화면"]').getByLabel('움직이는 상자')
  await expect(box).toBeVisible()
  await expect
    .poll(() => box.evaluate((element) => (element as HTMLElement).style.transform))
    .toContain('180px')
})

test('크기·위치 Kit을 실행하고 다시 재생할 수 있다', async ({ page }) => {
  await page.goto('/examples/gsap-basic-transform')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const shape = preview.getByLabel('크기와 위치가 바뀌는 원')
  await expect(shape).toBeVisible()
  await expect
    .poll(() => shape.evaluate((element) => (element as HTMLElement).style.transform))
    .toContain('scale(1.45')
  await preview.getByRole('button', { name: '다시 실행' }).click()
  await expect
    .poll(() => shape.evaluate((element) => (element as HTMLElement).style.transform))
    .not.toContain('scale(1.45')
  await expect
    .poll(() => shape.evaluate((element) => (element as HTMLElement).style.transform))
    .toContain('scale(1.45')
  await page.reload()
  await expect(shape).toBeVisible()
})

test('from·fromTo·timeline Kit이 실제 코드로 순서대로 등장한다', async ({ page }) => {
  await page.goto('/examples/gsap-from-fromto-timeline')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  await expect(preview.getByText('fromTo')).toBeVisible()
  await expect(preview.getByText('timeline', { exact: true })).toBeVisible()
  await preview.getByRole('button', { name: '순서 다시 보기' }).click()
  await expect(preview.locator('.timeline-step')).toHaveCount(3)
  expect(
    await preview
      .locator('.timeline-step')
      .first()
      .evaluate((element) => {
        const gsap = (
          window as unknown as { gsap: { getTweensOf: (target: Element) => unknown[] } }
        ).gsap
        return gsap.getTweensOf(element).length
      }),
  ).toBeGreaterThan(0)
  await expect(page.getByText('정상 실행')).toBeVisible()
  const data = JSON.parse(
    await page
      .locator('form[action="https://codepen.io/cpe/pen/define/"] input[name="data"]')
      .inputValue(),
  ) as { js: string; js_external: string }
  expect(data.js).toContain('gsap.timeline')
  expect(data.js_external).toContain('gsap@3.15.0')
})

test('새 GSAP Kit들은 움직임 줄이기 설정에서 바로 최종 상태를 표시한다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/examples/gsap-basic-transform')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const shape = preview.getByLabel('크기와 위치가 바뀌는 원')
  await expect(shape).toBeVisible()
  expect(await shape.evaluate((element) => (element as HTMLElement).style.transform)).toContain(
    'scale(1.45',
  )

  await page.goto('/examples/gsap-from-fromto-timeline')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const steps = page.frameLocator('iframe[title="내 코드 실행 화면"]').locator('.timeline-step')
  await expect(steps).toHaveCount(3)
  for (const step of await steps.all()) {
    expect(await step.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
  }
})

test('포인터 Kit의 원이 입력을 따라가고 버튼으로 중앙에 돌아온다', async ({ page }) => {
  await page.goto('/examples/gsap-mouse-interaction')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const field = preview.locator('.pointer-field')
  const orb = preview.getByLabel('포인터를 따라 움직이는 원')
  await expect(orb).toBeVisible()
  const start = await orb.evaluate((element) => element.getBoundingClientRect().left)
  await field.hover({ position: { x: 310, y: 100 } })
  await expect
    .poll(() => orb.evaluate((element) => element.getBoundingClientRect().left))
    .toBeGreaterThan(start + 30)
  await preview.getByRole('button', { name: '중앙으로' }).click()
  await expect
    .poll(() => orb.evaluate((element) => element.getBoundingClientRect().left))
    .toBeLessThan(start + 5)
})

test('동적 타임라인 Kit의 세 막대가 순서대로 채워진다', async ({ page }) => {
  await page.goto('/examples/gsap-dynamic-timeline')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const bars = preview.locator('.rhythm-bar')
  await expect(bars).toHaveCount(3)
  await expect
    .poll(() => bars.nth(2).evaluate((element) => getComputedStyle(element).transform))
    .not.toContain('matrix(0,')
  await preview.getByRole('button', { name: '다시 재생' }).click()
  await expect(page.getByText('정상 실행')).toBeVisible()
})

test('텍스트 리빌 Kit의 단어가 나타나고 재생 버튼이 동작한다', async ({ page }) => {
  await page.goto('/examples/gsap-text-reveal')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const words = preview.locator('.reveal-stage h1 span')
  await expect(words).toHaveCount(4)
  await expect
    .poll(() => words.last().evaluate((element) => getComputedStyle(element).opacity))
    .toBe('1')
  await preview.getByRole('button', { name: '다시 보기' }).click()
  await expect
    .poll(() => words.first().evaluate((element) => getComputedStyle(element).opacity))
    .toBe('1')
})

test('컬러 Kit의 배경이 변하고 멈추기 버튼에서 고정된다', async ({ page }) => {
  await page.goto('/examples/gsap-rainbow-background')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const panel = preview.getByLabel('색상이 바뀌는 배경')
  await expect(panel).toBeVisible()
  const initial = await panel.evaluate((element) => getComputedStyle(element).backgroundColor)
  await expect
    .poll(() => panel.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(initial)
  await preview.getByRole('button', { name: '색상 멈추기' }).click()
  await expect(preview.getByRole('button', { name: '색상 이어보기' })).toBeVisible()
  await page.waitForTimeout(100)
  const paused = await panel.evaluate((element) => getComputedStyle(element).backgroundColor)
  await page.waitForTimeout(350)
  expect(await panel.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(paused)
})

test('SVG 선 그리기 Kit은 경로를 실제로 그린 뒤 텍스트를 표시한다', async ({ page }) => {
  await page.goto('/examples/gsap-text-drawing')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const line = preview.locator('.draw-line')
  await expect(line).toBeVisible()
  await expect
    .poll(() => line.evaluate((element) => parseFloat(getComputedStyle(element).strokeDashoffset)))
    .toBe(0)
  await expect(preview.getByRole('heading', { name: '선을 따라, 생각을 잇다' })).toBeVisible()
  await preview.getByRole('button', { name: '다시 그리기' }).click()
  await expect
    .poll(() => line.evaluate((element) => parseFloat(getComputedStyle(element).strokeDashoffset)))
    .toBe(0)
})

test('ScrollTrigger Kit은 실행 화면 내부 스크롤 때 카드를 드러낸다', async ({ page }) => {
  await page.goto('/examples/gsap-scrolltrigger')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  const card = preview.locator('.scroll-card')
  await expect(card).toHaveCSS('visibility', 'hidden')
  await preview.locator('body').evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(card).toBeVisible()
  const data = JSON.parse(
    await page
      .locator('form[action="https://codepen.io/cpe/pen/define/"] input[name="data"]')
      .inputValue(),
  ) as { js_external: string }
  expect(data.js_external).toContain(
    ';https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js',
  )
})

test('추가 Kit은 움직임 줄이기 설정에서 핵심 콘텐츠를 바로 표시한다', async ({ page }) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [slug, selector] of [
    ['gsap-mouse-interaction', '.pointer-orb'],
    ['gsap-dynamic-timeline', '.rhythm-bar'],
    ['gsap-text-reveal', '.reveal-stage h1'],
    ['gsap-rainbow-background', '.color-panel'],
    ['gsap-text-drawing', '.draw-title'],
    ['gsap-scrolltrigger', '.scroll-card'],
  ]) {
    await page.goto(`/examples/${slug}`)
    await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
    const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
    await expect(preview.locator(selector).first(), slug).toBeVisible()
    await expect(page.getByText('정상 실행')).toBeVisible()
  }
  await expect(
    page.frameLocator('iframe[title="내 코드 실행 화면"]').locator('.scroll-card'),
  ).toHaveCSS('visibility', 'visible')
})

test('10개 Kit의 데스크톱·모바일 실행 화면에 가로 잘림이 없다', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const slugs = [
    'interactive-card-hover',
    'gsap-basic-tween',
    'gsap-basic-transform',
    'gsap-from-fromto-timeline',
    'gsap-mouse-interaction',
    'gsap-dynamic-timeline',
    'gsap-text-reveal',
    'gsap-rainbow-background',
    'gsap-text-drawing',
    'gsap-scrolltrigger',
  ]
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    for (const slug of slugs) {
      await page.goto(`/examples/${slug}`)
      await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
      if (viewport.width < 1024) {
        await page.getByRole('link', { name: '이어서 연습' }).click()
        await page.getByRole('tab', { name: '실행 화면' }).click()
      }
      const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
      await expect(preview.locator('main'), slug).toBeVisible()
      const width = await preview.locator('body').evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }))
      expect(width.document, `${slug} @ ${viewport.width}px`).toBeLessThanOrEqual(
        width.viewport + 1,
      )
      if (process.env.KWAK_CAPTURE_KITS === '1') {
        await page
          .locator('iframe[title="내 코드 실행 화면"]')
          .screenshot({ path: testInfo.outputPath(`${slug}-${viewport.width}.png`) })
      }
    }
  }
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

test('예제에서 빈 코드 연습을 시작하고 저장된 코드가 실행·복원된다', async ({ page }) => {
  await page.goto('/examples/gsap-scrollsmoother')
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

test('같은 예제에 다시 들어오면 기존 초안 보존과 새 초안 생성을 선택한다', async ({ page }) => {
  await page.goto('/examples/gsap-basic-transform')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  const firstUrl = page.url()
  await page.getByRole('textbox', { name: 'HTML 코드' }).fill('<main>내가 수정한 버전</main>')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await page.route('**/api/v1/examples/gsap-basic-transform/practice-kit', async (route) => {
    const response = await route.fetch()
    const body = (await response.json()) as {
      data: { versionId: string; code: { html: string } }
    }
    body.data.versionId = 'practice-basic-transform-v3'
    body.data.code.html = body.data.code.html.replace('</main>', '<p>새 버전</p></main>')
    await route.fulfill({ response, json: body })
  })
  await page.goto('/examples/gsap-basic-transform')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  await expect(page.getByRole('heading', { name: '이 예제를 연습한 기록이 있어요.' })).toBeVisible()
  await page.getByRole('link', { name: '이어서 연습' }).click()
  await expect(page).toHaveURL(firstUrl)
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toHaveValue(
    '<main>내가 수정한 버전</main>',
  )
  await page.getByRole('button', { name: '원본 참고' }).click()
  await expect(page.getByLabel('원본 참고')).toContainText('practice-basic-transform-v2')
  await page.goto('/examples/gsap-basic-transform')
  await page.getByRole('link', { name: '시작 코드로 연습하기' }).click()
  await page.getByRole('button', { name: '새로 시작' }).click()
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  expect(page.url()).not.toBe(firstUrl)
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toHaveValue(/새 버전/)
  await page.getByRole('button', { name: '원본 참고' }).click()
  await expect(page.getByLabel('원본 참고')).toContainText('practice-basic-transform-v3')
  await page.goto(firstUrl)
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toHaveValue(
    '<main>내가 수정한 버전</main>',
  )
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

test('320px 화면에서 연습 편집기와 실행 조작이 가로로 잘리지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await expect(page.getByRole('textbox', { name: 'HTML 코드' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await page.getByRole('tab', { name: '실행 화면' }).click()
  await expect(page.locator('iframe[title="내 코드 실행 화면"]')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
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
  await expect(
    page.getByRole('status').filter({ hasText: 'CodePen 새 창이 열리지 않았다면' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '복사 가능한 코드 보기' }).click()
  await expect(page.locator('#practice-copy-html')).toHaveValue('<main>내 코드</main>')
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
      "try { parent.document.title = 'unsafe' } catch { console.log('parent blocked') }; try { localStorage.getItem('kwak-motion:theme') } catch { console.log('storage blocked') }; try { top.location.href = '/api/v1/health' } catch { console.log('top blocked') }; try { console.log(window.open('/api/v1/health') ? 'popup opened' : 'popup blocked') } catch { console.log('popup blocked') }; const form = document.createElement('form'); form.action = '/api/v1/health'; document.body.append(form); form.submit(); fetch('/api/v1/health').catch(() => console.log('network blocked'))",
    )
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  const consoleButton = page.getByRole('button', { name: /^Console/ })
  await expect(consoleButton).toContainText(/Console [1-9]/)
  if ((await consoleButton.getAttribute('aria-expanded')) === 'false') await consoleButton.click()
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

test('연습 코드가 파일 다운로드를 시작하지 못한다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  const downloads: string[] = []
  page.on('download', (download) => downloads.push(download.suggestedFilename()))
  await page.getByRole('tab', { name: 'JS' }).click()
  await page
    .getByRole('textbox', { name: 'JavaScript 코드' })
    .fill(
      "const link = document.createElement('a'); link.href = 'data:text/plain,blocked'; link.download = 'blocked.txt'; document.body.append(link); link.click(); console.log('download attempted')",
    )
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  const consoleButton = page.getByRole('button', { name: /^Console/ })
  await expect(consoleButton).toContainText(/Console [1-9]/)
  if ((await consoleButton.getAttribute('aria-expanded')) === 'false') await consoleButton.click()
  await expect(page.getByRole('log')).toContainText('download attempted')
  await page.waitForTimeout(300)
  expect(downloads).toEqual([])
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await expect(page.locator('iframe[title="내 코드 실행 화면"]')).toHaveAttribute(
    'sandbox',
    'allow-scripts',
  )
})

test('이전 실행에서 늦게 발생한 로그가 새 실행 화면에 섞이지 않는다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('tab', { name: 'JS' }).click()
  const editor = page.getByRole('textbox', { name: 'JavaScript 코드' })
  await editor.fill("setTimeout(() => console.log('stale run'), 700)")
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await editor.fill("console.log('current run')")
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  const consoleButton = page.getByRole('button', { name: /^Console/ })
  await expect(consoleButton).toContainText(/Console [1-9]/)
  if ((await consoleButton.getAttribute('aria-expanded')) === 'false') await consoleButton.click()
  await expect(page.getByRole('log')).toContainText('current run')
  await page.waitForTimeout(800)
  await expect(page.getByRole('log')).not.toContainText('stale run')
})

test('코드 오류를 Console에 표시하고 고친 코드를 다시 실행한다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('tab', { name: 'JS' }).click()
  const editor = page.getByRole('textbox', { name: 'JavaScript 코드' })
  await editor.fill("throw new Error('practice failure')")
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('코드 오류')).toBeVisible()
  await expect(page.getByRole('log')).toContainText('practice failure')
  await editor.fill("console.log('practice recovered')")
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('정상 실행')).toBeVisible()
  await expect(page.getByRole('log')).toContainText('practice recovered')
  await expect(page.getByRole('log')).not.toContainText('practice failure')
})

test('비동기 오류의 메시지를 Console에 표시한다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('tab', { name: 'JS' }).click()
  await page
    .getByRole('textbox', { name: 'JavaScript 코드' })
    .fill("Promise.reject(new Error('async practice failure'))")
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('코드 오류')).toBeVisible()
  await expect(page.getByRole('log')).toContainText('async practice failure')
})

test('구문 오류를 코드 오류로 표시한다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page.getByRole('tab', { name: 'JS' }).click()
  await page.getByRole('textbox', { name: 'JavaScript 코드' }).fill('const broken = ;')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('코드 오류')).toBeVisible()
  await expect(page.getByRole('log')).not.toContainText('Script error.')
})

test('HTML 이벤트 속성에서 사용자 JavaScript 함수를 호출할 수 있다', async ({ page }) => {
  await page.goto('/practice/new')
  await expect(page).toHaveURL(/\/practice\/drafts\/[a-f0-9-]+$/)
  await page
    .getByRole('textbox', { name: 'HTML 코드' })
    .fill('<button onclick="changeText()">누르기</button><p>기다림</p>')
  await page.getByRole('tab', { name: 'JS' }).click()
  await page
    .getByRole('textbox', { name: 'JavaScript 코드' })
    .fill("function changeText() { document.querySelector('p').textContent = '실행됨' }")
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  const preview = page.frameLocator('iframe[title="내 코드 실행 화면"]')
  await preview.getByRole('button', { name: '누르기' }).click()
  await expect(preview.locator('p')).toHaveText('실행됨')
})

test('원본 참고는 요청할 때만 Embed를 시작하고 닫으면 제거한다', async ({ page }) => {
  await page.goto('/examples/gsap-scrollsmoother')
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
