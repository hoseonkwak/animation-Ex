import { AdminApiError } from './admin'

export interface AutoPublicationStatus {
  paused: boolean
  batches: Array<{
    id: string
    status: string
    sampleCandidateId: string
    sampleTitle: string
    sampleSlug: string | null
    publishedCount: number
    failureCode: string | null
    createdAt: string
  }>
  lastRun: null | {
    status: string
    examinedCount: number
    passedCount: number
    failureCode: string | null
    startedAt: string
  }
}

export async function readAutoPublicationStatus(db: D1Database): Promise<AutoPublicationStatus> {
  const [control, batches, run] = await Promise.all([
    db
      .prepare('SELECT paused FROM auto_publication_control WHERE id = 1')
      .first<{ paused: number }>(),
    db
      .prepare(
        `SELECT b.id, b.status, b.sample_candidate_id, c.source_title AS sample_title,
        e.slug AS sample_slug,
        b.failure_code, b.created_at,
        (SELECT COUNT(*) FROM auto_publication_items i
          WHERE i.batch_id = b.id AND i.status = 'published') AS published_count
      FROM auto_publication_batches b JOIN candidates c ON c.id = b.sample_candidate_id
      LEFT JOIN animation_entries e ON e.candidate_id = b.sample_candidate_id
      ORDER BY b.created_at DESC LIMIT 10`,
      )
      .all<{
        id: string
        status: string
        sample_candidate_id: string
        sample_title: string | null
        sample_slug: string | null
        failure_code: string | null
        created_at: string
        published_count: number
      }>(),
    db
      .prepare(
        `SELECT status, examined_count, passed_count, failure_code, started_at
        FROM auto_publication_runs ORDER BY started_at DESC LIMIT 1`,
      )
      .first<{
        status: string
        examined_count: number
        passed_count: number
        failure_code: string | null
        started_at: string
      }>(),
  ])
  return {
    paused: control?.paused !== 0,
    batches: batches.results.map((row) => ({
      id: row.id,
      status: row.status,
      sampleCandidateId: row.sample_candidate_id,
      sampleTitle: row.sample_title ?? '제목 없음',
      sampleSlug: row.sample_slug,
      publishedCount: row.published_count,
      failureCode: row.failure_code,
      createdAt: row.created_at,
    })),
    lastRun: run
      ? {
          status: run.status,
          examinedCount: run.examined_count,
          passedCount: run.passed_count,
          failureCode: run.failure_code,
          startedAt: run.started_at,
        }
      : null,
  }
}

export async function setAutoPublicationPaused(db: D1Database, paused: boolean): Promise<void> {
  await db
    .prepare('UPDATE auto_publication_control SET paused = ?, updated_at = ? WHERE id = 1')
    .bind(paused ? 1 : 0, new Date().toISOString())
    .run()
}

export async function rollbackAutoPublicationBatch(
  db: D1Database,
  id: string,
  actorHash: string,
): Promise<void> {
  const batch = await db
    .prepare('SELECT status, run_id FROM auto_publication_batches WHERE id = ?')
    .bind(id)
    .first<{ status: string; run_id: string }>()
  if (!batch)
    throw new AdminApiError(404, 'AUTO_BATCH_NOT_FOUND', '자동 공개 묶음을 찾을 수 없습니다.')
  if (batch.status === 'rolled-back') return
  if (!['published', 'awaiting-sample', 'blocked'].includes(batch.status)) {
    throw new AdminApiError(409, 'AUTO_BATCH_INVALID_STATUS', '취소할 수 없는 묶음입니다.')
  }
  const { results: entries } = await db
    .prepare(
      `SELECT i.entry_id FROM auto_publication_items i JOIN animation_entries e ON e.id = i.entry_id
      WHERE i.batch_id = ? AND i.status = 'published' AND e.status = 'published'`,
    )
    .bind(id)
    .all<{ entry_id: string }>()
  const time = new Date().toISOString()
  await db.batch([
    db
      .prepare('UPDATE auto_publication_control SET paused = 1, updated_at = ? WHERE id = 1')
      .bind(time),
    ...entries.flatMap((entry) => [
      db
        .prepare(
          `UPDATE animation_entries SET status = 'unpublished', published_at = NULL,
            updated_at = ? WHERE id = ? AND status = 'published'`,
        )
        .bind(time, entry.entry_id),
      db
        .prepare(
          `INSERT INTO review_decisions (id, target_type, target_id, decision, reason_code,
            note, changes_json, actor_email_hash, created_at)
          VALUES (?, 'entry', ?, 'unpublish', 'auto-batch-rollback',
            '자동 공개 묶음 취소', '{}', ?, ?)`,
        )
        .bind(crypto.randomUUID(), entry.entry_id, actorHash, time),
    ]),
    db
      .prepare(
        `UPDATE auto_publication_items SET status = 'rolled-back'
          WHERE batch_id = ? AND (role = 'automatic' AND status IN ('published', 'pending', 'blocked')
            OR role = 'sample' AND status = 'published')`,
      )
      .bind(id),
    db
      .prepare(
        `UPDATE auto_publication_items SET status = 'blocked'
          WHERE batch_id = ? AND role = 'sample' AND status = 'awaiting-sample'`,
      )
      .bind(id),
    db
      .prepare(
        `UPDATE auto_publication_batches SET status = 'rolled-back', finished_at = ?
          WHERE id = ?`,
      )
      .bind(time, id),
    db
      .prepare(
        `UPDATE auto_publication_runs SET status = 'blocked', published_count = 0,
          failure_code = 'MANUAL_ROLLBACK', finished_at = ? WHERE id = ?`,
      )
      .bind(time, batch.run_id),
  ])
}
