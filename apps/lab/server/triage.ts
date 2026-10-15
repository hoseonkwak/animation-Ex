import type { CandidateTriageItem, CandidateTriagePayload, TriageBucket } from '../src/shared/admin'

interface TriageRow {
  id: string
  status: string
  source_title: string | null
  source_category: string | null
  metadata_json: string
  priority_score: number
  created_at: string
  canonical_url: string | null
  creator_name: string | null
  license_code: string | null
  license_evidence_url: string | null
  availability: string
  validation_result: string | null
  validation_fingerprint: string | null
  confirmed_tag: number
  hero_tag: number
}

const buckets: TriageBucket[] = [
  'invalid-url',
  'duplicate',
  'known-failure',
  'missing-info',
  'preview-needed',
  'ready',
]

function penKey(url: string | null): string | null {
  const match = url?.match(/^https:\/\/codepen\.io\/((?:team\/)?[^/]+)\/pen\/([A-Za-z0-9]+)\/?$/)
  return match?.[1] && match[2] ? `${match[1]}/${match[2]}`.toLowerCase() : null
}

function metadata(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function filled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function classifyCandidates(
  rows: TriageRow[],
  publishedPens: Array<{ candidate_id: string | null; pen_key: string }>,
  statusCounts: Record<string, number>,
): CandidateTriagePayload {
  const penOwners = new Map<string, Set<string>>()
  for (const row of rows) {
    const key = penKey(row.canonical_url)
    if (!key) continue
    const owners = penOwners.get(key) ?? new Set<string>()
    owners.add(row.id)
    penOwners.set(key, owners)
  }
  for (const pen of publishedPens) {
    const key = pen.pen_key.toLowerCase()
    const owners = penOwners.get(key) ?? new Set<string>()
    owners.add(pen.candidate_id ?? `published:${key}`)
    penOwners.set(key, owners)
  }

  const bucketCounts = Object.fromEntries([...buckets, 'hero'].map((key) => [key, 0])) as Record<
    TriageBucket | 'hero',
    number
  >
  const items: CandidateTriageItem[] = []
  for (const row of rows) {
    if (row.status !== 'review') continue
    const key = penKey(row.canonical_url)
    const meta = metadata(row.metadata_json)
    const heroSignal =
      row.hero_tag === 1 ||
      row.source_category === 'UI/Intro UI' ||
      /\bhero\b|히어로/i.test(row.source_title ?? '')
    const previewChecked =
      row.validation_result === 'pass' &&
      key !== null &&
      row.validation_fingerprint?.toLowerCase() === `pen:${key}|theme:light|tab:result`
    let bucket: TriageBucket
    let reasons: string[]
    if (!key) {
      bucket = 'invalid-url'
      reasons = ['CodePen 주소 형식 확인']
    } else if ((penOwners.get(key)?.size ?? 0) > 1) {
      bucket = 'duplicate'
      reasons = ['같은 Pen을 가진 다른 후보 또는 공개 예제 확인']
    } else if (row.availability === 'unavailable' || row.validation_result === 'fail') {
      bucket = 'known-failure'
      reasons = [
        row.availability === 'unavailable' ? '접근 불가 기록 확인' : '최근 실행 실패 기록 확인',
      ]
    } else {
      reasons = []
      if (
        !filled(row.source_title) ||
        !filled(meta.publicTitle) ||
        !filled(meta.summary) ||
        !filled(meta.slug)
      )
        reasons.push('제목·요약·slug 보완')
      if (
        !filled(row.creator_name) ||
        !filled(row.license_code) ||
        !filled(row.license_evidence_url)
      )
        reasons.push('작성자·라이선스 근거 보완')
      if (row.confirmed_tag !== 1) reasons.push('기술 또는 영역 태그 확정')
      bucket = reasons.length ? 'missing-info' : previewChecked ? 'ready' : 'preview-needed'
      if (bucket === 'preview-needed') reasons = ['실제 Preview 확인 필요']
      if (bucket === 'ready') reasons = ['승인 조건 최종 확인']
    }
    bucketCounts[bucket] += 1
    if (heroSignal) bucketCounts.hero += 1
    items.push({
      id: row.id,
      sourceTitle: row.source_title ?? '제목 없음',
      sourceCategory: row.source_category,
      creatorName: row.creator_name,
      priorityScore: row.priority_score,
      createdAt: row.created_at,
      previewChecked,
      heroSignal,
      bucket,
      reasons,
    })
  }
  items.sort(
    (a, b) =>
      Number(b.heroSignal) - Number(a.heroSignal) ||
      b.priorityScore - a.priorityScore ||
      a.createdAt.localeCompare(b.createdAt),
  )
  return { items, counts: statusCounts, bucketCounts }
}

export async function loadCandidateTriage(db: D1Database): Promise<CandidateTriagePayload> {
  const candidates = await db
    .prepare(
      `SELECT c.id, c.status, c.source_title, c.source_category, c.metadata_json,
          c.priority_score, c.created_at, s.canonical_url, s.creator_name,
          s.license_code, s.license_evidence_url, s.availability,
          v.result AS validation_result, v.subject_fingerprint AS validation_fingerprint,
          EXISTS (SELECT 1 FROM candidate_tags ct JOIN tags t ON t.id = ct.tag_id
            WHERE ct.candidate_id = c.id AND ct.confirmed = 1
              AND t.axis IN ('technology', 'section')) AS confirmed_tag,
          EXISTS (SELECT 1 FROM candidate_tags ct JOIN tags t ON t.id = ct.tag_id
            WHERE ct.candidate_id = c.id AND t.axis = 'section' AND t.key = 'hero') AS hero_tag
        FROM candidates c JOIN sources s ON s.id = c.source_id
        LEFT JOIN validation_runs v ON v.id = (
          SELECT id FROM validation_runs WHERE target_type = 'candidate' AND target_id = c.id
          ORDER BY checked_at DESC, id DESC LIMIT 1
        )
        WHERE c.status IN ('review', 'approved')`,
    )
    .all<TriageRow>()
  const published = await db
    .prepare(
      `SELECT e.candidate_id, r.pen_key FROM codepen_refs r
        JOIN animation_entries e ON e.id = r.animation_entry_id WHERE e.status = 'published'`,
    )
    .all<{ candidate_id: string | null; pen_key: string }>()
  const counts = await db
    .prepare('SELECT status, COUNT(*) AS count FROM candidates GROUP BY status')
    .all<{
      status: string
      count: number
    }>()
  return classifyCandidates(
    candidates.results,
    published.results,
    Object.fromEntries(counts.results.map((row) => [row.status, row.count])),
  )
}
