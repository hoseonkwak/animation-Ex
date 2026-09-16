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

const inferredKeywords: Array<{ pattern: RegExp; axis: SuggestedTag['axis']; key: string }> = [
  { pattern: /hover|마우스\s*오버/i, axis: 'trigger', key: 'hover' },
  { pattern: /drag|드래그/i, axis: 'trigger', key: 'drag' },
  { pattern: /hero|히어로|homepage|메인/i, axis: 'section', key: 'hero' },
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
