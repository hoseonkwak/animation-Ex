import type { Difficulty, TagAxis } from './examples'

export type CandidateStatus =
  'review' | 'needs-edit' | 'duplicate' | 'rejected' | 'validation-failed' | 'approved'

export interface AdminTag {
  id: string
  axis: TagAxis
  key: string
  label: string
  source: 'imported' | 'inferred' | 'admin'
  confidence: number
  confirmed: boolean
}

export interface CandidateSummary {
  id: string
  status: CandidateStatus
  sourceTitle: string
  sourceCategory: string | null
  creatorName: string | null
  priorityScore: number
  version: number
  createdAt: string
  previewChecked: boolean
  tags: AdminTag[]
}

export interface CandidateDetail extends CandidateSummary {
  publicTitle: string
  summary: string
  slug: string
  difficulty: Difficulty
  featured: boolean
  interactionNote: string
  canonicalUrl: string
  penId: string
  penKey: string
  embedUrl: string
  licenseCode: string | null
  licenseEvidenceUrl: string | null
  lastCheckedAt: string | null
  previewCheck: null | {
    result: 'pass' | 'fail' | 'warning'
    viewport: 'desktop' | 'tablet' | 'mobile'
    checkedAt: string
    subjectFingerprint: string
    failureCodes: string[]
  }
  reviewHistory: Array<{
    decision: string
    reasonCode: string | null
    note: string | null
    createdAt: string
  }>
}

export interface CandidateListPayload {
  items: CandidateSummary[]
  counts: Record<string, number>
}
