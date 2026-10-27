import { describe, expect, it } from 'vitest'

import { codePenPrefillData, codePenPrefillUrl } from './codepen'

describe('CodePen prefill', () => {
  it('현재 HTML·CSS·JavaScript와 참고 출처를 하나의 POST payload로 만든다', () => {
    const payload = JSON.parse(
      codePenPrefillData(
        { html: '<main>연습</main>', css: 'main { color: red }', javascript: 'console.log(1)' },
        '내 연습',
        'https://codepen.io/creator/pen/example',
        { author: 'Kwak Motion Lab', licenseCode: 'MIT' },
      ),
    ) as Record<string, string>

    expect(codePenPrefillUrl).toBe('https://codepen.io/cpe/pen/define/')
    expect(payload).toMatchObject({
      title: '내 연습',
      html: '<main>연습</main>',
      css: 'main { color: red }',
      js: 'console.log(1)',
    })
    expect(payload.description).toContain('https://codepen.io/creator/pen/example')
    expect(payload.description).toContain('Kwak Motion Lab · MIT')
  })
})
