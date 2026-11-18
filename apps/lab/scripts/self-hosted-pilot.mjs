import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createHash, randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const categories = [
  'button',
  'text',
  'navigation',
  'image',
  'slider',
  'loading',
  'card',
  'background',
  'form',
  'modal',
  'gallery',
  'hero',
]
const appRoot = path.resolve(import.meta.dirname, '..')
const repositoryRoot = path.resolve(appRoot, '../..')
const manifestPath = path.join(repositoryRoot, 'docs/evidence/SELF_HOSTED_PILOT_2026-11-18.json')
const reportPath = path.join(
  repositoryRoot,
  'docs/evidence/SELF_HOSTED_PILOT_RESULT_2026-11-18.json',
)

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

async function select() {
  const base = 'https://kwak-motion-lab-production.kwak-motion-lab.workers.dev'
  const items = []
  for (const category of categories) {
    const response = await fetch(base + '/api/v1/examples?category=' + category + '&limit=4')
    if (!response.ok) throw new Error('예제 목록 조회 실패: ' + category)
    const { data } = await response.json()
    const selected = data.items
      .filter((item) => !items.some((old) => old.slug === item.slug))
      .slice(0, 2)
    if (selected.length !== 2) throw new Error('카테고리별 대상 부족: ' + category)
    for (const item of selected) {
      const detailResponse = await fetch(base + '/api/v1/examples/' + item.slug)
      if (!detailResponse.ok) throw new Error('예제 상세 조회 실패: ' + item.slug)
      const detail = (await detailResponse.json()).data
      items.push({
        slug: item.slug,
        title: item.title,
        category,
        technologies: item.tags.technology ?? [],
        source: detail.source,
      })
    }
  }
  await writeJson(manifestPath, {
    schemaVersion: 1,
    selectedAt: new Date().toISOString(),
    targetCount: 24,
    sourceAccess: {
      status: 'blocked',
      checkedAt: '2026-11-18',
      url: 'https://codepen.io/hoseonkwak/pen/LEVeYQO.html',
      statusCode: 403,
      mitigation: 'challenge',
      robotsStatus: 200,
      note: '공식 코드 URL 1건에서 접근 차단을 확인해 원본 요청을 중지했다.',
    },
    items,
  })
  console.log('파일럿 24개 선정 완료. 원본 코드를 확보했다는 의미는 아닙니다.')
}

export function validatePackage(value, item, validResources, validLibraries) {
  if (
    !value ||
    value.schemaVersion !== 1 ||
    value.slug !== item.slug ||
    value.source?.canonicalUrl !== item.source.canonicalUrl ||
    value.source?.creatorName !== item.source.creatorName ||
    !value.source?.licenseCode ||
    !value.source?.licenseText?.trim() ||
    !Number.isFinite(Date.parse(value.source?.acquiredAt)) ||
    !value.code ||
    !['html', 'css', 'javascript'].every((key) => typeof value.code[key] === 'string') ||
    !Object.values(value.code).some((code) => typeof code === 'string' && code.trim()) ||
    !validResources(value.resources) ||
    !validLibraries(value.libraries)
  )
    throw new Error('INVALID_PACKAGE')
  if (JSON.stringify(value.code).length > 2_000_000) throw new Error('PACKAGE_TOO_LARGE')
  if (
    Object.values(value.resources)
      .flat()
      .some((url) => /(^|\.)(codepen\.io|cdpn\.io|codepen\.dev)$/.test(new URL(url).hostname))
  )
    throw new Error('CODEPEN_RUNTIME_DEPENDENCY')
}

