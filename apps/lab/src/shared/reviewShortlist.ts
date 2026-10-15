import type { CandidateTriageItem } from './admin'

const eligibleBuckets = new Set(['ready', 'preview-needed'])

function compareCandidates(a: CandidateTriageItem, b: CandidateTriageItem): number {
  return (
    Number(b.bucket === 'ready') - Number(a.bucket === 'ready') ||
    Number(b.heroSignal) - Number(a.heroSignal) ||
    b.priorityScore - a.priorityScore ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  )
}

export function pickReviewShortlist(
  items: CandidateTriageItem[],
  skippedIds: ReadonlySet<string> = new Set(),
  limit = 12,
): CandidateTriageItem[] {
  if (limit <= 0) return []
  const groups = new Map<string, CandidateTriageItem[]>()
  for (const item of items) {
    if (!eligibleBuckets.has(item.bucket) || skippedIds.has(item.id)) continue
    const category = item.sourceCategory?.trim() || '미분류'
    const group = groups.get(category) ?? []
    group.push(item)
    groups.set(category, group)
  }
  const orderedGroups = [...groups.values()]
  for (const group of orderedGroups) group.sort(compareCandidates)
  orderedGroups.sort((a, b) => compareCandidates(a[0]!, b[0]!))

  const result: CandidateTriageItem[] = []
  while (result.length < limit && orderedGroups.length) {
    for (let index = 0; index < orderedGroups.length && result.length < limit;) {
      const group = orderedGroups[index]!
      result.push(group.shift()!)
      if (group.length) index += 1
      else orderedGroups.splice(index, 1)
    }
  }
  return result
}
