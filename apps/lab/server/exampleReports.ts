import { verifyTurnstile } from './public'

const reasons = new Set([
  'not-working',
  'source-unavailable',
  'inappropriate',
  'removal-request',
  'other',
])

export class ExampleReportError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export async function acceptExampleReport(
  request: Request,
  db: D1Database,
  slug: string,
  options: { secret?: string; localSimulation: boolean },
): Promise<void> {
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > 4096) {
    throw new ExampleReportError(413, 'INVALID_REPORT', '신고 내용이 너무 깁니다.')
  }
  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    body = parsed as Record<string, unknown>
  } catch {
    throw new ExampleReportError(400, 'INVALID_REPORT', '신고 내용을 확인해주세요.')
  }
  const reasonCode = typeof body.reasonCode === 'string' ? body.reasonCode : ''
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : ''
  if (
    !reasons.has(reasonCode) ||
    note.length > 500 ||
    (reasonCode === 'removal-request' && note.length < 10)
  ) {
    throw new ExampleReportError(400, 'INVALID_REPORT', '신고 사유와 설명을 확인해주세요.')
  }
  if (!token) throw new ExampleReportError(400, 'TURNSTILE_REQUIRED', '사람인지 확인해주세요.')
  const verified = options.localSimulation
    ? token === 'local-test-token'
    : options.secret
      ? await verifyTurnstile(token, options.secret, request.headers.get('CF-Connecting-IP'))
      : false
  if (!verified) throw new ExampleReportError(400, 'TURNSTILE_FAILED', '사람 확인에 실패했습니다.')

  const entry = await db
    .prepare("SELECT id FROM animation_entries WHERE slug = ? AND status = 'published'")
    .bind(slug)
    .first<{ id: string }>()
  if (!entry) throw new ExampleReportError(404, 'ENTRY_NOT_FOUND', '공개 예제를 찾을 수 없습니다.')
  const now = new Date().toISOString()
  await db
    .prepare(
      `INSERT INTO example_reports (
        id, entry_id, reason_code, note, status, report_day, report_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'open', ?, 1, ?, ?)
      ON CONFLICT(entry_id, reason_code, report_day) WHERE status = 'open' DO UPDATE SET
        report_count = report_count + 1,
        note = COALESCE(example_reports.note, excluded.note),
        updated_at = excluded.updated_at`,
    )
    .bind(crypto.randomUUID(), entry.id, reasonCode, note || null, now.slice(0, 10), now, now)
    .run()
}

export class ExampleReportsRepository {
  constructor(private readonly db: D1Database) {}

  async list(status: 'open' | 'closed') {
    const counts = await this.db
      .prepare(
        `SELECT
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open,
          SUM(CASE WHEN status != 'open' THEN 1 ELSE 0 END) AS closed
        FROM example_reports`,
      )
      .first<{ open: number | null; closed: number | null }>()
    const { results } = await this.db
      .prepare(
        `SELECT r.id, r.reason_code, r.note, r.status, r.report_count,
          r.admin_note, r.created_at, r.resolved_at,
          e.id AS entry_id, e.slug, e.title, e.status AS entry_status,
          p.embed_url
        FROM example_reports r JOIN animation_entries e ON e.id = r.entry_id
        LEFT JOIN codepen_refs p ON p.animation_entry_id = e.id AND p.active = 1
        WHERE ${status === 'open' ? "r.status = 'open'" : "r.status != 'open'"}
        ORDER BY r.updated_at DESC, r.id DESC LIMIT 100`,
      )
      .all<{
        id: string
        reason_code: string
        note: string | null
        status: string
        report_count: number
        admin_note: string | null
        created_at: string
        resolved_at: string | null
        entry_id: string
        slug: string
        title: string
        entry_status: string
        embed_url: string | null
      }>()
    return {
      counts: { open: counts?.open ?? 0, closed: counts?.closed ?? 0 },
      items: results.map((row) => ({
        id: row.id,
        entryId: row.entry_id,
        slug: row.slug,
        title: row.title,
        entryStatus: row.entry_status,
        embedUrl: row.embed_url,
        reasonCode: row.reason_code,
        note: row.note,
        status: row.status,
        reportCount: row.report_count,
        adminNote: row.admin_note,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
      })),
    }
  }

  async resolve(id: string, value: unknown, actorHash: string): Promise<void> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new ExampleReportError(400, 'INVALID_REPORT_DECISION', '처리 내용을 확인해주세요.')
    }
    const body = value as Record<string, unknown>
    const action = body.action
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    if (
      !['dismiss', 'unpublish'].includes(String(action)) ||
      note.length < 3 ||
      note.length > 500
    ) {
      throw new ExampleReportError(
        400,
        'INVALID_REPORT_DECISION',
        '처리 근거를 3~500자로 입력해주세요.',
      )
    }
    const report = await this.db
      .prepare(
        `SELECT r.entry_id, r.reason_code, r.status, e.status AS entry_status
        FROM example_reports r JOIN animation_entries e ON e.id = r.entry_id WHERE r.id = ?`,
      )
      .bind(id)
      .first<{ entry_id: string; reason_code: string; status: string; entry_status: string }>()
    if (!report) throw new ExampleReportError(404, 'REPORT_NOT_FOUND', '신고를 찾을 수 없습니다.')
    if (report.status !== 'open') {
      throw new ExampleReportError(409, 'REPORT_ALREADY_CLOSED', '이미 처리한 신고입니다.')
    }
    const now = new Date().toISOString()
    const nextStatus = action === 'dismiss' ? 'dismissed' : 'resolved'
    const updates = [
      this.db
        .prepare(
          `UPDATE example_reports SET status = ?, admin_note = ?, resolved_at = ?, updated_at = ?
           WHERE id = ? AND status = 'open'`,
        )
        .bind(nextStatus, note, now, now, id),
    ]
    if (action === 'unpublish' && report.entry_status === 'published') {
      updates.push(
        this.db
          .prepare(
            "UPDATE animation_entries SET status = 'unpublished', published_at = NULL, updated_at = ? WHERE id = ? AND status = 'published'",
          )
          .bind(now, report.entry_id),
        this.db
          .prepare(
            `INSERT INTO review_decisions (
              id, target_type, target_id, decision, reason_code, note,
              changes_json, actor_email_hash, created_at
            ) VALUES (?, 'entry', ?, 'unpublish', ?, ?, '{}', ?, ?)`,
          )
          .bind(crypto.randomUUID(), report.entry_id, report.reason_code, note, actorHash, now),
        this.db
          .prepare(
            `UPDATE auto_publication_items SET status = 'rolled-back'
             WHERE entry_id = ? AND status = 'published'`,
          )
          .bind(report.entry_id),
      )
    }
    await this.db.batch(updates)
  }
}
