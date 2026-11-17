// Match the UI element named in the source title. A Hero requires visual review.
const sections = [
  [
    'gallery',
    /\b(?:galler(?:y|ies)|masonry|photo grid|image grid|lightbox|photo album)\b|갤러리/iu,
  ],
  [
    'dashboard',
    /\b(?:dashboard|analytics panel|admin panel|kanban|control panel|calendar layout|table ui|data table|spreadsheet)\b|대시보드/iu,
  ],
  ['modal', /\b(?:modals?|dialogs?|pop[- ]?ups?|popover|full screen overlay)\b|모달|팝업/iu],
  [
    'slider',
    /\b(?:carousels?|slideshows?|swipers?|image sliders?|content sliders?|photo sliders?|horizontal slides?)\b|캐러셀|슬라이드쇼/iu,
  ],
  [
    'form',
    /\b(?:forms?|inputs?|text fields?|date ?pickers?|file uploads?|login|signup|sign[ -]in|sign[ -]up|checkouts?|search (?:bar|box)|checkbox(?:es)?|radio buttons?|range sliders?|price selectors?)\b|검색창|체크박스|입력창|회원가입/iu,
  ],
  [
    'navigation',
    /\b(?:navigation|nav(?:bar|bars)?|menus?|tabs?|breadcrumbs?|accordions?|sidebars?|pagination)\b|내비게이션|탭 메뉴/iu,
  ],
  [
    'loading',
    /\b(?:loaders?|preloaders?|loadings?|spinners?|progress (?:bar|indicator|ring)|splash screen|skeleton screen)\b|로딩|프리로더/iu,
  ],
  ['button', /\b(?:buttons?|switch(?:es)?|toggles?|play pause|heart likes?)\b|버튼|토글/iu],
  ['card', /\b(?:cards?|thumbnail tiles?|pricing tiles?|profile tiles?)\b|카드/iu],
  [
    'text',
    /\b(?:typograph\w*|fonts?|letter(?:ing|s)?|text|typewriters?|words?|marquees?|headlines?|titles?|tag clouds?|counters?|ascii|kinetic type)\b|텍스트|글자|타이포/iu,
  ],
  [
    'background',
    /\b(?:backgrounds?|gradient bg|animated gradients?|particles? (?:fields?|networks?|confetti|smoke|firefl(?:y|ies))|star\s?fields?|confetti|bokeh|firefl(?:y|ies)|screensavers?|wallpapers?|(?:background|noise) shaders?|glsl noise|canvas wavy lines|shader gradients?)\b|배경|파티클 필드/iu,
  ],
  [
    'image',
    /\b(?:images?|photos?|photography|illustrations?|drawings?|pixel art|css art|artwork|pixelated|silhouettes?|portraits?|origami|dioramas?|maps?|landscapes?|posters?|generative (?:art|design)|svg (?:illustration|drawing))\b|이미지|사진|일러스트/iu,
  ],
  ['slider', /\b(?:sliders?|page turn(?:ing)?|magazine page turn)\b|슬라이더/iu],
] as const

export function inferSection(title: string) {
  const normalized = title
    .replace(/<\/?[^\s<>]+>/g, ' ')
    .replace(/&(?:#\d+|[a-z]+);/giu, ' ')
    .replaceAll('_', ' ')
  return sections.find(([, pattern]) => pattern.test(normalized))?.[0]
}
