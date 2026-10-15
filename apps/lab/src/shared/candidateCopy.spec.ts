import { describe, expect, it } from 'vitest'
import { suggestCandidateCopy } from './candidateCopy'

describe('수집 후보 공개 문구 제안', () => {
  it('원본 제목과 카테고리로 한 줄 요약을 만들고 Pen마다 안정적인 slug를 부여한다', () => {
    const input = {
      sourceTitle: 'Parallax Scroll Demo',
      category: 'Parallax/Scroll',
      canonicalUrl: 'https://codepen.io/team/example/pen/AbC123',
    }
    const first = suggestCandidateCopy(input)
    expect(first.publicTitle).toBe('Parallax Scroll Demo')
    expect(first.summary).toContain('스크롤에 반응하는')
    expect(first.slug).toMatch(/^pen-team-example-abc123-[a-z0-9]+$/)
    expect(suggestCandidateCopy(input)).toEqual(first)
  })

  it('제목이 비어 있으면 Pen ID를 사용하고 형식이 잘못된 주소는 slug를 만들지 않는다', () => {
    const result = suggestCandidateCopy({
      sourceTitle: '출처',
      category: null,
      canonicalUrl: 'https://example.test/invalid',
    })
    expect(result.publicTitle).toContain('웹 애니메이션 예제')
    expect(result.summary).toBeTruthy()
    expect(result.slug).toBe('')
  })
})
