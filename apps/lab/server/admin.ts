import type {
  AdminTag,
  CandidateDetail,
  CandidateListPayload,
  CandidateStatus,
} from '../src/shared/admin'
import type { Difficulty, TagAxis } from '../src/shared/examples'

type Viewport = 'desktop' | 'tablet' | 'mobile'
type ValidationResult = 'pass' | 'fail' | 'warning'

interface CandidateRow {
  id: string
  source_id: string
  status: CandidateStatus
  source_title: string | null
  source_category: string | null
  metadata_json: string
  priority_score: number
  version: number
  created_at: string
  updated_at: string
  canonical_url: string | null
  creator_name: string | null
  license_code: string | null
  license_evidence_url: string | null
  last_checked_at: string | null
}

interface TagRow {
  id: string
  axis: TagAxis
  key: string
  label_ko: string
  source: AdminTag['source']
  confidence: number
  confirmed: number
}

interface ValidationRow {
  result: ValidationResult
  viewport: Viewport
  checked_at: string
  subject_fingerprint: string
  failure_codes_json: string
}

interface ReviewRow {
  decision: string
  reason_code: string | null
  note: string | null
  created_at: string
}

interface CandidateMetadata {
  publicTitle?: string
  summary?: string
  slug?: string
  difficulty?: Difficulty
  featured?: boolean
  interactionNote?: string
}

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message)
  }
}

const candidateStatuses = new Set([
  'review',
  'needs-edit',
  'duplicate',
  'rejected',
  'validation-failed',
  'approved',
])
const difficulties = new Set(['beginner', 'intermediate', 'advanced'])
const viewports = new Set(['desktop', 'tablet', 'mobile'])
const validationResults = new Set(['pass', 'fail', 'warning'])
const rejectReasons = new Set([
  'not-animation',
  'source-unavailable',
  'unsafe-content',
  'broken-preview',
  'unsupported-runtime',
  'insufficient-quality',
  'license-uncertain',
  'other',
])

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AdminApiError(400, 'INVALID_BODY', '요청 본문 형식이 올바르지 않습니다.')
  }
  return value as Record<string, unknown>
}

function stringField(body: Record<string, unknown>, key: string, required = true): string {
  const value = body[key]
  if (typeof value !== 'string' || (required && !value.trim())) {
    throw new AdminApiError(400, 'INVALID_BODY', `${key} 값을 확인해주세요.`, { [key]: 'invalid' })
  }
  return value.trim()
}

function numberField(body: Record<string, unknown>, key: string): number {
  const value = body[key]
  if (!Number.isInteger(value)) {
    throw new AdminApiError(400, 'INVALID_BODY', `${key} 값은 정수여야 합니다.`)
  }
  return value as number
}

function parseMetadata(raw: string): CandidateMetadata {
  try {
    return JSON.parse(raw) as CandidateMetadata
  } catch {
    return {}
  }
}

function penParts(canonicalUrl: string | null): { creator: string; penId: string } | null {
  const match = canonicalUrl?.match(/^https:\/\/codepen\.io\/([^/]+)\/pen\/([A-Za-z0-9]+)\/?$/)
  return match?.[1] && match[2] ? { creator: match[1], penId: match[2] } : null
}

function fingerprint(penKey: string): string {
  return `pen:${penKey}|theme:light|tab:result`
}

