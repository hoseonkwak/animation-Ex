import { describe, expect, it } from 'vitest'

import { validPracticeLibraries } from './practice'

describe('Practice 실행 라이브러리 허용 목록', () => {
  it('GSAP 코어 뒤의 고정 ScrollTrigger만 허용한다', () => {
    expect(validPracticeLibraries([])).toBe(true)
    expect(validPracticeLibraries(['gsap@3.15.0'])).toBe(true)
    expect(validPracticeLibraries(['gsap@3.15.0', 'gsap-scrolltrigger@3.15.0'])).toBe(true)
    expect(validPracticeLibraries(['gsap-scrolltrigger@3.15.0'])).toBe(false)
    expect(validPracticeLibraries(['gsap@3.15.0', 'gsap@3.15.0'])).toBe(false)
    expect(validPracticeLibraries(['https://example.com/plugin.js'])).toBe(false)
  })
})
