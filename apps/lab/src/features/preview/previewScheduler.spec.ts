import { describe, expect, it } from 'vitest'

import { createPreviewScheduler } from './previewScheduler'

describe('preview scheduler', () => {
  it('동시 실행을 두 개로 제한하고 사용자 실행을 우선한다', () => {
    const scheduler = createPreviewScheduler(2)

    expect(scheduler.request('one')).toBe(true)
    expect(scheduler.request('two')).toBe(true)
    expect(scheduler.request('three')).toBe(false)
    expect(scheduler.activeIds.value).toEqual(['one', 'two'])

    expect(scheduler.request('three', true)).toBe(true)
    expect(scheduler.activeIds.value).toEqual(['two', 'three'])
  })
})
