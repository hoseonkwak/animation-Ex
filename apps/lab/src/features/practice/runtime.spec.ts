import { describe, expect, it } from 'vitest'

import { buildPracticeDocument, parsePracticeMessage } from './runtime'

describe('Practice Preview 실행 경계', () => {
  it('사용자 코드를 HTML 파서가 부트스트랩 코드로 해석하지 않게 전달한다', () => {
    const document = buildPracticeDocument(
      {
        html: '<script>parent.alert(1)</script>',
        css: '</style><script>parent.alert(2)</script>',
        javascript: '</script><script>parent.alert(3)</script>',
      },
      'run-1',
    )

    expect(document).toContain("default-src 'none'")
    expect(document).toContain("connect-src 'none'")
    expect(document).not.toContain('<script>parent.alert')
    expect(document).not.toContain('</style><script>')
    expect(document).toContain('\\u003c/script>')
  })

  it('현재 실행 ID의 알려진 메시지만 받아들인다', () => {
    expect(
      parsePracticeMessage({ source: 'kwak-practice', runId: 'old', type: 'ready' }, 'new'),
    ).toBeNull()
    expect(parsePracticeMessage({ source: 'other', runId: 'new', type: 'ready' }, 'new')).toBeNull()
    expect(
      parsePracticeMessage({ source: 'kwak-practice', runId: 'new', type: 'delete' }, 'new'),
    ).toBeNull()
    expect(
      parsePracticeMessage(
        { source: 'kwak-practice', runId: 'new', type: 'error', message: '실행 오류' },
        'new',
      ),
    ).toEqual({ runId: 'new', type: 'error', message: '실행 오류' })
  })
})
