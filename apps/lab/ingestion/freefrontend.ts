import { IngestionParseError, normalizeCodePenUrl } from './normalize.ts'
import { suggestTags } from './tags.ts'
import type { IngestionCandidate, SuggestedTag } from './types.ts'

export const FREEFRONTEND_PAGES = [
  {
    slug: 'css-gallery',
    section: 'gallery',
    category: 'FreeFrontend/Gallery',
    requiresMotionTitle: true,
  },
  {
    slug: 'css-animated-backgrounds',
    section: 'background',
    category: 'FreeFrontend/Background',
    requiresMotionTitle: false,
  },
  {
    slug: 'css-card-hover-effects',
    section: 'card',
    category: 'FreeFrontend/Card',
    requiresMotionTitle: false,
  },
  {
    slug: 'css-hero-sections',
    section: 'hero',
    category: 'FreeFrontend/Hero',
    requiresMotionTitle: true,
  },
  {
    slug: 'css-carousels',
    section: 'slider',
    category: 'FreeFrontend/Slider',
    requiresMotionTitle: false,
  },
  {
    slug: 'css-animations',
    section: null,
    category: 'FreeFrontend/Animation',
    requiresMotionTitle: false,
  },
] as const

export type FreeFrontendPage = (typeof FREEFRONTEND_PAGES)[number]

export interface FreeFrontendCheckpoint {
  category: FreeFrontendPage['category']
  processedExternalIds: string[]
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return match ? (match[1] ?? match[2] ?? match[3] ?? null) : null
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function motionTitle(value: string): boolean {
  return /animat|motion|hover|scroll|parallax|transition|reveal|carousel|slider|marquee|expand|flip|zoom|rotate|morph|fade|slide|moving|interactive|accordion|coverflow/i.test(
    value,
  )
}

export function parseFreeFrontendPage(
  html: string,
  page: FreeFrontendPage,
  checkpoint?: FreeFrontendCheckpoint,
): IngestionCandidate[] {
  const processed = new Set(checkpoint?.processedExternalIds ?? [])
  const items = new Map<string, IngestionCandidate>()
  let cards = 0
  for (const button of html.matchAll(
    /<button\b[^>]*\bdata-stash-source\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)[^>]*>/gi,
  )) {
    const tag = button[0]
    const source = attribute(tag, 'data-stash-source')
    const title = attribute(tag, 'data-stash-title')
    const article = attribute(tag, 'data-stash-url')
    if (!source || !title || !article) continue
    cards += 1
    if (page.requiresMotionTitle && !motionTitle(title)) continue
    if (!/^\/(?:code|-\/(?:\d{4}|old))\/[a-z0-9-]+\/$/i.test(article)) continue
    let pen
    try {
      pen = normalizeCodePenUrl(decode(source))
    } catch {
      continue
    }
    const externalId = `freefrontend:${page.slug}:${pen.creatorSlug.replaceAll('/', '~')}:${pen.penId}`
    if (processed.has(externalId) || items.has(externalId)) continue
    const tags: SuggestedTag[] = suggestTags(page.category, decode(title))
    if (page.section && !tags.some((tag) => tag.axis === 'section' && tag.key === page.section)) {
      tags.push({
        axis: 'section',
        key: page.section,
        source: 'inferred',
        confidence: 0.85,
        confirmed: false,
      })
    }
    items.set(externalId, {
      externalId,
      discoveredVia: {
        key: 'freefrontend',
        url: `https://freefrontend.com${article}`,
        category: page.category,
      },
      source: {
        type: 'codepen',
        url: pen.canonicalUrl,
        canonicalUrl: pen.canonicalUrl,
        creatorName: pen.creatorSlug.split('/').at(-1) ?? pen.creatorSlug,
        creatorSlug: pen.creatorSlug,
        title: decode(title),
      },
      suggestedTitleKo: decode(title),
      tags,
    })
  }
  if (cards === 0) {
    throw new IngestionParseError(
      'FREEFRONTEND_STRUCTURE_CHANGED',
      'FreeFrontend 목록에서 예제 카드를 찾지 못했습니다.',
    )
  }
  return [...items.values()]
}

export function advanceFreeFrontendCheckpoint(
  page: FreeFrontendPage,
  previous: FreeFrontendCheckpoint | undefined,
  savedIds: readonly string[],
): FreeFrontendCheckpoint {
  return {
    category: page.category,
    processedExternalIds: [...new Set([...(previous?.processedExternalIds ?? []), ...savedIds])],
  }
}
