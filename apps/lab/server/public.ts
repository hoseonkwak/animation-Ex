import type {
  CollectionSummary,
  DiscoveryPayload,
  PatternSummary,
  SectionSummary,
} from '../src/shared/discovery'
import type { ExampleCard } from '../src/shared/examples'
import { ExamplesRepository } from './examples'

const sectionDescriptions: Record<string, string> = {
  hero: '첫 화면에서 메시지와 제품을 인상적으로 소개하는 움직임',
  navigation: '메뉴와 화면 이동을 자연스럽게 안내하는 움직임',
  gallery: '이미지와 작품을 탐색하기 쉽게 보여주는 움직임',
  slider: '콘텐츠를 순서대로 넘겨보는 움직임',
  card: '카드의 상태와 상호작용을 전달하는 움직임',
  button: '클릭과 호버 반응을 명확하게 보여주는 움직임',
  text: '문장과 글자를 드러내고 강조하는 움직임',
  loading: '기다리는 시간을 이해하기 쉽게 표현하는 움직임',
  background: '화면의 분위기와 깊이를 만드는 배경 움직임',
}

interface SectionRow {
  key: string
  label_ko: string
  count: number
}
interface PatternRow {
  slug: string
  title: string
  summary: string
  count: number
}
interface CollectionRow {
  id: string
  slug: string
  title: string
  description: string
}

export class PublicRepository {
  constructor(private readonly db: D1Database) {}

  async discovery(): Promise<DiscoveryPayload> {
    const [sectionResult, patternResult, collectionResult] = await Promise.all([
      this.db
        .prepare(
          `SELECT t.key, t.label_ko, COUNT(DISTINCT e.id) AS count
           FROM tags t
           JOIN entry_tags et ON et.tag_id = t.id
           JOIN animation_entries e ON e.id = et.animation_entry_id AND e.status = 'published'
           JOIN codepen_refs p ON p.animation_entry_id = e.id AND p.active = 1
           WHERE t.axis = 'section' AND t.active = 1
           GROUP BY t.key, t.label_ko
           HAVING COUNT(DISTINCT e.id) > 0
           ORDER BY count DESC, t.label_ko`,
        )
        .all<SectionRow>(),
      this.db
        .prepare(
          `SELECT p.slug, p.title, p.summary, COUNT(e.id) AS count
           FROM patterns p
           LEFT JOIN pattern_entries pe ON pe.pattern_id = p.id
           LEFT JOIN animation_entries e ON e.id = pe.animation_entry_id AND e.status = 'published'
           WHERE p.active = 1
           GROUP BY p.id
           HAVING COUNT(e.id) > 0
           ORDER BY p.featured DESC, p.title
           LIMIT 4`,
        )
        .all<PatternRow>(),
      this.db
        .prepare(
          `SELECT id, slug, title, description
           FROM collections
           WHERE active = 1 AND featured = 1
           ORDER BY title
           LIMIT 3`,
        )
        .all<CollectionRow>(),
    ])

    const sections: SectionSummary[] = sectionResult.results.map((row) => ({
      key: row.key,
      label: row.label_ko,
      description: sectionDescriptions[row.key] ?? `${row.label_ko} 영역에 활용하는 움직임`,
      count: Number(row.count),
    }))
    const patterns: PatternSummary[] = patternResult.results.map((row) => ({
      ...row,
      count: Number(row.count),
    }))
    const collections: CollectionSummary[] = []
    for (const collection of collectionResult.results) {
      const items = await this.collectionItems(collection.id)
      if (items.length) collections.push({ ...collection, items })
    }
    return { sections, patterns, collections }
  }

  async sitemapSlugs(): Promise<{ examples: string[]; sections: string[] }> {
    const [examples, discovery] = await Promise.all([
      this.db
        .prepare("SELECT slug FROM animation_entries WHERE status = 'published' ORDER BY slug")
        .all<{ slug: string }>(),
      this.discovery(),
    ])
    return {
      examples: examples.results.map((row) => row.slug),
      sections: discovery.sections.map((section) => section.key),
    }
  }

