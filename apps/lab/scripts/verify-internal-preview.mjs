import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { createHash } from 'node:crypto'
const root = path.resolve(import.meta.dirname, '..')
const stage = path.join(root, '.wrangler/internal-preview')
const catalog = JSON.parse(await readFile(path.join(stage, 'catalog.json'), 'utf8'))
const reportPath = path.resolve(root, '../../docs/evidence/SELF_HOSTED_RELEASE_2026-11-18.json')
const browser = await chromium.launch()
const report = {
  checkedAt: new Date().toISOString(),
  validator: 'packaged-sandbox-and-official-live-view-v1',
  complete: false,
  items: [],
}
if (process.env.VERIFY_SLUGS) {
  const previous = JSON.parse(await readFile(reportPath, 'utf8'))
  report.items = previous.items.filter(
    (item) => !process.env.VERIFY_SLUGS.split(',').includes(item.slug),
  )
}
const codepenHost = (host) =>
  /(^|\.)(codepen\.io|cdpn\.io|codepen\.dev|codepenusercontent\.com|pens\.io)$/.test(host)
try {
  for (const [slug, item] of Object.entries(catalog)) {
    if (process.env.VERIFY_SLUGS && !process.env.VERIFY_SLUGS.split(',').includes(slug)) continue
    const penId = new URL(item.canonicalUrl).pathname.split('/').at(-1)
    const referenceUrl = `https://${penId}.codepen.dev/`
    const result = {
      slug,
      version: item.version,
      artifactSha256: createHash('sha256').update(JSON.stringify(item.hashes)).digest('hex'),
      files: item.hashes,
      referenceUrl,
      runtime: 'failed',
      visual: 'not-tested',
      views: [],
    }
    report.items.push(result)
    const context = await browser.newContext()
    context.setDefaultTimeout(30000)
    try {
      await context.addInitScript(() => {
        let seed = 42
        Math.random = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0
          return seed / 4294967296
        }
      })
      for (const viewport of [
        { width: 1280, height: 800 },
        { width: 390, height: 844 },
      ]) {
        const capture = async (original) => {
          const page = await context.newPage({ viewport })
          await page.setViewportSize(viewport)
          const errors = []
          const blocked = []
          if (!original)
            await page.route('**/*', async (route) => {
              if (codepenHost(new URL(route.request().url()).hostname)) {
                blocked.push(route.request().url())
                await route.abort()
              } else await route.continue()
            })
          page.on('pageerror', (error) => errors.push(error.message))
          page.on('response', (r) => {
            if (r.status() >= 400) errors.push(`HTTP_${r.status()}: ${r.url()}`)
          })
          page.on('console', (m) => {
            if (m.type() === 'error') errors.push(m.text().slice(0, 300))
          })
          if (original) {
            const response = await page.goto(referenceUrl, { waitUntil: 'domcontentloaded' })
            if ([403, 429].includes(response.status()))
              throw new Error('REFERENCE_ACCESS_DENIED_' + response.status())
          } else {
            await page.goto('http://127.0.0.1:5175/__verify__')
            await page.locator('iframe').evaluate((frame, url) => {
              frame.src = url
            }, `http://127.0.0.1:5175/runtime/${slug}/${item.version}/index.html`)
          }
          const scope = original ? page : page.frameLocator('iframe')
          await scope.locator('body').waitFor({ state: 'attached' })
          await page.waitForTimeout(2500)
          const content = await scope.locator('body').evaluate(() => ({
            children: document.body.children.length,
            text: document.body.innerText.slice(0, 200),
            overflow: document.documentElement.scrollWidth > innerWidth + 2,
            clippedBySource: [
              getComputedStyle(document.documentElement).overflowX,
              getComputedStyle(document.body).overflowX,
            ].some((value) => ['clip', 'hidden'].includes(value)),
          }))
          const first = original
            ? await page.screenshot({ timeout: 30000 })
            : await page.locator('iframe').screenshot({ timeout: 30000 })
          await page.waitForTimeout(500)
          const second = original
            ? await page.screenshot({ timeout: 30000 })
            : await page.locator('iframe').screenshot({ timeout: 30000 })
          let interaction = 'not-applicable'
          if (slug === 'bulk-01m6n39yq3hceq7ajctb3yv4cm') {
            const toggle = scope.getByRole('switch')
            const before = await toggle.isChecked()
            await scope.locator('label.switch').click()
            await page.waitForTimeout(750)
            const after = await toggle.isChecked()
            interaction = before !== after ? 'passed' : 'failed'
            if (interaction === 'failed') errors.push('SWITCH_DID_NOT_CHANGE')
          }
          if (slug === 'bulk-01m6n39xk7gatbnh58nn7pxzea') {
            const toggle = scope.getByRole('switch')
            const before = await toggle.isChecked()
            await scope.locator('label.morph-toggle').click()
            interaction = (await toggle.isChecked()) !== before ? 'passed' : 'failed'
            if (interaction === 'failed') errors.push('MORPH_DID_NOT_CHANGE')
          }
          if (slug === 'bulk-01m6n3abcr25jbxgwkr5nnxakx') {
            await scope.locator('label[for="option-1"]').click()
            interaction = (await scope.locator('#option-1').isChecked()) ? 'passed' : 'failed'
            if (interaction === 'failed') errors.push('RADIO_DID_NOT_CHANGE')
          }
          if (
            ['bulk-01m6n39z35d5myxhfy1zfc0wm9', 'bulk-01m6n3a36jehzat4cv2qg3yza1'].includes(slug)
          ) {
            await scope.locator('button').first().hover()
            await page.waitForTimeout(600)
            const hoverImage = original
              ? await page.screenshot()
              : await page.locator('iframe').screenshot()
            interaction = !first.equals(hoverImage) ? 'passed' : 'failed'
            if (interaction === 'failed') errors.push('HOVER_DID_NOT_CHANGE')
          }
          const folder = path.join(stage, 'evidence', slug)
          await mkdir(folder, { recursive: true })
          await writeFile(
            path.join(folder, `${original ? 'original' : 'local'}-${viewport.width}.png`),
            first,
          )
          await page.close()
          return {
            bytes: first,
            motion: !first.equals(second),
            errors: [...new Set(errors)],
            blocked,
            content,
            interaction,
          }
        }
        const local = await capture(false)
        const original = await capture(true)
        const a = PNG.sync.read(local.bytes),
          b = PNG.sync.read(original.bytes)
        const ratio =
          pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.15 }) /
          (a.width * a.height)
        result.views.push({
          ...viewport,
          localErrors: local.errors,
          referenceErrors: original.errors,
          blockedCodepen: local.blocked,
          localContent: local.content,
          motion: local.motion,
          interaction: local.interaction,
          differingPixelRatio: ratio,
          runtimePassed:
            local.errors.length === 0 &&
            local.blocked.length === 0 &&
            local.content.children > 0 &&
            (!local.content.overflow || local.content.clippedBySource),
          visualPassed: original.errors.length === 0 && ratio <= 0.05,
        })
      }
      result.runtime =
        result.views.length === 2 && result.views.every((v) => v.runtimePassed)
          ? 'passed'
          : 'failed'
      result.visual =
        result.views.length === 2 && result.views.every((v) => v.visualPassed)
          ? 'passed'
          : 'review-required'
    } catch (error) {
      result.failureCode = error.message
    } finally {
      await context.close()
    }
    console.log(slug, result.runtime, result.visual)
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
  }
} finally {
  await browser.close()
}
report.complete = true
report.passed = report.items.filter(
  (item) => item.runtime === 'passed' && item.visual === 'passed',
).length
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
console.log('Release-ready:', report.passed, '/', report.items.length)
