import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { parse } from 'parse5'
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const appRoot = path.resolve(import.meta.dirname, '..')
const root = path.resolve(appRoot, '../..')
const directory = path.join(appRoot, '.wrangler/self-hosted-raw-pilot')
const manifestPath = path.join(root, 'docs/evidence/SELF_HOSTED_RAW_PILOT_2026-11-18.json')
const reportPath = path.join(root, 'docs/evidence/SELF_HOSTED_RAW_RESULT_2026-11-18.json')
const codepenHost = (host) =>
  /(^|\.)(codepen\.io|cdpn\.io|codepen\.dev|codepenusercontent\.com|pens\.io)$/.test(host)
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')

async function json(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(value, null, 2) + '\n')
}

async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if ([403, 429].includes(response.status)) {
    const error = new Error('ACQUISITION_STOP_' + response.status)
    error.url = String(url)
    error.mitigation = response.headers.get('cf-mitigated')
    throw error
  }
  if (!response.ok) throw new Error('HTTP_' + response.status + ': ' + url)
  return response
}

function links(text, url, type) {
  const found = new Set()
  const add = (raw) => {
    if (!raw || /^(#|data:|blob:|mailto:|javascript:)/i.test(raw)) return
    try {
      const resolved = new URL(raw, url)
      if (['http:', 'https:'].includes(resolved.protocol)) found.add(resolved.href)
    } catch {
      /* 불완전한 동적 URL은 실행 검증에서 확인한다. */
    }
  }
  if (type.includes('html')) {
    const visit = (node) => {
      for (const attribute of node.attrs ?? []) {
        if (
          ['src', 'poster'].includes(attribute.name) ||
          (attribute.name === 'href' && ['link', 'image', 'use'].includes(node.tagName))
        )
          add(attribute.value)
      }
      for (const child of node.childNodes ?? []) visit(child)
    }
    visit(parse(text))
  }
  for (const match of text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) add(match[1])
  for (const match of text.matchAll(
    /(?:from\s*|import\s*\(|import\s+|new URL\(\s*|fetch\(\s*)["']([^"'\s]+)["']/g,
  )) {
    if (/^(\.|\/|https?:)/.test(match[1]) || type.includes('css')) add(match[1])
  }
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>\\)]+/g)) add(match[0])
  return [...found]
}

function localFile(base, pathname) {
  const result = path.resolve(base, '.' + decodeURIComponent(pathname))
  if (!result.startsWith(path.resolve(base) + path.sep)) throw new Error('INVALID_FILE_PATH')
  return result
}

async function selectTargets() {
  const base = 'https://kwak-motion-lab-production.kwak-motion-lab.workers.dev'
  const candidates = []
  let cursor
  for (let page = 0; page < 8 && candidates.length < 40; page++) {
    const url = new URL(base + '/api/v1/examples')
    url.searchParams.set('limit', '24')
    if (cursor) url.searchParams.set('cursor', cursor)
    const data = (await (await request(url)).json()).data
    for (const item of data.items) {
      const match = item.preview.embedUrl.match(/\/embed\/([0-9a-f-]{36})\?/)
      if (match && !candidates.some((old) => old.slug === item.slug)) {
        candidates.push({ ...item, rawOrigin: 'https://' + match[1] + '.codepenusercontent.com' })
      }
    }
    cursor = data.nextCursor
    if (!cursor) break
  }
  const groups = new Map()
  for (const item of candidates) {
    const group = item.tags.section?.[0] ?? 'unclassified'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(item)
  }
  const selected = []
  while (selected.length < 60 && [...groups.values()].some((items) => items.length)) {
    for (const items of groups.values()) {
      if (items.length && selected.length < 60) selected.push(items.shift())
    }
  }
  if (selected.length < 24) throw new Error('INSUFFICIENT_RAW_FILE_TARGETS')
  for (const item of selected) {
    item.source = (await (await request(base + '/api/v1/examples/' + item.slug)).json()).data.source
  }
  return selected
}

async function acquire() {
  const items = await selectTargets()
  let previous = []
  try {
    previous = JSON.parse(await readFile(manifestPath, 'utf8')).items
  } catch {
    /* 첫 실행 */
  }
  const manifest = {
    schemaVersion: 1,
    selectedAt: new Date().toISOString(),
    acquisitionMethod: 'official-public-raw-file-urls',
    documentationUrl: 'https://blog.codepen.io/docs/live-view/raw-file-urls/',
    items: [],
  }
  for (const item of items) {
    const existing = previous.find((record) => record.slug === item.slug)
    const importMapFix =
      existing?.status === 'failed' &&
      existing.failureCode?.startsWith('HTTP_404:') &&
      existing.failureCode.includes('/three/')
    if (existing && existing.status !== 'pending' && !importMapFix) {
      manifest.items.push(existing)
      console.log('preserved', existing.slug, existing.status)
      continue
    }
    const record = {
      slug: item.slug,
      title: item.title,
      sections: item.tags.section ?? [],
      technologies: item.tags.technology ?? [],
      source: item.source,
      rawOrigin: item.rawOrigin,
      status: 'pending',
      files: [],
      externalOrigins: [],
    }
    manifest.items.push(record)
    try {
      const queue = [item.rawOrigin + '/index.html']
      const visited = new Set()
      const origins = new Set()
      let totalBytes = 0
      while (queue.length) {
        const url = queue.shift()
        const parsed = new URL(url)
        const key = parsed.pathname
        if (visited.has(key)) continue
        visited.add(key)
        if (visited.size > 80) throw new Error('FILE_LIMIT')
        const cached = existing?.files.find((file) => file.path === parsed.pathname)
        const response = cached ? null : await request(url)
        const bytes = cached
          ? await readFile(localFile(path.join(directory, item.slug, 'files'), parsed.pathname))
          : Buffer.from(await response.arrayBuffer())
        if (cached && digest(bytes) !== cached.sha256) throw new Error('CACHE_HASH_MISMATCH')
        totalBytes += bytes.length
        if (totalBytes > 20_000_000) throw new Error('BYTE_LIMIT')
        const contentType = cached?.contentType ?? response.headers.get('content-type') ?? ''
        const file = localFile(path.join(directory, item.slug, 'files'), parsed.pathname)
        await mkdir(path.dirname(file), { recursive: true })
        await writeFile(file, bytes)
        record.files.push({
          path: parsed.pathname,
          sourceUrl: url,
          contentType,
          bytes: bytes.length,
          sha256: digest(bytes),
        })
        const textual = /\.(html?|css|m?js|json|svg)$/i.test(parsed.pathname)
        if (textual) {
          for (const link of links(
            bytes.toString('utf8'),
            url,
            parsed.pathname.endsWith('.html')
              ? 'html'
              : parsed.pathname.endsWith('.css')
                ? 'text/css'
                : 'javascript',
          )) {
            const dependency = new URL(link)
            if (dependency.origin === item.rawOrigin) {
              if (
                /\.(?:html?|css|m?js|json|svg|png|jpe?g|webp|gif|avif|woff2?|ttf|mp3|mp4)$/i.test(
                  dependency.pathname,
                )
              )
                queue.push(link)
            } else origins.add(dependency.origin)
          }
        }
      }
      record.externalOrigins = [...origins].sort()
      record.status = 'acquired'
      record.totalBytes = totalBytes
      await json(path.join(directory, item.slug, 'source.json'), record)
      console.log('acquired', item.slug, record.files.length, totalBytes)
    } catch (error) {
      record.status = 'failed'
      record.failureCode = error.message
      if (error.url) record.failedUrl = error.url
      if (error.mitigation) record.mitigation = error.mitigation
      console.log('failed', item.slug, error.message)
    }
    await json(manifestPath, manifest)
  }
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

async function enrichStyles(manifest) {
  const blockedHosts = new Set()
  for (const item of manifest.items.filter((record) => record.status === 'acquired')) {
    const origins = new Set(item.externalOrigins)
    const stylesheets = new Set(item.stylesheets?.map((record) => record.url) ?? [])
    item.stylesheets ??= []
    const pending = []
    for (const file of [...item.files, ...(item.codepenAssets ?? [])].filter(
      (record) => record.path && /\.(html|css|m?js)$/.test(record.path),
    )) {
      const text = await readFile(
        localFile(path.join(directory, item.slug, 'files'), file.path),
        'utf8',
      )
      pending.push(
        ...links(
          text,
          file.sourceUrl,
          file.path.endsWith('.html')
            ? 'html'
            : file.path.endsWith('.css')
              ? 'text/css'
              : 'javascript',
        ),
      )
    }
    while (pending.length && stylesheets.size < 16) {
      const url = pending.shift()
      const parsed = new URL(url)
      if (
        parsed.origin === item.rawOrigin ||
        codepenHost(parsed.hostname) ||
        blockedHosts.has(parsed.hostname) ||
        stylesheets.has(url) ||
        !(
          /\.css$/.test(parsed.pathname) ||
          ['fonts.googleapis.com', 'fonts.bunny.net'].includes(parsed.hostname)
        )
      )
        continue
      stylesheets.add(url)
      origins.add(parsed.origin)
      try {
        const response = await request(url)
        const text = await response.text()
        if (text.length > 500000) throw new Error('STYLESHEET_TOO_LARGE')
        item.stylesheets.push({ url, sha256: digest(text) })
        for (const dependency of links(text, url, 'text/css')) {
          origins.add(new URL(dependency).origin)
          pending.push(dependency)
        }
      } catch (error) {
        if (error.message.startsWith('ACQUISITION_STOP_')) blockedHosts.add(parsed.hostname)
        item.stylesheets.push({ url, failureCode: error.message })
      }
    }
    item.externalOrigins = [...origins].sort()
  }
  await json(manifestPath, manifest)
}

async function cacheCodepenAssets(manifest) {
  const shared = new Map()
  for (const item of manifest.items.filter((record) => record.status === 'acquired')) {
    item.codepenAssets ??= []
    const queue = []
    for (const file of item.files.filter((record) => /\.(html|css|m?js)$/.test(record.path))) {
      const text = await readFile(
        localFile(path.join(directory, item.slug, 'files'), file.path),
        'utf8',
      )
      queue.push(
        ...links(text, file.sourceUrl, file.path.endsWith('.html') ? 'html' : 'text/javascript'),
      )
    }
    const visited = new Set(item.codepenAssets.map((asset) => asset.sourceUrl))
    while (queue.length && visited.size < 30) {
      const url = queue.shift()
      const parsed = new URL(url)
      if (
        parsed.hostname !== 'assets.codepen.io' ||
        visited.has(url) ||
        !/\.(js|css|png|jpe?g|gif|webp|svg|woff2?)$/i.test(parsed.pathname)
      )
        continue
      visited.add(url)
      try {
        let bytes = shared.get(url)
        if (!bytes) {
          const response = await request(url)
          bytes = Buffer.from(await response.arrayBuffer())
          if (bytes.length > 5000000) throw new Error('ASSET_TOO_LARGE')
          shared.set(url, bytes)
        }
        const servedPath =
          '/__codepen_assets__/' + digest(url).slice(0, 24) + path.extname(parsed.pathname)
        const target = localFile(path.join(directory, item.slug, 'files'), servedPath)
        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(target, bytes)
        item.codepenAssets.push({
          sourceUrl: url,
          path: servedPath,
          sha256: digest(bytes),
          bytes: bytes.length,
        })
        if (/\.(js|css|svg)$/i.test(parsed.pathname))
          queue.push(...links(bytes.toString('utf8'), url, 'text/javascript'))
      } catch (error) {
        item.codepenAssets.push({ sourceUrl: url, failureCode: error.message })
        if (error.message.startsWith('ACQUISITION_STOP_')) break
      }
    }
  }
  await json(manifestPath, manifest)
}

async function verify() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  for (const item of manifest.items.filter((record) => record.status === 'acquired')) {
    const extra = new Set()
    for (const file of item.files.filter((record) => /\.(html|m?js)$/.test(record.path))) {
      const text = await readFile(
        localFile(path.join(directory, item.slug, 'files'), file.path),
        'utf8',
      )
      for (const url of links(
        text,
        file.sourceUrl,
        file.path.endsWith('.html') ? 'html' : 'javascript',
      )) {
        const parsed = new URL(url)
        if (
          parsed.origin === item.rawOrigin &&
          /\.txt$/.test(parsed.pathname) &&
          !item.files.some((file) => file.path === parsed.pathname)
        )
          extra.add(url)
      }
    }
    for (const url of [...extra].slice(0, 8)) {
      try {
        const response = await request(url)
        const bytes = Buffer.from(await response.arrayBuffer())
        if (bytes.length > 500000) throw new Error('TEXT_FILE_TOO_LARGE')
        const pathname = new URL(url).pathname
        await writeFile(localFile(path.join(directory, item.slug, 'files'), pathname), bytes)
        item.files.push({
          path: pathname,
          sourceUrl: url,
          contentType: response.headers.get('content-type'),
          bytes: bytes.length,
          sha256: digest(bytes),
        })
      } catch (error) {
        item.repairFailure = error.message
        if (error.message.startsWith('ACQUISITION_STOP_')) break
      }
    }
  }
  await cacheCodepenAssets(manifest)
  await enrichStyles(manifest)
  const targets = manifest.items
    .filter(
      (item) =>
        item.status === 'acquired' &&
        (!process.env.PILOT_SLUGS || process.env.PILOT_SLUGS.split(',').includes(item.slug)),
    )
    .slice(0, 24)
  let current
  const server = createServer(async (req, res) => {
    try {
      if (req.url === '/__pilot__') {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(
          '<style>html,body{margin:0;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:0}</style><iframe sandbox="allow-scripts" title="자체 실행 검증"></iframe>',
        )
        return
      }
      const url = new URL(req.url, 'http://localhost')
      const file = localFile(
        path.join(directory, current.slug, 'files'),
        url.pathname === '/' ? '/index.html' : url.pathname,
      )
      let bytes = await readFile(file)
      if (/\.(html|css|m?js|svg)$/.test(file)) {
        let text = bytes.toString('utf8')
        for (const asset of current.codepenAssets ?? []) {
          if (asset.path) text = text.replaceAll(asset.sourceUrl, asset.path)
        }
        bytes = Buffer.from(text)
      }
      const policy = [
        "default-src 'none'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "frame-src 'self' about:",
        "base-uri 'self'",
        "form-action 'none'",
      ]
      const allowedOrigins = current.externalOrigins.filter(
        (origin) => !codepenHost(new URL(origin).hostname),
      )
      const csp = policy
        .map((directive) =>
          /^(script|style|img|font|connect|media)-src/.test(directive)
            ? directive + ' ' + allowedOrigins.join(' ')
            : directive,
        )
        .join('; ')
      res.writeHead(200, {
        'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Content-Security-Policy': csp,
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store',
      })
      res.end(bytes)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const origin = 'http://127.0.0.1:' + server.address().port
  const browser = await chromium.launch()
  const results = []
  try {
    for (const item of targets) {
      current = item
      const result = {
        slug: item.slug,
        runtimeStatus: 'not-tested',
        comparisonStatus: 'not-tested',
        viewports: [],
      }
      results.push(result)
      if (item.status !== 'acquired') {
        result.failureCode = 'SOURCE_NOT_ACQUIRED'
        continue
      }
      const context = await browser.newContext()
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
          await context.setDefaultTimeout(30000)
          const evidence = path.join(directory, item.slug, 'evidence')
          await mkdir(evidence, { recursive: true })
          const capture = async (reference) => {
            const page = await context.newPage()
            await page.setViewportSize(viewport)
            const errors = []
            const blockedCodepen = []
            await page.route('**/*', async (route) => {
              const target = new URL(route.request().url())
              if (!reference && codepenHost(target.hostname)) {
                blockedCodepen.push(target.href)
                await route.abort()
              } else await route.continue()
            })
            page.on('pageerror', (error) => errors.push(error.message))
            page.on('response', (response) => {
              if (response.status() >= 400)
                errors.push('HTTP_' + response.status() + ': ' + response.url())
            })
            page.on('console', (message) => {
              if (message.type() === 'error') errors.push(message.text().slice(0, 250))
            })
            if (reference) {
              await page.goto(
                item.rawOrigin.replace('.codepenusercontent.com', '.codepen.dev') + '/',
                { waitUntil: 'domcontentloaded' },
              )
            } else {
              await page.goto(origin + '/__pilot__')
              await page.locator('iframe').evaluate((frame, url) => {
                frame.src = url
              }, origin + '/index.html')
              await page.frameLocator('iframe').locator('body').waitFor({ state: 'attached' })
            }
            await page.waitForTimeout(2500)
            const frame = reference ? page : page.frameLocator('iframe')
            const content = await frame.locator('body').evaluate(() => ({
              children: document.body.children.length,
              text: document.body.innerText.slice(0, 200),
              overflow: document.documentElement.scrollWidth > innerWidth + 2,
            }))
            const buffer = await page.screenshot({ animations: 'allow', timeout: 30000 })
            await writeFile(
              path.join(evidence, (reference ? 'reference-' : 'local-') + viewport.width + '.png'),
              buffer,
            )
            await page.close()
            return { buffer, errors: [...new Set(errors)], blockedCodepen, content }
          }
          const local = await capture(false)
          const reference =
            process.env.PILOT_NO_REFERENCE === '1'
              ? { buffer: local.buffer, errors: ['REFERENCE_CAPTURE_PENDING'] }
              : await capture(true)
          const a = PNG.sync.read(local.buffer)
          const b = PNG.sync.read(reference.buffer)
          const difference = new PNG({ width: a.width, height: a.height })
          const referenceAvailable = reference.errors.length === 0
          const ratio = referenceAvailable
            ? pixelmatch(a.data, b.data, difference.data, a.width, a.height, { threshold: 0.15 }) /
              (a.width * a.height)
            : null
          await writeFile(
            path.join(evidence, 'diff-' + viewport.width + '.png'),
            PNG.sync.write(difference),
          )
          result.viewports.push({
            ...viewport,
            localErrors: local.errors,
            referenceErrors: reference.errors,
            blockedCodepenRequests: local.blockedCodepen.length,
            localContent: local.content,
            differingPixelRatio: ratio,
            runtimePassed:
              local.errors.length === 0 &&
              !local.blockedCodepen.length &&
              local.content.children > 0,
            pixelComparisonPassed: referenceAvailable && ratio !== null && ratio <= 0.05,
          })
        }
        result.runtimeStatus = result.viewports.every((view) => view.runtimePassed)
          ? 'passed'
          : 'failed'
        result.comparisonStatus = result.viewports.some((view) => view.referenceErrors.length)
          ? 'reference-unavailable'
          : result.viewports.every((view) => view.pixelComparisonPassed)
            ? 'passed'
            : 'review-required'
        console.log('verified', item.slug, result.runtimeStatus, result.comparisonStatus)
      } catch (error) {
        result.runtimeStatus = 'failed'
        result.failureCode = error.message
        console.log('failed verification', item.slug, error.message.slice(0, 120))
      } finally {
        await context.close()
      }
      await json(reportPath, { checkedAt: new Date().toISOString(), complete: false, results })
    }
  } finally {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }
  const report = {
    checkedAt: new Date().toISOString(),
    complete: true,
    sourceCandidates: manifest.items.length,
    acquisitionFailures: manifest.items.filter((item) => item.status !== 'acquired').length,
    selected: targets.length,
    acquired: manifest.items.filter((item) => item.status === 'acquired').length,
    runtimePassed: results.filter((item) => item.runtimeStatus === 'passed').length,
    pixelComparisonPassed: results.filter((item) => item.comparisonStatus === 'passed').length,
    readyForExpansion:
      results.length >= 20 &&
      results.every(
        (item) => item.runtimeStatus === 'passed' && item.comparisonStatus === 'passed',
      ),
    results,
  }
  await json(reportPath, report)
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2))
}

if (process.argv[2] === 'acquire') await acquire()
else if (process.argv[2] === 'verify') await verify()
else throw new Error('사용법: node scripts/raw-pilot.mjs acquire | verify')
