// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { evaluateUsage } from './operations'

describe('WP7 free usage guard', () => {
  it.each([
    [69_999, 'normal'],
    [70_000, 'warning'],
    [90_000, 'paused'],
  ] as const)('Worker 요청 %i건을 %s 상태로 판정한다', (workerRequests, level) => {
    expect(
      evaluateUsage('2026-09-22', {
        workerRequests,
        d1RowsRead: 0,
        d1RowsWritten: 0,
      }).level,
    ).toBe(level)
  })

  it('세 지표 중 가장 높은 비율을 전체 상태로 사용한다', () => {
    const result = evaluateUsage('2026-09-22', {
      workerRequests: 1,
      d1RowsRead: 4_500_000,
      d1RowsWritten: 70_000,
    })
    expect(result.level).toBe('paused')
    expect(result.metrics.d1RowsRead.ratio).toBe(0.9)
    expect(result.metrics.d1RowsWritten.level).toBe('warning')
  })
})
