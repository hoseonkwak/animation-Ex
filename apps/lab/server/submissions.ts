import { AdminApiError } from './admin'

export async function listSubmissions(db: D1Database, url: URL) {
  const status = url.searchParams.get('status') ?? 'all'
  const page = Number(url.searchParams.get('page') ?? '0')
  if (
    !['all', 'received', 'linked', 'rejected'].includes(status) ||
    !Number.isSafeInteger(page) ||
    page < 0 ||
    [...url.searchParams.keys()].some((key) => !['status', 'page'].includes(key))
  ) {
    throw new AdminApiError(400, 'INVALID_FILTER', '제보 조회 조건을 확인해주세요.')
  }
  const countsResult = await db
    .prepare('SELECT status, COUNT(*) AS total FROM submissions GROUP BY status')
    .all<{ status: string; total: number }>()
  const counts: Record<string, number> = { received: 0, linked: 0, rejected: 0 }
  for (const row of countsResult.results) counts[row.status] = row.total
  const total =
    status === 'all'
      ? Object.values(counts).reduce((sum, count) => sum + count, 0)
      : counts[status]!
  const where = status === 'all' ? '' : 'WHERE s.status = ?'
  const query = db.prepare(
    `SELECT s.id, s.submitted_url AS submittedUrl, s.note, s.status,
      s.source_id AS sourceId, s.created_at AS createdAt,
      (SELECT slug FROM animation_entries e WHERE e.source_id = s.source_id
        AND e.status = 'published' ORDER BY e.published_at DESC LIMIT 1) AS entrySlug
      FROM submissions s ${where}
      ORDER BY s.created_at DESC, s.id DESC LIMIT 50 OFFSET ?`,
  )
  const result =
    status === 'all' ? await query.bind(page * 50).all() : await query.bind(status, page * 50).all()
  return { counts, total, page, pageSize: 50, items: result.results }
}
