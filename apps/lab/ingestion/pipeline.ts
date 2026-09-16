import { IngestionParseError } from './normalize.ts'
import { parseWsssArticle } from './parser.ts'
import { suggestTags } from './tags.ts'
import type { DiscoveredPost, IngestionCandidate } from './types.ts'

export interface IngestionCheckpoint {
  category: string
  page: number
  lastPostId: string | null
  processedExternalIds: string[]
}

export interface PipelineFailure {
  postId: string
  url: string
  code: string
  message: string
}

export function buildCandidates(
  posts: DiscoveredPost[],
  articleHtmlByUrl: ReadonlyMap<string, string>,
  checkpoint?: IngestionCheckpoint,
): { items: IngestionCandidate[]; failures: PipelineFailure[]; checkpoint: IngestionCheckpoint } {
  const processed = new Set(checkpoint?.processedExternalIds ?? [])
  const items: IngestionCandidate[] = []
  const failures: PipelineFailure[] = []
  let lastPostId = checkpoint?.lastPostId ?? null
  let page = checkpoint?.page ?? posts[0]?.page ?? 1
  let category = checkpoint?.category ?? posts[0]?.category ?? ''

  for (const post of posts) {
    const html = articleHtmlByUrl.get(post.url)
    if (!html) {
      failures.push({
        postId: post.id,
        url: post.url,
        code: 'ARTICLE_UNAVAILABLE',
        message: '게시물 fixture가 없습니다.',
      })
      continue
    }
    try {
      const article = parseWsssArticle(html, post.url)
      article.pens.forEach((pen, index) => {
        const externalId = `wsss:${article.postId}:${index}`
        if (processed.has(externalId)) return
        items.push({
          externalId,
          discoveredVia: { key: 'wsss', url: article.url, category: article.category },
          source: {
            type: 'codepen',
            url: pen.canonicalUrl,
            canonicalUrl: pen.canonicalUrl,
            creatorName: pen.creatorName,
            creatorSlug: pen.creatorSlug,
            title: pen.title,
          },
          suggestedTitleKo: article.title,
          tags: suggestTags(article.category, `${article.title} ${pen.title}`),
        })
      })
      lastPostId = post.id
      page = post.page
      category = post.category
    } catch (error) {
      failures.push({
        postId: post.id,
        url: post.url,
        code: error instanceof IngestionParseError ? error.code : 'ARTICLE_STRUCTURE_CHANGED',
        message: error instanceof Error ? error.message : '알 수 없는 parser 오류',
      })
    }
  }

  const threshold = Math.min(5, Math.max(1, Math.ceil(posts.length * 0.1)))
  const structuralFailures = failures.filter(
    (failure) => failure.code === 'ARTICLE_STRUCTURE_CHANGED',
  ).length
  if (structuralFailures >= threshold) {
    throw new IngestionParseError(
      'ARTICLE_STRUCTURE_CHANGED',
      '게시물 구조 오류 임계치를 넘었습니다.',
    )
  }
  return {
    items,
    failures,
    checkpoint: { category, page, lastPostId, processedExternalIds: [...processed] },
  }
}

export function advanceCheckpoint(
  checkpoint: IngestionCheckpoint,
  acceptedExternalIds: readonly string[],
): IngestionCheckpoint {
  const lastAccepted = acceptedExternalIds.at(-1)
  return {
    ...checkpoint,
    lastPostId: lastAccepted?.split(':')[1] ?? checkpoint.lastPostId,
    processedExternalIds: [
      ...new Set([...checkpoint.processedExternalIds, ...acceptedExternalIds]),
    ],
  }
}
