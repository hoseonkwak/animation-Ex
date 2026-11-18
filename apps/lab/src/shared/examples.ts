export const tagAxes = [
  'technology',
  'trigger',
  'motion',
  'section',
  'technique',
  'difficulty',
  'mood',
] as const

export type TagAxis = (typeof tagAxes)[number]
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ContentOrigin = 'original-pen' | 'lab-created'

interface PreviewSource {
  penId: string
  embedUrl: string
}
export type CodePenPreview = PreviewSource &
  ({ kind: 'codepen' } | { kind: 'internal'; runtimeUrl: string; version: string })

export interface ExampleCard {
  id: string
  slug: string
  title: string
  summary: string
  origin: ContentOrigin
  difficulty: Difficulty
  featured: boolean
  runtimeVerified: boolean
  preview: CodePenPreview
  tags: Partial<Record<TagAxis, string[]>>
  publishedAt: string
}

export interface ExampleDetail extends ExampleCard {
  originalTitle: string | null
  practiceKitReady: boolean
  patterns: Array<{ slug: string; title: string }>
  source: {
    creatorName: string
    canonicalUrl: string
    licenseCode: string
    licenseEvidenceUrl: string
  }
}

export interface ExamplesPayload {
  items: ExampleCard[]
  nextCursor: string | null
}

export interface ApiSuccess<T> {
  data: T
  meta: { requestId: string }
}
