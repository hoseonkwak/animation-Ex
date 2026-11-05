import { IngestionParseError, normalizeCodePenUrl } from './normalize.ts'
import { suggestTags } from './tags.ts'
import type { IngestionCandidate, NormalizedPen } from './types.ts'

export interface SparkPen extends NormalizedPen {
  title: string
  description: string
}

export interface SparkIssue {
  id: string
  url: string
  title: string
  pens: SparkPen[]
}

export interface SparkCheckpoint {
  category: 'CodePen/Spark'
  completedIssueIds: string[]
  processedExternalIds: string[]
  lastIssueId: string | null
  zeroReason?: 'NO_NEW_ISSUES' | 'NO_MOTION_PENS' | 'ALL_DUPLICATES'
}

function content(xml: string, tag: string): string {
  const value = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] ?? ''
  return value.replace(/^<!\[CDATA\[|\]\]>$/g, '').trim()
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function motionSignal(value: string): boolean {
  return /animat|motion|moving|scroll|parallax|hover|pointer|mouse|transition|transform|rotate|rotat|spin|loop|stagger|reveal|morph|bounce|swing|wave|swirl|fluid|liquid|pulse|flicker|glow|shimmer|flow|floating|particle|interactive|drag|slide|flip|3d|webgl|canvas|physics|kinetic/i.test(
    value,
  )
}

export function parseSparkFeed(xml: string): SparkIssue[] {
  const issues: SparkIssue[] = []
  for (const item of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const body = item[1] ?? ''
    const url = content(body, 'link')
    const id = url.match(/^https:\/\/codepen\.io\/spark\/(\d+)\/?$/)?.[1]
    if (!id) continue
    const description = content(body, 'description')
    const pens = new Map<string, SparkPen>()
    for (const heading of description.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)) {
      const anchor = heading[1]?.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i)
      if (!anchor?.[1]) continue
      let pen: NormalizedPen
      try {
        pen = normalizeCodePenUrl(anchor[1].replace(/&amp;/g, '&'))
      } catch {
        continue
      }
      const end = (heading.index ?? 0) + heading[0].length
      const next = description.slice(end).search(/<h3\b|<hr\b/i)
      const segment = description.slice(end, next < 0 ? undefined : end + next)
      const title = plainText(anchor[2] ?? '')
      const summary = plainText(segment)
      if (!title || !motionSignal(`${title} ${summary}`)) continue
      pens.set(pen.penKey, { ...pen, title, description: summary })
    }
    issues.push({ id, url, title: plainText(content(body, 'title')), pens: [...pens.values()] })
  }
  if (!issues.length) {
    throw new IngestionParseError(
      'SPARK_FEED_STRUCTURE_CHANGED',
      'Spark 피드에서 호를 찾지 못했습니다.',
    )
  }
  return issues
}

export function buildSparkCandidates(
  issues: readonly SparkIssue[],
  checkpoint?: SparkCheckpoint,
): { items: IngestionCandidate[]; issueIds: string[]; discoveredPens: number } {
  const completed = new Set(checkpoint?.completedIssueIds ?? [])
  const processed = new Set(checkpoint?.processedExternalIds ?? [])
  const issueIds: string[] = []
  const items: IngestionCandidate[] = []
  let discoveredPens = 0
  for (const issue of issues) {
    if (completed.has(issue.id)) continue
    issueIds.push(issue.id)
    discoveredPens += issue.pens.length
    for (const pen of issue.pens) {
      const externalId = `spark:${issue.id}:${pen.creatorSlug.replaceAll('/', '~')}:${pen.penId}`
      if (processed.has(externalId)) continue
      items.push({
        externalId,
        discoveredVia: { key: 'spark', url: issue.url, category: 'CodePen/Spark' },
        source: {
          type: 'codepen',
          url: pen.canonicalUrl,
          canonicalUrl: pen.canonicalUrl,
          creatorName: pen.creatorSlug.split('/').at(-1) ?? pen.creatorSlug,
          creatorSlug: pen.creatorSlug,
          title: pen.title,
        },
        suggestedTitleKo: pen.title,
        tags: suggestTags('CodePen/Spark', `${pen.title} ${pen.description}`),
      })
    }
  }
  return { items, issueIds, discoveredPens }
}

export function advanceSparkCheckpoint(
  issues: readonly SparkIssue[],
  previous: SparkCheckpoint | undefined,
  savedIds: readonly string[],
): SparkCheckpoint {
  const processed = new Set([...(previous?.processedExternalIds ?? []), ...savedIds])
  const completed = new Set(previous?.completedIssueIds ?? [])
  for (const issue of issues) {
    const ids = issue.pens.map(
      (pen) => `spark:${issue.id}:${pen.creatorSlug.replaceAll('/', '~')}:${pen.penId}`,
    )
    if (ids.every((id) => processed.has(id))) completed.add(issue.id)
  }
  return {
    category: 'CodePen/Spark',
    completedIssueIds: [...completed],
    processedExternalIds: [...processed],
    lastIssueId: issues[0]?.id ?? previous?.lastIssueId ?? null,
  }
}
