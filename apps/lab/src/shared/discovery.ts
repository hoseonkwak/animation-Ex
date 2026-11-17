import type { ExampleCard } from './examples'

export interface SectionSummary {
  key: string
  label: string
  description: string
  count: number
}

export interface PatternSummary {
  slug: string
  title: string
  summary: string
  count: number
}

export interface CollectionSummary {
  slug: string
  title: string
  description: string
  items: ExampleCard[]
}

export interface DiscoveryPayload {
  totalCount: number
  categories: Array<Pick<SectionSummary, 'key' | 'label' | 'count'>>
  sections: SectionSummary[]
  patterns: PatternSummary[]
  collections: CollectionSummary[]
}