  private async collectionItems(collectionId: string): Promise<ExampleCard[]> {
    const entries = await this.db
      .prepare(
        `SELECT e.slug
         FROM collection_entries ce
         JOIN animation_entries e ON e.id = ce.animation_entry_id AND e.status = 'published'
         WHERE ce.collection_id = ?
         ORDER BY ce.position, e.id
         LIMIT 4`,
      )
      .bind(collectionId)
      .all<{ slug: string }>()
    const repository = new ExamplesRepository(this.db)
    const items = await Promise.all(
      entries.results.map((row) => repository.findPublishedBySlug(row.slug)),
    )
    return items.filter((item): item is NonNullable<typeof item> => item !== null)
  }
}

export class SubmissionError extends Error {
  constructor(
    readonly status: number,
    readonly code: 'INVALID_SUBMISSION' | 'TURNSTILE_REQUIRED' | 'TURNSTILE_FAILED',
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message)
  }
}

interface SubmissionBody {
  url?: unknown
  note?: unknown
  turnstileToken?: unknown
}

function normalizeSubmittedUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new SubmissionError(400, 'INVALID_SUBMISSION', '올바른 URL을 입력해주세요.', {
      url: 'URL 형식을 확인해주세요.',
    })
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new SubmissionError(400, 'INVALID_SUBMISSION', 'HTTP 또는 HTTPS URL만 접수합니다.')
  }
  url.hash = ''
  url.hostname = url.hostname.toLocaleLowerCase('en-US')
  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  )
    url.port = ''
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
  return url.toString()
}

async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | null,
): Promise<boolean> {
  const body = new FormData()
  body.set('secret', secret)
  body.set('response', token)
  if (remoteIp) body.set('remoteip', remoteIp)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  })
  if (!response.ok) return false
  const result = (await response.json()) as { success?: boolean }
  return result.success === true
}

export async function acceptSubmission(
  request: Request,
  db: D1Database,
  options: { secret?: string; localSimulation: boolean },
): Promise<void> {
  let body: SubmissionBody
  try {
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > 8 * 1024) {
      throw new SubmissionError(413, 'INVALID_SUBMISSION', '요청 본문은 8KB 이하여야 합니다.')
    }
    body = JSON.parse(rawBody) as SubmissionBody
  } catch (error) {
    if (error instanceof SubmissionError) throw error
    throw new SubmissionError(400, 'INVALID_SUBMISSION', '요청 내용을 확인해주세요.')
  }
  const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : ''
  if (!rawUrl || rawUrl.length > 2048 || note.length > 300) {
    throw new SubmissionError(400, 'INVALID_SUBMISSION', '입력 내용을 확인해주세요.')
  }
  if (!token) throw new SubmissionError(400, 'TURNSTILE_REQUIRED', '사람인지 확인해주세요.')
  const verified = options.localSimulation
    ? token === 'local-test-token'
    : options.secret
      ? await verifyTurnstile(token, options.secret, request.headers.get('CF-Connecting-IP'))
      : false
  if (!verified) throw new SubmissionError(400, 'TURNSTILE_FAILED', '사람 확인에 실패했습니다.')

  const normalized = normalizeSubmittedUrl(rawUrl)
  const hash = await sha256(normalized)
  const now = new Date().toISOString()
  await db
    .prepare(
      `INSERT OR IGNORE INTO submissions (
        id, submitted_url, normalized_url_hash, note, status, created_at, updated_at
      )
      SELECT ?, ?, ?, ?, 'received', ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM sources WHERE canonical_url = ?)`,
    )
    .bind(crypto.randomUUID(), normalized, hash, note || null, now, now, normalized)
    .run()
  await db
    .prepare(
      `INSERT INTO daily_metrics (metric_date, metric_key, dimension_key, count)
       VALUES (?, 'submission_received', 'all', 1)
       ON CONFLICT(metric_date, metric_key, dimension_key)
       DO UPDATE SET count = count + 1`,
    )
    .bind(now.slice(0, 10))
    .run()
}
