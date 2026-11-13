import { IngestionParseError, normalizeCodePenUrl } from './normalize.ts'
import { suggestTags } from './tags.ts'
import type { IngestionCandidate } from './types.ts'

export const CODEMYUI_CATEGORY = 'CodeMyUI/All'
export const CODEMYUI_API_BASE = 'https://codemyui.com/wp-json/wp/v2/posts'

export interface CodeMyUiPost {
  id: number
  link: string
  title: { rendered: string }
  content: { rendered: string }
}

export interface CodeMyUiCheckpoint {
  category: typeof CODEMYUI_CATEGORY
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

export function parseCodeMyUiPosts(
  posts: unknown,
  checkpoint?: CodeMyUiCheckpoint,
): { items: IngestionCandidate[]; examined: number; withoutPen: number; invalidPostIds: number[] } {
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new IngestionParseError(
      'CODEMYUI_STRUCTURE_CHANGED',
      'CodeMyUI 게시물 배열이 비었습니다.',
    )
  }
  const processed = new Set(checkpoint?.processedExternalIds ?? [])
  const items = new Map<string, IngestionCandidate>()
  let withoutPen = 0
  const invalidPostIds: number[] = []
  for (const input of posts) {
    const post = input as Partial<CodeMyUiPost>
    const link = post?.link
    if (!Number.isSafeInteger(post?.id) || (post.id ?? 0) < 1) {
      throw new IngestionParseError('CODEMYUI_STRUCTURE_CHANGED', 'CodeMyUI 글 ID가 없습니다.')
    }
    if (
      typeof link !== 'string' ||
      !/^https:\/\/codemyui\.com\/[a-z0-9-]+\/$/i.test(link) ||
      typeof post.title?.rendered !== 'string' ||
      typeof post.content?.rendered !== 'string'
    ) {
      invalidPostIds.push(post.id!)
      continue
    }
    if (!post.content.rendered.includes('data-slug-hash')) {
      withoutPen += 1
      continue
    }
    const embed = post.content.rendered.match(
      /<p\b(?=[^>]*\bclass=['"]codepen['"])(?=[^>]*\bdata-slug-hash=['"]([A-Za-z0-9]+)['"])[^>]*>([\s\S]*?)<\/p>/i,
    )
    const penId = embed?.[1]
    const creator = embed?.[2]?.match(/\(@([A-Za-z0-9_-]+)\)/)?.[1]
    if (!penId || !creator) {
      invalidPostIds.push(post.id!)
      continue
    }
    let pen
    try {
      pen = normalizeCodePenUrl(`https://codepen.io/${creator}/pen/${penId}`)
    } catch {
      invalidPostIds.push(post.id!)
      continue
    }
    const externalId = `codemyui:${post.id}:${creator}:${penId}`
    if (processed.has(externalId) || items.has(pen.canonicalUrl)) continue
    const title = decode(post.title.rendered)
    if (!title) {
      invalidPostIds.push(post.id!)
      continue
    }
    items.set(pen.canonicalUrl, {
      externalId,
      discoveredVia: { key: 'codemyui', url: link, category: CODEMYUI_CATEGORY },
      source: {
        type: 'codepen',
        url: pen.canonicalUrl,
        canonicalUrl: pen.canonicalUrl,
        creatorName: creator,
        creatorSlug: pen.creatorSlug,
        title,
      },
      suggestedTitleKo: title,
      tags: suggestTags(CODEMYUI_CATEGORY, title),
    })
  }
  if (invalidPostIds.length > Math.max(5, posts.length * 0.1)) {
    throw new IngestionParseError(
      'CODEMYUI_STRUCTURE_CHANGED',
      `CodeMyUI 게시물 ${posts.length}개 중 ${invalidPostIds.length}개에서 Pen을 확인하지 못했습니다.`,
    )
  }
  return { items: [...items.values()], examined: posts.length, withoutPen, invalidPostIds }
}

export function advanceCodeMyUiCheckpoint(
  previous: CodeMyUiCheckpoint | undefined,
  savedIds: readonly string[],
): CodeMyUiCheckpoint {
  return {
    category: CODEMYUI_CATEGORY,
    processedExternalIds: [...new Set([...(previous?.processedExternalIds ?? []), ...savedIds])],
  }
}
