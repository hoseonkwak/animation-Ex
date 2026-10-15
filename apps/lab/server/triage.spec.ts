import { describe, expect, it } from 'vitest'
import { classifyCandidates } from './triage'

type Row = Parameters<typeof classifyCandidates>[0][number]

const base: Row = {
  id: 'base',
  status: 'review',
  source_title: 'Example',
  source_category: 'Animation/GSAP',
  metadata_json: JSON.stringify({ publicTitle: '예제', summary: '요약', slug: 'example' }),
  priority_score: 50,
  created_at: '2026-10-15T00:00:00Z',
  canonical_url: 'https://codepen.io/author/pen/AbCdE',
  creator_name: 'author',
  license_code: 'MIT',
  license_evidence_url: 'https://example.test/license',
  availability: 'available',
  validation_result: null,
  validation_fingerprint: null,
  confirmed_tag: 1,
  suggested_tag: 1,
  hero_tag: 0,
}

describe('후보 자동 사전 분류', () => {
  it('주소, 중복, 실패, 정보 부족, 실행 확인, 최종 확인을 서로 구분한다', () => {
    const rows: Row[] = [
      { ...base, id: 'invalid', canonical_url: 'https://example.test/' },
      { ...base, id: 'duplicate', canonical_url: 'https://codepen.io/author/pen/Dup01' },
      {
        ...base,
        id: 'failed',
        canonical_url: 'https://codepen.io/author/pen/Fail1',
        validation_result: 'fail',
      },
      {
        ...base,
        id: 'missing',
        canonical_url: 'https://codepen.io/author/pen/Miss1',
        license_code: null,
      },
      { ...base, id: 'preview', canonical_url: 'https://codepen.io/author/pen/Prev1' },
      {
        ...base,
        id: 'ready',
        canonical_url: 'https://codepen.io/author/pen/Ready1',
        validation_result: 'pass',
        validation_fingerprint: 'pen:author/Ready1|theme:light|tab:result',
        hero_tag: 1,
      },
    ]
    const data = classifyCandidates(rows, [{ candidate_id: null, pen_key: 'author/Dup01' }], {
      review: 6,
    })
    expect(Object.fromEntries(data.items.map((item) => [item.id, item.bucket]))).toEqual({
      invalid: 'invalid-url',
      duplicate: 'duplicate',
      failed: 'known-failure',
      missing: 'missing-info',
      preview: 'preview-needed',
      ready: 'ready',
    })
    expect(data.bucketCounts.hero).toBe(1)
    expect(data.items.find((item) => item.id === 'ready')?.previewChecked).toBe(true)
  })

  it('접근 상태가 미확인인 Pen을 404로 단정하지 않는다', () => {
    const data = classifyCandidates([{ ...base, availability: 'unknown' }], [], { review: 1 })
    expect(data.items[0]?.bucket).toBe('preview-needed')
  })

  it('기존 후보의 비어 있는 요약과 slug는 자동 제안으로 보완하고 제안 태그는 검수 시 확정한다', () => {
    const data = classifyCandidates(
      [{ ...base, metadata_json: '{}', confirmed_tag: 0, suggested_tag: 1 }],
      [],
      { review: 1 },
    )
    expect(data.items[0]?.bucket).toBe('preview-needed')
  })

  it('기술·영역 외의 스크롤 태그도 승인 가능한 탐색 태그로 분류한다', () => {
    const data = classifyCandidates(
      [{ ...base, source_category: 'Parallax/Scroll', confirmed_tag: 1, suggested_tag: 0 }],
      [],
      { review: 1 },
    )
    expect(data.items[0]?.bucket).toBe('preview-needed')
  })

  it('존재하는 태그 사전의 Canvas 제안만 정보 보완을 줄인다', () => {
    const row = {
      ...base,
      source_title: 'Particle canvas demo',
      source_category: 'Particles/Canvas',
      confirmed_tag: 0,
      suggested_tag: 0,
    }
    expect(classifyCandidates([row], [], { review: 1 }, new Set()).items[0]?.bucket).toBe(
      'missing-info',
    )
    expect(
      classifyCandidates([row], [], { review: 1 }, new Set(['technology:canvas'])).items[0]?.bucket,
    ).toBe('preview-needed')
  })

  it('Homepage는 Hero 후보로 표시하고 Heroes는 제외한다', () => {
    const rows = [
      { ...base, id: 'homepage', source_title: 'GSAP Homepage Demo' },
      { ...base, id: 'heroes', source_title: 'COMICS HEROES IN POLYGONS' },
    ]
    const data = classifyCandidates(rows, [], { review: 2 })
    expect(data.items.find((item) => item.id === 'homepage')?.heroSignal).toBe(true)
    expect(data.items.find((item) => item.id === 'heroes')?.heroSignal).toBe(false)
  })
})
