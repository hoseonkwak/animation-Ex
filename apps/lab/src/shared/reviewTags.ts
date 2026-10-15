import type { TagAxis } from './examples'

export function isReviewTagAxis(axis: TagAxis): boolean {
  return (
    axis === 'technology' ||
    axis === 'trigger' ||
    axis === 'motion' ||
    axis === 'section' ||
    axis === 'technique'
  )
}
