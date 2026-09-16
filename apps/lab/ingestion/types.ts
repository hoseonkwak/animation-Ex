export type TagAxis =
  'technology' | 'trigger' | 'motion' | 'section' | 'technique' | 'difficulty' | 'mood'

export interface DiscoveredPost {
  id: string
  url: string
  title: string
  category: string
  page: number
}

export interface NormalizedPen {
  canonicalUrl: string
  penKey: string
  creatorSlug: string
  penId: string
}

export interface ExtractedPen extends NormalizedPen {
  title: string
  creatorName: string
}

export interface ExtractedArticle {
  postId: string
  url: string
  title: string
  category: string
  publishedAt: string | null
  pens: ExtractedPen[]
}

export interface SuggestedTag {
  axis: TagAxis
  key: string
  source: 'imported' | 'inferred'
  confidence: number
  confirmed: boolean
}

export interface IngestionCandidate {
  externalId: string
  discoveredVia: { key: 'wsss'; url: string; category: string }
  source: {
    type: 'codepen'
    url: string
    canonicalUrl: string
    creatorName: string
    creatorSlug: string
    title: string
  }
  suggestedTitleKo: string
  tags: SuggestedTag[]
}
