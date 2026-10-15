import type { SuggestedTag } from './types.ts'

const exactMappings: Array<{ prefix: string; axis: SuggestedTag['axis']; key: string }> = [
  { prefix: 'Animation/GSAP', axis: 'technology', key: 'gsap' },
  { prefix: 'Animation/CSS3', axis: 'technology', key: 'css' },
  { prefix: 'Animation/SVG', axis: 'technology', key: 'svg' },
  { prefix: 'Animation/Loading', axis: 'section', key: 'loading' },
  { prefix: 'Slider/Image Slider', axis: 'section', key: 'slider' },
  { prefix: 'Parallax/Scroll', axis: 'trigger', key: 'scroll' },
  { prefix: 'Button/', axis: 'section', key: 'button' },
  { prefix: 'Menu/', axis: 'section', key: 'navigation' },
  { prefix: 'Text/', axis: 'section', key: 'text' },
  { prefix: 'UI/Card UI', axis: 'section', key: 'card' },
]

const categorySuggestions: Array<{ category: string; axis: SuggestedTag['axis']; key: string }> = [
  { category: 'Mouse/Mouse Effect', axis: 'trigger', key: 'pointer' },
  { category: 'Image/Hover Effect', axis: 'trigger', key: 'hover' },
  { category: 'Image/Background', axis: 'section', key: 'background' },
  { category: 'Image/Image Effect', axis: 'section', key: 'image' },
  { category: 'Particles/Particles', axis: 'motion', key: 'particles' },
  { category: 'Particles/Three.js', axis: 'technology', key: 'threejs' },
  { category: 'Particles/Canvas', axis: 'technology', key: 'canvas' },
  { category: 'UI/Modal UI', axis: 'section', key: 'modal' },
  { category: 'UI/Dashboard UI', axis: 'section', key: 'dashboard' },
  { category: 'UI/Form UI', axis: 'section', key: 'form' },
  { category: 'UI/Login UI', axis: 'section', key: 'form' },
]

const inferredKeywords: Array<{ pattern: RegExp; axis: SuggestedTag['axis']; key: string }> = [
  {
    pattern: /\b(?:gsap|greensock|tweenmax|timelinemax|scrolltrigger)\b/i,
    axis: 'technology',
    key: 'gsap',
  },
  { pattern: /\b(?:css|css3|scss)\b/i, axis: 'technology', key: 'css' },
  { pattern: /\bsvg\b/i, axis: 'technology', key: 'svg' },
  { pattern: /\bthree(?:\.js|js)\b/i, axis: 'technology', key: 'threejs' },
  { pattern: /\bcanvas\b/i, axis: 'technology', key: 'canvas' },
  { pattern: /\b(?:slider|carousel|swiper)\b|슬라이더|캐러셀/i, axis: 'section', key: 'slider' },
  { pattern: /\b(?:loading|loader|preloader)\b|로딩/i, axis: 'section', key: 'loading' },
  { pattern: /\bbutton\b|버튼/i, axis: 'section', key: 'button' },
  {
    pattern: /\b(?:menu|navigation|navbar)\b|메뉴|내비게이션/i,
    axis: 'section',
    key: 'navigation',
  },
  {
    pattern: /\b(?:text|typography|typewriter)\b|텍스트|타이포그래피/i,
    axis: 'section',
    key: 'text',
  },
  { pattern: /\bcards?\b|카드/i, axis: 'section', key: 'card' },
  { pattern: /\bbackground\b|배경/i, axis: 'section', key: 'background' },
  { pattern: /\b(?:modal|dialog)\b|모달/i, axis: 'section', key: 'modal' },
  { pattern: /\bdashboard\b|대시보드/i, axis: 'section', key: 'dashboard' },
  { pattern: /\bform\b|폼/i, axis: 'section', key: 'form' },
  { pattern: /\bparticles?\b|파티클|입자/i, axis: 'motion', key: 'particles' },
  { pattern: /\bscroll\b|스크롤/i, axis: 'trigger', key: 'scroll' },
  {
    pattern: /\b(?:mouse|mousemove|cursor|pointer)\b|마우스|커서/i,
    axis: 'trigger',
    key: 'pointer',
  },
  { pattern: /hover|마우스\s*오버/i, axis: 'trigger', key: 'hover' },
  { pattern: /drag|드래그/i, axis: 'trigger', key: 'drag' },
  { pattern: /\bhero\b|\bhomepage\b|히어로|메인/i, axis: 'section', key: 'hero' },
  { pattern: /reveal|리빌/i, axis: 'motion', key: 'reveal' },
  { pattern: /marquee|마키/i, axis: 'motion', key: 'marquee' },
]

export function suggestTags(category: string, title: string): SuggestedTag[] {
  const tags: SuggestedTag[] = []
  for (const mapping of exactMappings) {
    if (category === mapping.prefix || category.startsWith(mapping.prefix)) {
      tags.push({
        axis: mapping.axis,
        key: mapping.key,
        source: 'imported',
        confidence: 1,
        confirmed: true,
      })
    }
  }
  for (const suggestion of categorySuggestions) {
    if (category === suggestion.category) {
      tags.push({
        axis: suggestion.axis,
        key: suggestion.key,
        source: 'inferred',
        confidence: 0.85,
        confirmed: false,
      })
    }
  }
  for (const keyword of inferredKeywords) {
    if (
      keyword.pattern.test(title) &&
      !tags.some((tag) => tag.axis === keyword.axis && tag.key === keyword.key)
    ) {
      tags.push({
        axis: keyword.axis,
        key: keyword.key,
        source: 'inferred',
        confidence: 0.7,
        confirmed: false,
      })
    }
  }
  return tags
}
