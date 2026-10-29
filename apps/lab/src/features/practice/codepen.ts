import type { PracticeCode } from './runtime'
import type { PracticeLibrary } from '@/shared/practice'

export const codePenPrefillUrl = 'https://codepen.io/cpe/pen/define/'

export function codePenPrefillData(
  code: PracticeCode,
  title: string,
  referenceUrl?: string,
  kitCredit?: { author: string; licenseCode: string },
  libraries: PracticeLibrary[] = [],
): string {
  const sourceNote = referenceUrl ? `참고한 원본: ${referenceUrl}` : ''
  const kitNote = kitCredit ? `시작 코드: ${kitCredit.author} · ${kitCredit.licenseCode}` : ''
  const libraryNote = libraries.includes('gsap@3.15.0')
    ? '실행 라이브러리: GSAP 3.15.0 · https://gsap.com/community/standard-license/'
    : ''
  return JSON.stringify({
    title,
    description: ['Kwak Motion Lab 자유 연습', sourceNote, kitNote, libraryNote]
      .filter(Boolean)
      .join('\n'),
    html: code.html,
    css: code.css,
    js: code.javascript,
    html_pre_processor: 'none',
    css_pre_processor: 'none',
    js_pre_processor: 'none',
    ...(libraries.includes('gsap@3.15.0')
      ? {
          js_external: [
            'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js',
            ...(libraries.includes('gsap-scrolltrigger@3.15.0')
              ? ['https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js']
              : []),
          ].join(';'),
        }
      : {}),
  })
}
