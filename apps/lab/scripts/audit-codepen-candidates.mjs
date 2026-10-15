/* global console, process, setTimeout */

import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)

function argument(name) {
  const index = args.indexOf(name)
  return index < 0 ? undefined : args[index + 1]
}

export function codePenEmbedUrl(canonicalUrl) {
  const match = canonicalUrl?.match(
    /^https:\/\/codepen\.io\/((?:team\/)?[A-Za-z0-9_-]+)\/pen\/([A-Za-z0-9]+)\/?$/,
  )
  return match
    ? `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result&theme-id=light`
    : null
}

export function classifyProbe({ httpStatus, frameLoaded, bodyLength, pageErrors }) {
  if (httpStatus === 404 || httpStatus === 410) return 'failed'
  if (httpStatus !== 200 || !frameLoaded) return 'inconclusive'
  if (bodyLength === 0 || pageErrors > 0) return 'inconclusive'
  return 'loaded'
}

export function classifyEnvironment(controlResult) {
  if (controlResult === 'loaded') return 'probe-available'
  if (controlResult === 'failed') return 'control-failed'
  return 'probe-blocked'
}

export function blockedCandidate(item) {
  return {
    id: item.id,
    canonicalUrl: item.canonicalUrl,
    result: 'inconclusive',
    reason: 'POSITIVE_CONTROL_NOT_LOADED',
    skipped: true,
  }
}

async function probe(page, item) {
  const embedUrl = codePenEmbedUrl(item.canonicalUrl)
  if (!embedUrl) {
    return { id: item.id, result: 'failed', reason: 'INVALID_CANONICAL_URL' }
  }
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.name))
  let httpStatus = null
  let frameLoaded = false
  let bodyLength = null
  let reason = null
  try {
    const response = await page.goto(embedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    httpStatus = response?.status() ?? null
    if (httpStatus === 200) {
      await page.frameLocator('#result-iframe').locator('body').waitFor({ timeout: 20_000 })
      frameLoaded = true
      bodyLength = await page
        .frameLocator('#result-iframe')
        .locator('body')
        .evaluate((body) => body.innerHTML.length)
    }
  } catch (error) {
    reason = error instanceof Error ? error.name : 'UNKNOWN_ERROR'
  }
  return {
    id: item.id,
    canonicalUrl: item.canonicalUrl,
    result: classifyProbe({
      httpStatus,
      frameLoaded,
      bodyLength,
      pageErrors: pageErrors.length,
    }),
    httpStatus,
    frameLoaded,
    bodyLength,
    pageErrors: pageErrors.length,
    reason,
  }
}

async function main() {
  const input = argument('--input')
  const output = argument('--output')
  const limit = Number(argument('--limit') ?? '20')
  const controlUrl = argument('--control-url')
  if (!input || !output || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new Error(
      '사용법: --input 후보.json --output 결과.json [--limit 1..50] [--control-url 공개 Pen URL]',
    )
  }
  if (controlUrl && !codePenEmbedUrl(controlUrl)) {
    throw new Error('양성 대조군은 공개 CodePen canonical URL이어야 합니다.')
  }
  const candidates = JSON.parse(await readFile(input, 'utf8'))
  if (!Array.isArray(candidates)) throw new Error('입력은 후보 배열이어야 합니다.')
  const browser = await chromium.launch({ headless: !args.includes('--headed') })
  const results = []
  let control = null
  try {
    if (controlUrl) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      try {
        control = await probe(page, { id: 'positive-control', canonicalUrl: controlUrl })
      } finally {
        await page.close()
      }
      console.log(`양성 대조군: ${control.result}`)
    }
    const selected = candidates.slice(0, limit)
    const blocked = control && classifyEnvironment(control.result) !== 'probe-available'
    if (blocked) {
      results.push(...selected.map(blockedCandidate))
    }
    for (const item of blocked ? [] : selected) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      try {
        results.push(await probe(page, item))
      } finally {
        await page.close()
      }
      console.log(
        `${results.length}/${Math.min(candidates.length, limit)} ${item.id}: ${results.at(-1).result}`,
      )
      await new Promise((resolve) => setTimeout(resolve, 1_000))
    }
  } finally {
    await browser.close()
  }
  const report = {
    checkedAt: new Date().toISOString(),
    method: args.includes('--headed')
      ? 'playwright-headed-codepen-embed-read-only'
      : 'playwright-headless-codepen-embed-read-only',
    meaning: 'loaded는 iframe 내용 로드만 의미하며 실제 모션·품질·안전을 보증하지 않음',
    environment: control ? classifyEnvironment(control.result) : 'not-checked',
    positiveControl: control,
    results,
  }
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(`결과 저장: ${output}`)
}

if (process.argv[1]?.endsWith('audit-codepen-candidates.mjs')) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
