export interface CandidateCopyInput {
  sourceTitle: string
  suggestedTitle?: string
  category: string | null
  canonicalUrl: string
}

export interface CandidateCopy {
  publicTitle: string
  summary: string
  slug: string
}

function meaningfulTitle(value: string | undefined): string | null {
  const title = value?.replace(/\s+/g, ' ').trim()
  if (!title || /^(?:출처|source|untitled|제목 없음)$/i.test(title)) return null
  return title
}

function summaryFor(title: string, category: string | null): string {
  const context = `${title} ${category ?? ''}`
  if (/slider|carousel|슬라이더|캐러셀/i.test(context))
    return '콘텐츠가 전환되는 슬라이더의 움직임과 상호작용을 확인할 수 있는 예제입니다.'
  if (/scroll|parallax|스크롤|패럴랙스/i.test(context))
    return '스크롤에 반응하는 애니메이션의 움직임을 확인할 수 있는 예제입니다.'
  if (/hover|mouse|pointer|마우스|호버/i.test(context))
    return '마우스 움직임에 반응하는 인터랙션을 확인할 수 있는 예제입니다.'
  if (/loading|loader|로딩/i.test(context))
    return '로딩 상태를 표현하는 애니메이션을 확인할 수 있는 예제입니다.'
  if (/text|type|글자|텍스트/i.test(context))
    return '텍스트가 나타나거나 변화하는 애니메이션을 확인할 수 있는 예제입니다.'
  if (/button|버튼/i.test(context))
    return '버튼에 적용된 움직임과 상호작용을 확인할 수 있는 예제입니다.'
  if (/menu|navigation|메뉴|내비게이션/i.test(context))
    return '메뉴와 내비게이션에 적용된 움직임을 확인할 수 있는 예제입니다.'
  if (/gsap/i.test(context))
    return 'GSAP으로 만든 웹 애니메이션의 움직임을 확인할 수 있는 예제입니다.'
  return '웹 애니메이션의 움직임을 실제 실행 화면에서 확인할 수 있는 예제입니다.'
}

function slugFor(canonicalUrl: string): string {
  const match = canonicalUrl.match(
    /^https:\/\/codepen\.io\/((?:team\/)?[^/]+)\/pen\/([A-Za-z0-9]+)\/?$/,
  )
  if (!match) return ''
  const creator = match[1]!
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const penId = match[2]!.toLowerCase()
  let hash = 2166136261
  for (const character of canonicalUrl) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `pen-${creator}-${penId}-${(hash >>> 0).toString(36)}`
}

export function suggestCandidateCopy(input: CandidateCopyInput): CandidateCopy {
  const publicTitle =
    meaningfulTitle(input.suggestedTitle) ??
    meaningfulTitle(input.sourceTitle) ??
    `웹 애니메이션 예제 ${input.canonicalUrl.split('/').at(-1) ?? ''}`.trim()
  return {
    publicTitle,
    summary: summaryFor(publicTitle, input.category),
    slug: slugFor(input.canonicalUrl),
  }
}
