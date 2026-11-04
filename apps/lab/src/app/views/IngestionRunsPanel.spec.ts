import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import IngestionRunsPanel from './IngestionRunsPanel.vue'
import type { IngestionRun } from '@/shared/admin'

const emptySuccess: IngestionRun = {
  id: 'run-empty',
  sourceName: 'WSSS',
  status: 'success',
  trigger: 'schedule',
  discoveredCount: 0,
  acceptedCount: 0,
  duplicateCount: 0,
  failedCount: 0,
  failureCode: null,
  checkpointAfter: null,
  startedAt: '2026-11-03T08:31:00.000Z',
  finishedAt: '2026-11-03T08:32:00.000Z',
}

afterEach(() => vi.useRealTimers())

describe('IngestionRunsPanel', () => {
  it('0건 성공을 정상 실행으로 표시하고 당일 기록 부재를 실패로 단정하지 않는다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T02:00:00.000Z'))
    const wrapper = mount(IngestionRunsPanel, {
      props: { runs: [emptySuccess], loading: false, error: '' },
    })

    expect(wrapper.text()).toContain('정상 완료 · 신규 0건')
    expect(wrapper.text()).toContain('2026. 11. 03. 17:31 KST')
    expect(wrapper.text()).toContain('오늘 10:37 이후 예약 실행 기록이 아직 없습니다.')
    expect(wrapper.get('a').attributes('href')).toContain('/actions/workflows/wsss-ingestion.yml')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it('오늘 예약 실행이 있으면 미실행 안내를 숨긴다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T10:00:00.000Z'))
    const wrapper = mount(IngestionRunsPanel, {
      props: { runs: [emptySuccess], loading: false, error: '' },
    })

    expect(wrapper.text()).not.toContain('예약 실행 기록이 아직 없습니다.')
  })
})
