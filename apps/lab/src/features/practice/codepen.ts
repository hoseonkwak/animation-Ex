import type { PracticeCode } from './runtime'

export const codePenPrefillUrl = 'https://codepen.io/cpe/pen/define/'

export function codePenPrefillData(
  code: PracticeCode,
  title: string,
  referenceUrl?: string,
  kitCredit?: { author: string; licenseCode: string },
): string {
  const sourceNote = referenceUrl ? `참고한 원본: ${referenceUrl}` : ''
  const kitNote = kitCredit ? `시작 코드: ${kitCredit.author} · ${kitCredit.licenseCode}` : ''
  return JSON.stringify({
    title,
    description: ['Kwak Motion Lab 자유 연습', sourceNote, kitNote].filter(Boolean).join('\n'),
    html: code.html,
    css: code.css,
    js: code.javascript,
    html_pre_processor: 'none',
    css_pre_processor: 'none',
    js_pre_processor: 'none',
  })
}