function newId(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let time = Date.now()
  let value = ''
  for (let index = 0; index < 10; index += 1) {
    value = alphabet[time % 32] + value
    time = Math.floor(time / 32)
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  for (let index = 0; index < 16; index += 1) value += alphabet[bytes[index]! % 32]
  return value
}

async function candidateRow(db: D1Database, id: string): Promise<CandidateRow> {
  const row = await db
    .prepare(
      `SELECT c.*, s.canonical_url, s.creator_name, s.license_code,
        s.license_evidence_url, s.last_checked_at
      FROM candidates c JOIN sources s ON s.id = c.source_id
      WHERE c.id = ?`,
    )
    .bind(id)
    .first<CandidateRow>()
  if (!row) throw new AdminApiError(404, 'CANDIDATE_NOT_FOUND', '후보를 찾을 수 없습니다.')
  return row
}

async function candidateTags(db: D1Database, id: string): Promise<AdminTag[]> {
  const { results } = await db
    .prepare(
      `SELECT t.id, t.axis, t.key, t.label_ko, ct.source, ct.confidence, ct.confirmed
      FROM candidate_tags ct JOIN tags t ON t.id = ct.tag_id
      WHERE ct.candidate_id = ? ORDER BY t.axis, t.label_ko`,
    )
    .bind(id)
    .all<TagRow>()
  return results.map((tag) => ({
    id: tag.id,
    axis: tag.axis,
    key: tag.key,
    label: tag.label_ko,
    source: tag.source,
    confidence: tag.confidence,
    confirmed: tag.confirmed === 1,
  }))
}

async function lastValidation(db: D1Database, id: string): Promise<ValidationRow | null> {
  return db
    .prepare(
      `SELECT result, viewport, checked_at, subject_fingerprint, failure_codes_json
      FROM validation_runs WHERE target_type = 'candidate' AND target_id = ?
      ORDER BY checked_at DESC, id DESC LIMIT 1`,
    )
    .bind(id)
    .first<ValidationRow>()
}

export class AdminRepository {
  constructor(private readonly db: D1Database) {}

  async list(url: URL): Promise<CandidateListPayload> {
    const status = url.searchParams.get('status') ?? 'review'
    const sort = url.searchParams.get('sort') ?? 'oldest'
    const allowed = new Set(['status', 'category', 'preview', 'sort'])
    for (const key of url.searchParams.keys()) {
      if (!allowed.has(key))
        throw new AdminApiError(400, 'INVALID_FILTER', '지원하지 않는 필터입니다.')
    }
    if (!candidateStatuses.has(status)) {
      throw new AdminApiError(400, 'INVALID_FILTER', '지원하지 않는 후보 상태입니다.')
    }
    if (!['oldest', 'latest', 'priority'].includes(sort)) {
      throw new AdminApiError(400, 'INVALID_FILTER', '지원하지 않는 정렬입니다.')
    }
    const conditions = ['c.status = ?']
    const bindings: unknown[] = [status]
    const category = url.searchParams.get('category')
    if (category) {
      conditions.push('c.source_category = ?')
      bindings.push(category)
    }
    const preview = url.searchParams.get('preview')
    if (preview && !['checked', 'unchecked'].includes(preview)) {
      throw new AdminApiError(400, 'INVALID_FILTER', '지원하지 않는 Preview 필터입니다.')
    }
    if (preview) {
      conditions.push(`${preview === 'checked' ? '' : 'NOT '}EXISTS (
        SELECT 1 FROM validation_runs v
        WHERE v.target_type = 'candidate' AND v.target_id = c.id AND v.result = 'pass'
      )`)
    }
    const order =
      sort === 'priority'
        ? 'c.priority_score DESC, c.created_at ASC'
        : sort === 'latest'
          ? 'c.created_at DESC'
          : 'c.created_at ASC'
    const { results } = await this.db
      .prepare(
        `SELECT c.*, s.canonical_url, s.creator_name, s.license_code,
          s.license_evidence_url, s.last_checked_at
        FROM candidates c JOIN sources s ON s.id = c.source_id
        WHERE ${conditions.join(' AND ')} ORDER BY ${order} LIMIT 100`,
      )
      .bind(...bindings)
      .all<CandidateRow>()

    const items = await Promise.all(
      results.map(async (row) => {
        const [tags, validation] = await Promise.all([
          candidateTags(this.db, row.id),
          lastValidation(this.db, row.id),
        ])
        return {
          id: row.id,
          status: row.status,
          sourceTitle: row.source_title ?? '제목 없음',
          sourceCategory: row.source_category,
          creatorName: row.creator_name,
          priorityScore: row.priority_score,
          version: row.version,
          createdAt: row.created_at,
          previewChecked: validation?.result === 'pass',
          tags,
        }
      }),
    )
    const { results: countRows } = await this.db
      .prepare('SELECT status, COUNT(*) AS count FROM candidates GROUP BY status')
      .all<{ status: string; count: number }>()
    return {
      items,
      counts: Object.fromEntries(countRows.map((row) => [row.status, row.count])),
    }
  }

  async detail(id: string): Promise<CandidateDetail> {
    const row = await candidateRow(this.db, id)
    const metadata = parseMetadata(row.metadata_json)
    const pen = penParts(row.canonical_url)
    if (!pen || !row.canonical_url) {
      throw new AdminApiError(409, 'INVALID_PEN_SOURCE', 'CodePen 주소를 확인해주세요.')
    }
    const [tags, validation, reviews] = await Promise.all([
      candidateTags(this.db, id),
      lastValidation(this.db, id),
      this.db
        .prepare(
          `SELECT decision, reason_code, note, created_at FROM review_decisions
          WHERE target_type = 'candidate' AND target_id = ? ORDER BY created_at DESC`,
        )
        .bind(id)
        .all<ReviewRow>(),
    ])
    return {
      id: row.id,
      status: row.status,
      sourceTitle: row.source_title ?? '',
      sourceCategory: row.source_category,
      creatorName: row.creator_name,
      priorityScore: row.priority_score,
      version: row.version,
      createdAt: row.created_at,
      previewChecked:
        validation?.result === 'pass' &&
        validation.subject_fingerprint === fingerprint(`${pen.creator}/${pen.penId}`),
      tags,
      publicTitle: metadata.publicTitle ?? '',
      summary: metadata.summary ?? '',
      slug: metadata.slug ?? '',
      difficulty: metadata.difficulty ?? 'intermediate',
      featured: metadata.featured ?? false,
      interactionNote: metadata.interactionNote ?? '',
      canonicalUrl: row.canonical_url,
      penId: pen.penId,
      penKey: `${pen.creator}/${pen.penId}`,
      embedUrl: `https://codepen.io/${pen.creator}/embed/${pen.penId}?default-tab=result&theme-id=light`,
      licenseCode: row.license_code,
      licenseEvidenceUrl: row.license_evidence_url,
      lastCheckedAt: row.last_checked_at,
      previewCheck: validation
        ? {
            result: validation.result,
            viewport: validation.viewport,
            checkedAt: validation.checked_at,
            subjectFingerprint: validation.subject_fingerprint,
            failureCodes: JSON.parse(validation.failure_codes_json) as string[],
          }
        : null,
      reviewHistory: reviews.results.map((review) => ({
        decision: review.decision,
        reasonCode: review.reason_code,
        note: review.note,
        createdAt: review.created_at,
      })),
    }
  }

  async update(id: string, value: unknown): Promise<CandidateDetail> {
    const body = object(value)
    const version = numberField(body, 'version')
    const current = await candidateRow(this.db, id)
    if (current.version !== version) {
      throw new AdminApiError(409, 'VERSION_CONFLICT', '다른 변경이 먼저 저장되었습니다.')
    }
    const difficulty = stringField(body, 'difficulty') as Difficulty
    if (!difficulties.has(difficulty)) {
      throw new AdminApiError(400, 'INVALID_BODY', '난이도를 확인해주세요.')
    }
    const tagIds = body.tagIds
    if (!Array.isArray(tagIds) || tagIds.some((tag) => typeof tag !== 'string')) {
      throw new AdminApiError(400, 'INVALID_BODY', '태그 목록을 확인해주세요.')
    }
    const metadata: CandidateMetadata = {
      publicTitle: stringField(body, 'publicTitle'),
      summary: stringField(body, 'summary'),
      slug: stringField(body, 'slug'),
      difficulty,
      featured: body.featured === true,
      interactionNote: typeof body.interactionNote === 'string' ? body.interactionNote.trim() : '',
    }
    const now = new Date().toISOString()
    const statements = [
      this.db
        .prepare(
          `UPDATE candidates SET source_title = ?, metadata_json = ?, version = version + 1,
            updated_at = ? WHERE id = ? AND version = ?`,
        )
        .bind(stringField(body, 'sourceTitle'), JSON.stringify(metadata), now, id, version),
      this.db
        .prepare(
          `UPDATE sources SET creator_name = ?, license_code = ?, license_evidence_url = ?,
            updated_at = ? WHERE id = ?`,
        )
        .bind(
          stringField(body, 'creatorName'),
          stringField(body, 'licenseCode'),
          stringField(body, 'licenseEvidenceUrl'),
          now,
          current.source_id,
        ),
      this.db.prepare('DELETE FROM candidate_tags WHERE candidate_id = ?').bind(id),
      ...tagIds.map((tagId) =>
        this.db
          .prepare(
            `INSERT INTO candidate_tags (candidate_id, tag_id, source, confidence, confirmed)
            VALUES (?, ?, 'admin', 1, 1)`,
          )
          .bind(id, tagId),
      ),
    ]
    await this.db.batch(statements)
    return this.detail(id)
  }

  async previewCheck(id: string, value: unknown, actorHash: string): Promise<CandidateDetail> {
    const body = object(value)
    const current = await candidateRow(this.db, id)
    const pen = penParts(current.canonical_url)
    if (!pen) throw new AdminApiError(409, 'INVALID_PEN_SOURCE', 'CodePen 주소를 확인해주세요.')
    const penKey = stringField(body, 'penKey')
    if (penKey !== `${pen.creator}/${pen.penId}`) {
      throw new AdminApiError(409, 'PEN_CHANGED', '현재 Pen과 검사 대상이 다릅니다.')
    }
    const result = stringField(body, 'result') as ValidationResult
    const viewport = stringField(body, 'viewport') as Viewport
    if (!validationResults.has(result) || !viewports.has(viewport)) {
      throw new AdminApiError(400, 'INVALID_BODY', '검사 결과나 viewport를 확인해주세요.')
    }
    const failureCodes = Array.isArray(body.failureCodes)
      ? body.failureCodes.filter((code): code is string => typeof code === 'string')
      : []
    if (result === 'fail' && failureCodes.length === 0) {
      throw new AdminApiError(400, 'FAILURE_CODE_REQUIRED', '실패 사유를 선택해주세요.')
    }
    const now = new Date().toISOString()
    await this.db
      .prepare(
        `INSERT INTO validation_runs (
          id, target_type, target_id, validator, validator_version, subject_fingerprint,
          result, viewport, failure_codes_json, evidence_json, checked_at, created_at
        ) VALUES (?, 'candidate', ?, 'admin-codepen-preview', '1', ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newId(),
        id,
        fingerprint(penKey),
        result,
        viewport,
        JSON.stringify(failureCodes),
        JSON.stringify({ actorHash }),
        now,
        now,
      )
      .run()
    return this.detail(id)
  }

  async approve(
    id: string,
    value: unknown,
    idempotencyKey: string,
    actorHash: string,
  ): Promise<{ entryId: string; slug: string }> {
    if (!idempotencyKey) {
      throw new AdminApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', '멱등 키가 필요합니다.')
    }
    const prior = await this.db
      .prepare(
        `SELECT result_id FROM admin_idempotency_keys
        WHERE key = ? AND operation = 'approve' AND target_id = ?`,
      )
      .bind(idempotencyKey, id)
      .first<{ result_id: string }>()
    if (prior) {
      const entry = await this.db
        .prepare('SELECT id, slug FROM animation_entries WHERE id = ?')
        .bind(prior.result_id)
        .first<{ id: string; slug: string }>()
      if (entry) return { entryId: entry.id, slug: entry.slug }
    }

    const body = object(value)
    const version = numberField(body, 'version')
    const current = await candidateRow(this.db, id)
    if (current.version !== version) {
      throw new AdminApiError(409, 'VERSION_CONFLICT', '다른 변경이 먼저 저장되었습니다.')
    }
    if (current.status !== 'review') {
      throw new AdminApiError(409, 'INVALID_STATUS', '검수 대기 후보만 승인할 수 있습니다.')
    }
    const metadata = parseMetadata(current.metadata_json)
    const pen = penParts(current.canonical_url)
    if (!pen || !current.canonical_url || !current.creator_name) {
      throw new AdminApiError(409, 'SOURCE_INCOMPLETE', 'CodePen 출처 정보가 부족합니다.')
    }
    if (!current.license_code || !current.license_evidence_url) {
      throw new AdminApiError(409, 'LICENSE_REQUIRED', '라이선스와 확인 근거가 필요합니다.')
    }
    if (!metadata.publicTitle || !metadata.summary || !metadata.slug || !metadata.difficulty) {
      throw new AdminApiError(409, 'METADATA_INCOMPLETE', '공개 메타데이터가 부족합니다.')
    }
    const validation = await lastValidation(this.db, id)
    if (
      validation?.result !== 'pass' ||
      validation.subject_fingerprint !== fingerprint(`${pen.creator}/${pen.penId}`)
    ) {
      throw new AdminApiError(409, 'PREVIEW_CHECK_REQUIRED', '현재 Pen의 실행 확인이 필요합니다.')
    }
    const tags = await candidateTags(this.db, id)
    const confirmed = tags.filter((tag) => tag.confirmed)
    if (!confirmed.some((tag) => tag.axis === 'technology' || tag.axis === 'section')) {
      throw new AdminApiError(409, 'CONFIRMED_TAG_REQUIRED', '기술 또는 영역 태그가 필요합니다.')
    }
    const duplicate = await this.db
      .prepare('SELECT id FROM animation_entries WHERE slug = ?')
      .bind(metadata.slug)
      .first<{ id: string }>()
    if (duplicate) throw new AdminApiError(409, 'SLUG_CONFLICT', '이미 사용 중인 slug입니다.')

    const entryId = newId()
    const now = new Date().toISOString()
    const searchText =
      `${metadata.publicTitle} ${metadata.summary} ${tags.map((tag) => tag.key).join(' ')}`.toLocaleLowerCase(
        'ko-KR',
      )
    const statements = [
      this.db
        .prepare(
          `INSERT INTO animation_entries (
            id, candidate_id, source_id, slug, title, original_title, summary, search_text,
            content_origin, preview_kind, status, difficulty, featured, published_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'original-pen', 'codepen', 'published', ?, ?, ?, ?, ?)`,
        )
        .bind(
          entryId,
          id,
          current.source_id,
          metadata.slug,
          metadata.publicTitle,
          current.source_title,
          metadata.summary,
          searchText,
          metadata.difficulty,
          metadata.featured ? 1 : 0,
          now,
          now,
          now,
        ),
      this.db
        .prepare(
          `INSERT INTO codepen_refs (
            id, animation_entry_id, pen_key, pen_id, creator_slug, canonical_url,
            embed_url, theme_id, default_tab, active, last_verified_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'light', 'result', 1, ?)`,
        )
        .bind(
          newId(),
          entryId,
          `${pen.creator}/${pen.penId}`,
          pen.penId,
          pen.creator,
          current.canonical_url,
          `https://codepen.io/${pen.creator}/embed/${pen.penId}?default-tab=result&theme-id=light`,
          validation.checked_at,
        ),
      ...confirmed.map((tag) =>
        this.db
          .prepare(
            `INSERT INTO entry_tags (animation_entry_id, tag_id, source, confidence, confirmed)
            VALUES (?, ?, ?, ?, 1)`,
          )
          .bind(entryId, tag.id, tag.source, tag.confidence),
      ),
      this.db
        .prepare(
          `INSERT INTO review_decisions (
            id, target_type, target_id, decision, changes_json, actor_email_hash, created_at
          ) VALUES (?, 'candidate', ?, 'approve', ?, ?, ?)`,
        )
        .bind(newId(), id, JSON.stringify({ entryId, slug: metadata.slug }), actorHash, now),
      this.db
        .prepare(
          `UPDATE candidates SET status = 'approved', version = version + 1, updated_at = ?
          WHERE id = ? AND version = ?`,
        )
        .bind(now, id, version),
      this.db
        .prepare(
          `INSERT INTO admin_idempotency_keys (key, operation, target_id, result_id, created_at)
          VALUES (?, 'approve', ?, ?, ?)`,
        )
        .bind(idempotencyKey, id, entryId, now),
    ]
    await this.db.batch(statements)
    return { entryId, slug: metadata.slug }
  }

  async decide(id: string, value: unknown, actorHash: string): Promise<CandidateDetail> {
    const body = object(value)
    const version = numberField(body, 'version')
    const current = await candidateRow(this.db, id)
    if (current.version !== version) {
      throw new AdminApiError(409, 'VERSION_CONFLICT', '다른 변경이 먼저 저장되었습니다.')
    }
    const decision = stringField(body, 'decision')
    if (!['reject', 'needs-edit', 'merge'].includes(decision)) {
      throw new AdminApiError(400, 'INVALID_DECISION', '지원하지 않는 결정입니다.')
    }
    const reasonCode = stringField(body, 'reasonCode')
    const note = stringField(body, 'note')
    if (decision === 'reject' && !rejectReasons.has(reasonCode)) {
      throw new AdminApiError(400, 'INVALID_REASON', '지원하지 않는 거절 사유입니다.')
    }
    const status =
      decision === 'reject' ? 'rejected' : decision === 'merge' ? 'duplicate' : 'needs-edit'
    const now = new Date().toISOString()
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO review_decisions (
            id, target_type, target_id, decision, reason_code, note,
            changes_json, actor_email_hash, created_at
          ) VALUES (?, 'candidate', ?, ?, ?, ?, '{}', ?, ?)`,
        )
        .bind(newId(), id, decision, reasonCode, note, actorHash, now),
      this.db
        .prepare(
          'UPDATE candidates SET status = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?',
        )
        .bind(status, now, id, version),
    ])
    return this.detail(id)
  }

  async unpublish(entryId: string, value: unknown, actorHash: string): Promise<void> {
    const body = object(value)
    const reasonCode = stringField(body, 'reasonCode')
    const note = stringField(body, 'note')
    const entry = await this.db
      .prepare("SELECT id FROM animation_entries WHERE id = ? AND status = 'published'")
      .bind(entryId)
      .first<{ id: string }>()
    if (!entry) throw new AdminApiError(404, 'ENTRY_NOT_FOUND', '공개 예제를 찾을 수 없습니다.')
    const now = new Date().toISOString()
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE animation_entries SET status = 'unpublished', published_at = NULL, updated_at = ? WHERE id = ?",
        )
        .bind(now, entryId),
      this.db
        .prepare(
          `INSERT INTO review_decisions (
            id, target_type, target_id, decision, reason_code, note,
            changes_json, actor_email_hash, created_at
          ) VALUES (?, 'entry', ?, 'unpublish', ?, ?, '{}', ?, ?)`,
        )
        .bind(newId(), entryId, reasonCode, note, actorHash, now),
    ])
  }
}

export async function actorEmailHash(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(email.trim().toLocaleLowerCase('en-US'))
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
