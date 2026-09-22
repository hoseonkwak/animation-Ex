// @vitest-environment node

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  cloudflareUsageQuery,
  parseCloudflareUsage,
  usageQueryVariables,
} from '../../scripts/cloudflare-usage'

describe('P1-OPS-06 Cloudflare usage sync', () => {
  it('Workers와 D1 Analytics 그룹을 하루 사용량으로 합산한다', () => {
    const fixture = JSON.parse(
      readFileSync(path.resolve('../../fixtures/cloudflare/usage.json'), 'utf8'),
    )
    expect(parseCloudflareUsage('2026-09-22', fixture)).toEqual({
      date: '2026-09-22',
      workerRequests: 70_000,
      d1RowsRead: 3_500_000,
      d1RowsWritten: 70_000,
    })
  })

  it('대상 Worker와 D1을 명시하고 UTC 하루만 조회한다', () => {
    expect(cloudflareUsageQuery).toContain('workersInvocationsAdaptive')
    expect(cloudflareUsageQuery).toContain('d1AnalyticsAdaptiveGroups')
    expect(usageQueryVariables('2026-09-22', 'account', 'database', 'worker')).toEqual({
      accountTag: 'account',
      date: '2026-09-22',
      databaseId: 'database',
      scriptName: 'worker',
      datetimeStart: '2026-09-22T00:00:00.000Z',
      datetimeEnd: '2026-09-22T23:59:59.999Z',
    })
  })

  it('GraphQL 오류나 빈 계정 응답을 성공으로 처리하지 않는다', () => {
    expect(() =>
      parseCloudflareUsage('2026-09-22', { errors: [{ message: 'forbidden' }] }),
    ).toThrow('forbidden')
    expect(() =>
      parseCloudflareUsage('2026-09-22', { data: { viewer: { accounts: [] } } }),
    ).toThrow('비어 있습니다')
  })
})
