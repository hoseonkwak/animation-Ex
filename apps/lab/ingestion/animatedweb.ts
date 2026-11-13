import { IngestionParseError, normalizeCodePenUrl } from './normalize.ts'
import { suggestTags } from './tags.ts'
import type { IngestionCandidate } from './types.ts'

export const ANIMATED_WEB_URL = 'https://theanimatedweb.com/collection/codepen/'
export const ANIMATED_WEB_CATEGORY = 'TheAnimatedWeb/CodePen'

export interface AnimatedWebCheckpoint {
  category: typeof ANIMATED_WEB_CATEGORY
  processedExternalIds: string[]
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim()
}

function canonicalPen(raw: string): ReturnType<typeof normalizeCodePenUrl> {
  const url = new URL(raw)
  if (url.hostname !== 'codepen.io') throw new Error('OTHER_SOURCE')
  url.pathname = url.pathname.replace(/\/(?:full|details)\//, '/pen/')
  return normalizeCodePenUrl(url.toString())
}

export function parseAnimatedWebPage(
  html: string,
  checkpoint?: AnimatedWebCheckpoint,
): IngestionCandidate[] {
  const processed = new Set(checkpoint?.processedExternalIds ?? [])
  const items = new Map<string, IngestionCandidate>()
  let cards = 0
  const cardPattern =
    /<a\s+class="grid-item"\s+href="(https:\/\/codepen\.io\/[^"\s]+)"[^>]*>[\s\S]{0,1000}?<a\s+class="external-link"[^>]*href="(\/inspiration\/[a-z0-9-]+\/)"[^>]*>([\s\S]{0,300}?)<\/a>/gi
  for (const match of html.matchAll(cardPattern)) {
    cards += 1
    const [, rawPen, articlePath, rawTitle] = match
    if (!rawPen || !articlePath || !rawTitle) continue
    let pen
    try {
      pen = canonicalPen(decode(rawPen))
    } catch {
      continue
    }
    const title = decode(rawTitle)
    if (!title) continue
    const slug = articlePath.slice('/inspiration/'.length, -1)
    const externalId = `animatedweb:${slug}:${pen.creatorSlug.replaceAll('/', '~')}:${pen.penId}`
    if (processed.has(externalId) || items.has(pen.canonicalUrl)) continue
    items.set(pen.canonicalUrl, {
      externalId,
      discoveredVia: {
        key: 'animatedweb',
        url: `https://theanimatedweb.com${articlePath}`,
        category: ANIMATED_WEB_CATEGORY,
      },
      source: {
        type: 'codepen',
        url: pen.canonicalUrl,
        canonicalUrl: pen.canonicalUrl,
        creatorName: pen.creatorSlug.split('/').at(-1) ?? pen.creatorSlug,
        creatorSlug: pen.creatorSlug,
        title,
      },
      suggestedTitleKo: title,
      tags: suggestTags(ANIMATED_WEB_CATEGORY, title),
    })
  }
  if (cards === 0) {
    throw new IngestionParseError(
      'ANIMATED_WEB_STRUCTURE_CHANGED',
      'The Animated Web 목록에서 CodePen 카드를 찾지 못했습니다.',
    )
  }
  return [...items.values()]
}

export function advanceAnimatedWebCheckpoint(
  previous: AnimatedWebCheckpoint | undefined,
  savedIds: readonly string[],
): AnimatedWebCheckpoint {
  return {
    category: ANIMATED_WEB_CATEGORY,
    processedExternalIds: [...new Set([...(previous?.processedExternalIds ?? []), ...savedIds])],
  }
}