async function verify(packagesDirectory) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (
    manifest.items.length < 20 ||
    manifest.items.length > 30 ||
    new Set(manifest.items.map((item) => item.slug)).size !== manifest.items.length ||
    manifest.items.some((item) => !/^[a-z0-9-]+$/.test(item.slug))
  ) {
    throw new Error('파일럿 대상은 서로 다른 예제 20~30개여야 합니다.')
  }
  const server = await createServer({
    configFile: false,
    root: appRoot,
    server: { middlewareMode: true },
    resolve: { alias: { '@': path.join(appRoot, 'src') } },
  })
  let browser
  const results = []
  try {
    const { buildPracticeDocument } = await server.ssrLoadModule(
      '/src/features/practice/runtime.ts',
    )
    const { validPracticeResources } = await server.ssrLoadModule(
      '/src/features/practice/resources.ts',
    )
    const { validPracticeLibraries } = await server.ssrLoadModule('/src/shared/practice.ts')
    for (const item of manifest.items) {
      const result = {
        slug: item.slug,
        category: item.category,
        runtimeStatus: 'not-tested',
        visualComparisonStatus: 'not-tested',
      }
      let value
      let fileContent
      try {
        fileContent = await readFile(path.join(packagesDirectory, item.slug + '.json'), 'utf8')
        value = JSON.parse(fileContent)
      } catch (error) {
        result.failureCode =
          error.code === 'ENOENT' ? 'SOURCE_PACKAGE_MISSING' : 'PACKAGE_READ_FAILED'
        results.push(result)
        continue
      }
      try {
        validatePackage(value, item, validPracticeResources, validPracticeLibraries)
        result.packageSha256 = createHash('sha256').update(fileContent).digest('hex')
        browser ??= await chromium.launch()
        const errors = []
        const codepenRequests = []
        const context = await browser.newContext()
        try {
          await context.route(
            /https?:\/\/([^/]*\.)?(codepen\.io|cdpn\.io|codepen\.dev)\//,
            (route) => {
              codepenRequests.push(route.request().url())
              return route.abort()
            },
          )
          const page = await context.newPage()
          page.on('pageerror', (error) => errors.push(error.message))
          page.on('requestfailed', (request) =>
            errors.push(request.url() + ': ' + request.failure()?.errorText),
          )
          await page.setContent(
            '<iframe title="자체 실행 파일럿" sandbox="allow-scripts" style="width:100%;height:720px;border:0"></iframe>',
          )
          const sizes = [
            { width: 1280, height: 800 },
            { width: 390, height: 844 },
          ]
          for (const size of sizes) {
            await page.setViewportSize(size)
            const runId = randomUUID()
            const document = buildPracticeDocument(
              value.code,
              runId,
              value.libraries,
              value.resources,
            )
            await page.evaluate(
              ({ document, runId }) => {
                window.pilotMessages = []
                window.onmessage = (event) => {
                  if (
                    event.source === documentFrame.contentWindow &&
                    event.data?.source === 'kwak-practice' &&
                    event.data.runId === runId
                  ) {
                    window.pilotMessages.push(event.data)
                  }
                }
                const documentFrame = window.document.querySelector('iframe')
                documentFrame.srcdoc = document
              },
              { document, runId },
            )
            await page.waitForFunction(
              () =>
                window.pilotMessages.some((message) => message.type === 'ready') &&
                window.pilotMessages.some((message) => message.type === 'heartbeat'),
              undefined,
              { timeout: 15000 },
            )
            const messages = await page.evaluate(() =>
              window.pilotMessages
                .filter((message) => message.type === 'error')
                .map((message) => message.message),
            )
            errors.push(...messages)
            const frame = page.frameLocator('iframe')
            await frame.locator('body').waitFor()
            const overflow = await frame
              .locator('body')
              .evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
            if (overflow) errors.push('HORIZONTAL_OVERFLOW_' + size.width)
            const screenshotDirectory = path.join(packagesDirectory, 'evidence')
            await mkdir(screenshotDirectory, { recursive: true })
            await page.screenshot({
              path: path.join(screenshotDirectory, item.slug + '-' + size.width + '.png'),
            })
          }
          result.runtimeStatus = errors.length || codepenRequests.length ? 'failed' : 'passed'
          result.failures = [...new Set(errors)]
          result.codepenRequests = codepenRequests.length
          result.visualComparisonStatus = 'pending-reference-comparison'
          try {
            const comparison = JSON.parse(
              await readFile(path.join(packagesDirectory, item.slug + '.comparison.json'), 'utf8'),
            )
            if (
              comparison.status === 'passed' &&
              comparison.packageSha256 === result.packageSha256 &&
              comparison.referenceUrl === item.source.canonicalUrl &&
              typeof comparison.reviewer === 'string' &&
              comparison.reviewer.trim() &&
              typeof comparison.notes === 'string' &&
              comparison.notes.trim() &&
              Number.isFinite(Date.parse(comparison.checkedAt)) &&
              typeof comparison.referenceScreenshot === 'string'
            ) {
              const screenshot = path.resolve(packagesDirectory, comparison.referenceScreenshot)
              if (!screenshot.startsWith(path.resolve(packagesDirectory) + path.sep)) {
                throw new Error('INVALID_COMPARISON_PATH')
              }
              const referenceHash = createHash('sha256')
                .update(await readFile(screenshot))
                .digest('hex')
              if (referenceHash === comparison.referenceScreenshotSha256) {
                result.visualComparisonStatus = 'passed'
              }
            }
          } catch (error) {
            if (error.code !== 'ENOENT') result.comparisonFailure = error.message
          }
        } finally {
          await context.close()
        }
      } catch (error) {
        result.runtimeStatus = 'failed'
        result.failureCode = error.message
      }
      results.push(result)
    }
  } finally {
    await browser?.close()
    await server.close()
  }
  const runtimePassed = results.filter((result) => result.runtimeStatus === 'passed').length
  const visualComparisonPassed = results.filter(
    (result) => result.visualComparisonStatus === 'passed',
  ).length
  const readyForExpansion =
    runtimePassed === manifest.items.length && visualComparisonPassed === manifest.items.length
  const report = {
    checkedAt: new Date().toISOString(),
    selected: manifest.items.length,
    packagesAvailable: results.filter((result) => result.packageSha256).length,
    runtimePassed,
    visualComparisonPassed,
    readyForExpansion,
    expansionBlocker:
      runtimePassed !== manifest.items.length
        ? 'SOURCE_AND_RUNTIME_VERIFICATION_INCOMPLETE'
        : visualComparisonPassed !== manifest.items.length
          ? 'VISUAL_COMPARISON_REQUIRED'
          : null,
    results,
  }
  await writeJson(reportPath, report)
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2))
  process.exitCode = report.readyForExpansion ? 0 : 2
}

const [command, directory] = process.argv.slice(2)
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (command === 'select') await select()
  else if (command === 'verify' && directory) await verify(path.resolve(directory))
  else throw new Error('사용법: node scripts/self-hosted-pilot.mjs select | verify <패키지 폴더>')
}
