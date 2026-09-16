/* global console, process */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { chromium } from '@playwright/test'

import examples from '../fixtures/legacy-gsap.json' with { type: 'json' }

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.resolve(appRoot, '../../docs/evidence/WP3_PREVIEW_VALIDATION.json')
const checkedAt = new Date().toISOString()
const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const results = []

try {
  for (const example of examples) {
    const page = await context.newPage()
    const embedUrl = `https://codepen.io/hoseonkwak/embed/${example.penId}?default-tab=result&theme-id=light`
    let result = 'fail'
    let httpStatus = null
    let resultHtmlLength = 0
    let failureCode = null

    try {
      const response = await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      httpStatus = response?.status() ?? null
      await page.locator('#rerun-button').waitFor({ state: 'visible', timeout: 20_000 })
      resultHtmlLength = await page
        .frameLocator('#result-iframe')
        .locator('body')
        .evaluate((element) => element.innerHTML.length)

      if (!response?.ok()) failureCode = `HTTP_${httpStatus ?? 'NO_RESPONSE'}`
      else if (resultHtmlLength === 0) failureCode = 'EMPTY_RESULT_FRAME'
      else result = 'pass'
    } catch (error) {
      failureCode = error instanceof Error ? error.name : 'UNKNOWN_ERROR'
    } finally {
      results.push({
        position: example.position,
        penId: example.penId,
        canonicalUrl: `https://codepen.io/hoseonkwak/pen/${example.penId}`,
        embedUrl,
        viewport: 'desktop',
        httpStatus,
        resultHtmlLength,
        result,
        failureCode,
      })
      console.log(`${example.position}/15 ${example.penId}: ${result}`)
      await page.close()
    }
  }
} finally {
  await browser.close()
}

const evidence = {
  validator: 'admin-codepen-embed',
  validatorVersion: '1.0.0',
  method: 'playwright-headed-codepen-embed',
  checkedAt,
  viewport: { width: 1440, height: 900 },
  total: results.length,
  passed: results.filter((result) => result.result === 'pass').length,
  failed: results.filter((result) => result.result === 'fail').length,
  results,
}

writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(`Legacy Preview validation: ${evidence.passed}/${evidence.total} passed`)

if (evidence.failed > 0) process.exitCode = 1
