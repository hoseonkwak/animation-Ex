import { describe, expect, it } from 'vitest'
import type { CandidateTriageItem } from './admin'
import { pickReviewShortlist } from './reviewShortlist'

function item(
  id: string,
  category: string,
  bucket: CandidateTriageItem['bucket'] = 'preview-needed',
  priorityScore = 50,
): CandidateTriageItem {
  return {
    id,
    sourceTitle: id,
    sourceCategory: category,
    creatorName: 'author',
    priorityScore,
    createdAt: '2026-10-15T00:00:00Z',
    previewChecked: bucket === 'ready',
    heroSignal: false,
    bucket,
    reasons: [],
  }
}

describe('pickReviewShortlist', () => {
  it('즉시 검수 가능한 후보만 카테고리별로 고르게 고른다', () => {
    const result = pickReviewShortlist(
      [
        item('a1', 'Animation', 'preview-needed', 90),
        item('a2', 'Animation', 'preview-needed', 80),
        item('b1', 'Button', 'ready', 40),
        item('c1', 'Scroll', 'preview-needed', 70),
        item('bad', 'Button', 'known-failure', 100),
        item('edit', 'Text', 'missing-info', 100),
      ],
      new Set(),
      3,
    )
    expect(result.map(({ id }) => id)).toEqual(['b1', 'a1', 'c1'])
  })

  it('건너뛴 후보를 제외하고 같은 카테고리의 다음 후보로 채운다', () => {
    const items = [item('a1', 'Animation', 'preview-needed', 90), item('a2', 'Animation')]
    expect(pickReviewShortlist(items, new Set(['a1']), 1).map(({ id }) => id)).toEqual(['a2'])
    expect(pickReviewShortlist(items, new Set(['a1']), 0)).toEqual([])
  })
})
