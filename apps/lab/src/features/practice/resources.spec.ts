import { describe, expect, it } from 'vitest'
import { resourceUrl, validPracticeResources } from './resources'
import { buildPracticeDocument } from './runtime'

describe('추가한 연습 리소스', () => {
  it('HTTPS 리소스만 허용하고 CSP에 영향을 주는 문자를 거부한다', () => {
    expect(resourceUrl(' https://cdn.example.test/plugin.js ')).toBe(
      'https://cdn.example.test/plugin.js',
    )
    for (const url of [
      'http://example.test/a.js',
      'javascript:alert(1)',
      'https://user:pass@example.test/a.js',
      "https://example.test/'unsafe-eval'",
    ]) {
      expect(() => resourceUrl(url)).toThrow()
    }
    expect(
      validPracticeResources({ scripts: ['https://example.test/a.js'], styles: [], images: [] }),
    ).toBe(true)
    expect(validPracticeResources({ scripts: [], styles: [] })).toBe(false)
  })

  it('사용자가 추가한 종류별 URL만 CSP에 포함한다', () => {
    const document = buildPracticeDocument({ html: '', css: '', javascript: '' }, 'resources', [], {
      scripts: ['https://example.test/a.js'],
      styles: ['https://example.test/a.css'],
      images: ['https://example.test/a.png'],
    })
    expect(document).toContain("script-src 'unsafe-inline' https://example.test/a.js")
    expect(document).toContain("style-src 'unsafe-inline' https://example.test/a.css")
    expect(document).toContain('img-src data: blob: https://example.test/a.png')
    expect(document).toContain("connect-src 'none'")
  })
})
