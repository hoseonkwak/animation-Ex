import type { PracticeCode } from './runtime'

export const codePenPrefillUrl = 'https://codepen.io/cpe/pen/define/'

export function codePenPrefillData(
  code: PracticeCode,
  title: string,
  referenceUrl?: string,
): string {
  return JSON.stringify({
    title,
    description: referenceUrl
      ? `Kwak Motion Lab 자유 연습. 참고한 원본: ${referenceUrl}`
      : 'Kwak Motion Lab 자유 연습',
    html: code.html,
    css: code.css,
    js: code.javascript,
    html_pre_processor: 'none',
    css_pre_processor: 'none',
    js_pre_processor: 'none',
  })
}
