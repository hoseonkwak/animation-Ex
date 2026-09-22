export const FREE_DAILY_LIMITS = {
  workerRequests: 100_000,
  d1RowsRead: 5_000_000,
  d1RowsWritten: 100_000,
} as const

export const USAGE_WARNING_RATIO = 0.7
export const USAGE_PAUSE_RATIO = 0.9

export type UsageMetric = keyof typeof FREE_DAILY_LIMITS
export type UsageLevel = 'normal' | 'warning' | 'paused'

export interface UsageSnapshot {
  workerRequests: number
  d1RowsRead: number
  d1RowsWritten: number
}

export interface UsageStatus {
  date: string
  level: UsageLevel
  maximumRatio: number
  metrics: Record<UsageMetric, { count: number; limit: number; ratio: number; level: UsageLevel }>
}

const metricKeys: Record<UsageMetric, string> = {
  workerRequests: 'worker_requests',
  d1RowsRead: 'd1_rows_read',
  d1RowsWritten: 'd1_rows_written',
}

function levelForRatio(ratio: number): UsageLevel {
  if (ratio >= USAGE_PAUSE_RATIO) return 'paused'
  if (ratio >= USAGE_WARNING_RATIO) return 'warning'
  return 'normal'
}

export function evaluateUsage(date: string, snapshot: UsageSnapshot): UsageStatus {
  const metrics = Object.fromEntries(
    (Object.keys(FREE_DAILY_LIMITS) as UsageMetric[]).map((key) => {
      const limit = FREE_DAILY_LIMITS[key]
      const count = Math.max(0, snapshot[key])
      const ratio = count / limit
      return [key, { count, limit, ratio, level: levelForRatio(ratio) }]
    }),
  ) as UsageStatus['metrics']
  const maximumRatio = Math.max(...Object.values(metrics).map((metric) => metric.ratio))
  return { date, level: levelForRatio(maximumRatio), maximumRatio, metrics }
}

export async function readUsageStatus(db: D1Database, now = new Date()): Promise<UsageStatus> {
  const date = now.toISOString().slice(0, 10)
  const rows = await db
    .prepare(
      `SELECT metric_key, count
       FROM daily_metrics
       WHERE metric_date = ? AND dimension_key = 'cloudflare'`,
    )
    .bind(date)
    .all<{ metric_key: string; count: number }>()
  const values = new Map(rows.results.map((row) => [row.metric_key, row.count]))
  return evaluateUsage(date, {
    workerRequests: values.get(metricKeys.workerRequests) ?? 0,
    d1RowsRead: values.get(metricKeys.d1RowsRead) ?? 0,
    d1RowsWritten: values.get(metricKeys.d1RowsWritten) ?? 0,
  })
}

export async function storeUsageSnapshot(db: D1Database, value: unknown): Promise<UsageStatus> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('사용량 snapshot 형식이 올바르지 않습니다.')
  }
  const snapshot = value as Partial<UsageSnapshot> & { date?: unknown }
  if (
    typeof snapshot.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.date) ||
    !Number.isSafeInteger(snapshot.workerRequests) ||
    !Number.isSafeInteger(snapshot.d1RowsRead) ||
    !Number.isSafeInteger(snapshot.d1RowsWritten) ||
    snapshot.workerRequests! < 0 ||
    snapshot.d1RowsRead! < 0 ||
    snapshot.d1RowsWritten! < 0
  ) {
    throw new TypeError('날짜와 0 이상의 정수 사용량이 필요합니다.')
  }
  const usage = evaluateUsage(snapshot.date, {
    workerRequests: snapshot.workerRequests!,
    d1RowsRead: snapshot.d1RowsRead!,
    d1RowsWritten: snapshot.d1RowsWritten!,
  })
  await db.batch(
    (Object.keys(metricKeys) as UsageMetric[]).map((key) =>
      db
        .prepare(
          `INSERT INTO daily_metrics (metric_date, metric_key, dimension_key, count)
           VALUES (?, ?, 'cloudflare', ?)
           ON CONFLICT(metric_date, metric_key, dimension_key)
           DO UPDATE SET count = excluded.count`,
        )
        .bind(snapshot.date, metricKeys[key], usage.metrics[key].count),
    ),
  )
  return usage
}
