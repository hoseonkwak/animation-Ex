import { IngestionParseError, normalizeCodePenUrl } from './normalize.ts'
import type { DiscoveredPost, ExtractedArticle, ExtractedPen } from './types.ts'

function decode(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return match?.[1] ? decode(match[1]) : null
}

export function parseWsssList(html: string, categoryUrl: string, page = 1): DiscoveredPost[] {
  const category = decodeURIComponent(new URL(categoryUrl).pathname.replace(/^\/category\/?/, ''))
  const posts = new Map<string, DiscoveredPost>()
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = attribute(match[1] ?? '', 'href')
    if (!href) continue
    const url = new URL(href, categoryUrl)
    const id = url.pathname.match(/^\/(\d+)\/?$/)?.[1]
    if (!id) continue
    const title = decode(match[2] ?? '')
    if (!title) continue
    posts.set(id, { id, url: `https://wsss.tistory.com/${id}`, title, category, page })
  }
  if (posts.size === 0) {
    throw new IngestionParseError(
      'LIST_STRUCTURE_CHANGED',
      '목록에서 숫자 게시물 링크를 찾지 못했습니다.',
    )
  }
  return [...posts.values()]
}

export function parsePaginationPages(html: string, categoryUrl: string): number[] {
  const pages = new Set<number>([1])
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = attribute(match[1] ?? '', 'href')
    if (!href) continue
    const url = new URL(href, categoryUrl)
    if (!url.pathname.startsWith(new URL(categoryUrl).pathname)) continue
    const page = Number(url.searchParams.get('page'))
    if (Number.isInteger(page) && page > 0) pages.add(page)
  }
  return [...pages].sort((left, right) => left - right)
}
export function parseWsssArticle(html: string, articleUrl: string): ExtractedArticle {
  const postId = new URL(articleUrl).pathname.match(/^\/(\d+)\/?$/)?.[1]
  if (!postId)
    throw new IngestionParseError('ARTICLE_STRUCTURE_CHANGED', '게시물 ID를 찾지 못했습니다.')
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const ogTitle = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*>/i)?.[0]
  const title = decode((ogTitle ? attribute(ogTitle, 'content') : null) ?? heading ?? '')
  const categoryHref = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)]
    .map((match) => attribute(match[1] ?? '', 'href'))
    .find((href) => href?.includes('/category/'))
  const tiaraCategory = html.match(/"categoryName"\s*:\s*"([^"]+)"/i)?.[1]
  const category = tiaraCategory
    ? decode(tiaraCategory)
    : categoryHref
      ? decodeURIComponent(new URL(categoryHref, articleUrl).pathname.replace(/^\/category\/?/, ''))
      : ''
  if (!title || !category) {
    throw new IngestionParseError(
      'ARTICLE_STRUCTURE_CHANGED',
      '제목 또는 카테고리를 찾지 못했습니다.',
    )
  }
  const timeTag = html.match(/<time\b[^>]*>/i)?.[0]
  const publishedAt = timeTag ? attribute(timeTag, 'datetime') : null
  const pens = new Map<string, ExtractedPen>()
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = attribute(match[1] ?? '', 'href')
    if (!href || !/^https?:\/\/codepen\.io\//i.test(href)) continue
    let normalized
    try {
      normalized = normalizeCodePenUrl(href)
    } catch {
      continue
    }
    const linkEnd = (match.index ?? 0) + match[0].length
    const nearby = decode(html.slice(linkEnd, linkEnd + 160))
    const creatorName =
      nearby.match(/^\s*by\s+(.+?)\s+\(\s*@/i)?.[1]?.trim() ?? normalized.creatorSlug
    pens.set(normalized.penKey, {
      ...normalized,
      title: decode(match[2] ?? '') || title,
      creatorName,
    })
  }
  if (pens.size === 0) {
    throw new IngestionParseError(
      'CODEPEN_LINK_MISSING',
      '게시물에서 CodePen Pen 링크를 찾지 못했습니다.',
    )
  }
  return {
    postId,
    url: `https://wsss.tistory.com/${postId}`,
    title,
    category,
    publishedAt,
    pens: [...pens.values()],
  }
}
