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

  it('GSAP Kit은 CodePen에도 같은 고정 버전을 전달한다', () => {
    const payload = JSON.parse(
      codePenPrefillData(
        { html: '<div></div>', css: '', javascript: 'gsap.to("div", { x: 10 })' },
        'GSAP 연습',
        undefined,
        undefined,
        ['gsap@3.15.0'],
      ),
    ) as Record<string, string>
    expect(payload.js_external).toBe('https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js')
    expect(payload.description).toContain('https://gsap.com/community/standard-license/')
  })

  it('ScrollTrigger Kit은 CodePen에 GSAP 코어와 플러그인을 순서대로 전달한다', () => {
    const payload = JSON.parse(
      codePenPrefillData(
        { html: '<main></main>', css: '', javascript: 'gsap.registerPlugin(ScrollTrigger)' },
        'ScrollTrigger 연습',
        undefined,
        undefined,
        ['gsap@3.15.0', 'gsap-scrolltrigger@3.15.0'],
      ),
    ) as Record<string, string>
    expect(payload.js_external).toBe(
      'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js;https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js',
    )
  })
})
