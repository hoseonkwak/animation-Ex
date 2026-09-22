export interface CloudflareUsageSnapshot {
  date: string
  workerRequests: number
  d1RowsRead: number
  d1RowsWritten: number
}

interface AnalyticsGroup {
  sum?: { requests?: number; rowsRead?: number; rowsWritten?: number }
}

interface AnalyticsResponse {
  data?: {
    viewer?: {
      accounts?: Array<{
        workersInvocationsAdaptive?: AnalyticsGroup[]
        d1AnalyticsAdaptiveGroups?: AnalyticsGroup[]
      }>
    }
  }
  errors?: Array<{ message?: string }> | null
}

export const cloudflareUsageQuery = `query KwakMotionUsage(
  $accountTag: string!
  $date: Date!
  $datetimeStart: string!
  $datetimeEnd: string!
  $databaseId: string!
  $scriptName: string!
) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      workersInvocationsAdaptive(
        limit: 10000
        filter: {
          scriptName: $scriptName
          datetime_geq: $datetimeStart
          datetime_leq: $datetimeEnd
        }
      ) {
        sum { requests }
      }
      d1AnalyticsAdaptiveGroups(
        limit: 10000
        filter: { date_geq: $date, date_leq: $date, databaseId: $databaseId }
      ) {
        sum { rowsRead rowsWritten }
      }
    }
  }
}`

export function parseCloudflareUsage(
  date: string,
  response: AnalyticsResponse,
): CloudflareUsageSnapshot {
  if (response.errors?.length) {
    throw new Error(
      `Cloudflare Analytics 오류: ${response.errors.map((error) => error.message).join(', ')}`,
    )
  }
  const account = response.data?.viewer?.accounts?.[0]
  if (!account) throw new Error('Cloudflare 계정 사용량 응답이 비어 있습니다.')
  const workerRequests = (account.workersInvocationsAdaptive ?? []).reduce(
    (sum, group) => sum + (group.sum?.requests ?? 0),
    0,
  )
  const d1 = (account.d1AnalyticsAdaptiveGroups ?? []).reduce(
    (sum, group) => ({
      rowsRead: sum.rowsRead + (group.sum?.rowsRead ?? 0),
      rowsWritten: sum.rowsWritten + (group.sum?.rowsWritten ?? 0),
    }),
    { rowsRead: 0, rowsWritten: 0 },
  )
  return { date, workerRequests, d1RowsRead: d1.rowsRead, d1RowsWritten: d1.rowsWritten }
}

export function usageQueryVariables(
  date: string,
  accountTag: string,
  databaseId: string,
  scriptName: string,
) {
  return {
    accountTag,
    date,
    databaseId,
    scriptName,
    datetimeStart: `${date}T00:00:00.000Z`,
    datetimeEnd: `${date}T23:59:59.999Z`,
  }
}
