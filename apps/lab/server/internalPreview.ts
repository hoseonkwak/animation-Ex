import catalogData from './internalPreviewCatalog.json'
import { internalPreviewPolicy } from '../src/shared/internalPreviewPolicy'

interface Snapshot {
  version: string
  canonicalUrl: string
  origins: string[]
  files: string[]
}
const catalog: Record<string, Snapshot> = catalogData

export function internalPreview(slug: string, canonicalUrl: string) {
  const snapshot = catalog[slug]
  return snapshot?.canonicalUrl === canonicalUrl
    ? { runtimeUrl: `/runtime/${slug}/${snapshot.version}/index.html`, version: snapshot.version }
    : null
}

export async function serveInternalPreview(
  request: Request,
  db: D1Database,
  assets: Fetcher,
): Promise<Response> {
  const url = new URL(request.url)
  const [, , slug, version, ...parts] = url.pathname.split('/')
  const snapshot = slug ? catalog[slug] : undefined
  const file = '/' + parts.join('/')
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 })
  if (!snapshot || snapshot.version !== version || !snapshot.files.includes(file))
    return new Response('Not found', { status: 404 })
  const entry = await db
    .prepare(
      "SELECT e.id FROM animation_entries e JOIN sources s ON s.id = e.source_id WHERE e.slug = ? AND e.status = 'published' AND s.canonical_url = ? LIMIT 1",
    )
    .bind(slug, snapshot.canonicalUrl)
    .first()
  if (!entry) return new Response('Unavailable', { status: 404 })
  const asset = await assets.fetch(new Request(url, { method: request.method }))
  if (asset.status !== 200) return new Response('Not found', { status: 404 })
  const headers = new Headers(asset.headers)
  headers.set(
    'Content-Security-Policy',
    internalPreviewPolicy(
      `${url.origin}/runtime/${slug}/${version}/`,
      snapshot.origins,
      file.endsWith('.txt'),
    ),
  )
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Content-Type-Options', 'nosniff')
  if (file.endsWith('.txt')) headers.set('Content-Type', 'text/plain; charset=utf-8')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  headers.set('Cache-Control', 'no-store')
  return new Response(asset.body, { status: 200, headers })
}
