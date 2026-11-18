import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import path from 'node:path'
import { internalPreviewPolicy } from '../src/shared/internalPreviewPolicy.ts'

const root = path.resolve(import.meta.dirname, '..')
const evidence = path.resolve(root, '../../docs/evidence')
const cache = path.join(root, '.wrangler/self-hosted-raw-pilot')
const stage = path.join(root, '.wrangler/internal-preview')
const manifest = JSON.parse(
  await readFile(path.join(evidence, 'SELF_HOSTED_RAW_PILOT_2026-11-18.json'), 'utf8'),
)
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const policyVersion = 'opaque-snapshot-v1'
const candidates = {}
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
}
const license = (item) =>
  `MIT License\n\nCopyright (c) ${item.source.creatorName}\nOriginal: ${item.source.canonicalUrl}\nPublic Pen license: https://blog.codepen.io/documentation/licensing/\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n`

for (const item of manifest.items.filter(
  (record) => record.status === 'acquired' && record.source.licenseCode === 'MIT',
)) {
  const files = [...item.files, ...(item.codepenAssets ?? []).filter((record) => record.path)]
  const version = hash(
    JSON.stringify({
      policyVersion,
      files: files.map(({ path, sha256 }) => ({ path, sha256 })),
      origins: item.externalOrigins,
      source: item.source,
    }),
  ).slice(0, 20)
  const prefix = `/runtime/${item.slug}/${version}`
  const target = path.join(stage, prefix)
  const outputs = []
  for (const file of files) {
    let bytes = await readFile(path.join(cache, item.slug, 'files', file.path))
    if (hash(bytes) !== file.sha256)
      throw new Error('SOURCE_HASH_MISMATCH: ' + item.slug + file.path)
    if (/\.(html|css|m?js|svg)$/.test(file.path)) {
      let text = bytes.toString('utf8')
      for (const asset of item.codepenAssets ?? [])
        if (asset.path) text = text.replaceAll(asset.sourceUrl, prefix + asset.path)
      for (const local of item.files) {
        text = text.replaceAll(item.rawOrigin + local.path, prefix + local.path)
        for (const quote of ['"', "'", '`'])
          text = text.replaceAll(quote + local.path + quote, quote + prefix + local.path + quote)
        text = text.replaceAll('url(' + local.path + ')', 'url(' + prefix + local.path + ')')
      }
      if (file.path === '/index.html')
        text = text.replace(
          /<head([^>]*)>/i,
          `$&<base href="${prefix}/"><!-- Source and license: ${prefix}/LICENSE.txt -->`,
        )
      bytes = Buffer.from(text)
    }
    const output = path.join(target, file.path)
    await mkdir(path.dirname(output), { recursive: true })
    await writeFile(output, bytes)
    outputs.push({ path: file.path, sha256: hash(bytes), bytes: bytes.length })
  }
  await writeFile(path.join(target, 'LICENSE.txt'), license(item))
  outputs.push({
    path: '/LICENSE.txt',
    sha256: hash(license(item)),
    bytes: Buffer.byteLength(license(item)),
  })
  candidates[item.slug] = {
    version,
    canonicalUrl: item.source.canonicalUrl,
    origins: item.externalOrigins,
    files: outputs.map((file) => file.path),
    hashes: outputs,
    title: item.title,
  }
}
await mkdir(stage, { recursive: true })
await writeFile(path.join(stage, 'catalog.json'), JSON.stringify(candidates, null, 2))

if (process.argv[2] === 'serve') {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1:5175')
      if (url.pathname === '/__verify__') {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(
          '<style>html,body{margin:0;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:0}</style><iframe sandbox="allow-scripts" title="Internal verification"></iframe>',
        )
        return
      }
      const [, , slug, version, ...parts] = url.pathname.split('/')
      const item = candidates[slug]
      const file = '/' + parts.join('/')
      if (!item || item.version !== version || !item.files.includes(file))
        throw new Error('not found')
      const bytes = await readFile(path.join(stage, 'runtime', slug, version, file))
      res.writeHead(200, {
        'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream',
        'Content-Security-Policy': internalPreviewPolicy(
          `${url.origin}/runtime/${slug}/${version}/`,
          item.origins,
          file.endsWith('.txt'),
        ),
        'Access-Control-Allow-Origin': '*',
        'Referrer-Policy': 'no-referrer',
      })
      res.end(bytes)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })
  server.listen(5175, '127.0.0.1', () =>
    console.log('Staged snapshots: http://127.0.0.1:5175/runtime/<slug>/<version>/index.html'),
  )
} else if (process.argv[2] === 'seed-local') {
  const published = JSON.parse(
    await readFile(path.join(root, 'server/internalPreviewCatalog.json'), 'utf8'),
  )
  const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const now = quote(new Date().toISOString())
  const statements = []
  for (const slug of Object.keys(published)) {
    const item = manifest.items.find((record) => record.slug === slug)
    const source = item.source
    const canonical = quote(source.canonicalUrl)
    const penId = new URL(source.canonicalUrl).pathname.split('/').at(-1)
    const creator = new URL(source.canonicalUrl).pathname.split('/').at(-3)
    statements.push(
      `INSERT OR IGNORE INTO sources (id,type,url,canonical_url,creator_name,license_code,license_evidence_url,availability,first_seen_at,created_at,updated_at) VALUES (${quote('selfhost-source-' + slug)},'codepen',${canonical},${canonical},${quote(source.creatorName)},'MIT',${quote(source.licenseEvidenceUrl)},'available',${now},${now},${now});`,
    )
    statements.push(
      `INSERT OR IGNORE INTO animation_entries (id,source_id,slug,title,summary,search_text,content_origin,preview_kind,status,difficulty,featured,runtime_verified,published_at,created_at,updated_at) SELECT ${quote('selfhost-entry-' + slug)},id,${quote(slug)},${quote(item.title)},${quote(item.title + '의 자체 실행 검증 예제입니다.')},${quote(item.title)},'original-pen','codepen','published','intermediate',0,0,${now},${now},${now} FROM sources WHERE canonical_url=${canonical};`,
    )
    statements.push(
      `INSERT OR IGNORE INTO codepen_refs (id,animation_entry_id,pen_key,pen_id,creator_slug,canonical_url,embed_url,last_verified_at) SELECT ${quote('selfhost-ref-' + slug)},id,${quote(creator + '/' + penId)},${quote(penId)},${quote(creator)},${canonical},${quote(source.canonicalUrl.replace('/pen/', '/embed/') + '?default-tab=result&theme-id=light')},'1970-01-01T00:00:00.000Z' FROM animation_entries WHERE slug=${quote(slug)};`,
    )
  }
  await writeFile(
    path.join(root, '.wrangler/internal-preview-seed-local.sql'),
    statements.join('\n'),
  )
  console.log(
    'Prepared LOCAL-only seed. Apply with wrangler d1 execute kwak-motion-lab-local --local --file .wrangler/internal-preview-seed-local.sql',
  )
} else if (process.argv[2] === 'publish') {
  const decisions = JSON.parse(
    await readFile(path.join(evidence, 'SELF_HOSTED_RELEASE_2026-11-18.json'), 'utf8'),
  )
  if (!decisions.complete) throw new Error('INCOMPLETE_RELEASE_VERIFICATION')
  const catalog = {}
  for (const decision of decisions.items.filter(
    (item) => item.runtime === 'passed' && item.visual === 'passed',
  )) {
    const item = candidates[decision.slug]
    if (
      !item ||
      decision.version !== item.version ||
      decision.artifactSha256 !== hash(JSON.stringify(item.hashes)) ||
      decision.runtime !== 'passed' ||
      decision.visual !== 'passed'
    )
      throw new Error('RELEASE_GATE_FAILED: ' + decision.slug)
    const directory = path.join(root, 'public/runtime', decision.slug, item.version)
    for (const file of item.files) {
      const output = path.join(directory, file)
      await mkdir(path.dirname(output), { recursive: true })
      await copyFile(path.join(stage, 'runtime', decision.slug, item.version, file), output)
    }
    const { hashes, title, ...record } = item
    const thumbnail = path.join(
      root,
      'public/self-hosted-thumbnails',
      `${decision.slug}-${item.version}.png`,
    )
    await mkdir(path.dirname(thumbnail), { recursive: true })
    await copyFile(path.join(stage, 'evidence', decision.slug, 'local-1280.png'), thumbnail)
    catalog[decision.slug] = record
    console.log('published snapshot', title, hashes.length)
  }
  if (!Object.keys(catalog).length) throw new Error('NO_RELEASE_READY_SNAPSHOTS')
  await writeFile(
    path.join(root, 'server/internalPreviewCatalog.json'),
    JSON.stringify(catalog, null, 2) + '\n',
  )
} else console.log('Prepared', Object.keys(candidates).length, 'snapshots. Use serve or publish.')
