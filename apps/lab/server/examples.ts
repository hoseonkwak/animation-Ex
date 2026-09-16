import type {
  ContentOrigin,
  Difficulty,
  ExampleCard,
  ExampleDetail,
  TagAxis,
} from '../src/shared/examples'
import { tagAxes } from '../src/shared/examples'

type Sort = 'latest' | 'featured' | 'difficulty'

interface Cursor {
  v: 1
  sort: Sort
  id: string
  publishedAt: string
  featured?: number
  difficultyRank?: number
}

export interface ExampleFilters {
  q?: string | undefined
  tags: Partial<Record<TagAxis, string[]>>
  difficulty?: Difficulty[] | undefined
  origin?: ContentOrigin | undefined
  featured?: boolean | undefined
  sort: Sort
  limit: number
  cursor?: Cursor | undefined
}

interface EntryRow {
  id: string
  slug: string
  title: string
  original_title: string | null
  summary: string
  content_origin: ContentOrigin
  difficulty: Difficulty
  featured: number
  published_at: string
  pen_id: string
  embed_url: string
  creator_name: string
  canonical_url: string
  license_code: string
  license_evidence_url: string
}

interface TagRow {
  animation_entry_id: string
  axis: TagAxis
  key: string
}

export class ApiInputError extends Error {
  constructor(
    readonly code: 'INVALID_FILTER' | 'INVALID_CURSOR',
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message)
  }
}

const allowedParameters = new Set([
  'q',
  ...tagAxes,
  'difficulty',
  'origin',
  'featured',
  'sort',
  'limit',
  'cursor',
])
const keyPattern = /^[a-z0-9-]+$/

function listParameter(url: URL, name: string): string[] | undefined {
  const raw = url.searchParams.get(name)
  if (!raw) return undefined

  const values = [...new Set(raw.split(',').map((value) => value.trim()))]
  if (values.some((value) => !keyPattern.test(value))) {
    throw new ApiInputError('INVALID_FILTER', '지원하지 않는 필터 값입니다.', {
      [name]: raw,
    })
  }
  return values
}

export function parseExampleFilters(url: URL): ExampleFilters {
  for (const key of url.searchParams.keys()) {
    if (!allowedParameters.has(key)) {
      throw new ApiInputError('INVALID_FILTER', '지원하지 않는 필터입니다.', {
        parameter: key,
      })
    }
  }

  const q = url.searchParams.get('q')?.trim()
  if (q && (q.length < 2 || q.length > 80)) {
    throw new ApiInputError('INVALID_FILTER', '검색어는 2자 이상 80자 이하여야 합니다.', {
      q,
    })
  }

  const difficulty = listParameter(url, 'difficulty') as Difficulty[] | undefined
  if (difficulty?.some((value) => !['beginner', 'intermediate', 'advanced'].includes(value))) {
    throw new ApiInputError('INVALID_FILTER', '지원하지 않는 난이도입니다.')
  }

  const origin = url.searchParams.get('origin') as ContentOrigin | null
  if (origin && !['original-pen', 'lab-created'].includes(origin)) {
    throw new ApiInputError('INVALID_FILTER', '지원하지 않는 출처 형식입니다.')
  }

  const featuredValue = url.searchParams.get('featured')
  if (featuredValue && !['true', 'false'].includes(featuredValue)) {
    throw new ApiInputError('INVALID_FILTER', 'featured는 true 또는 false여야 합니다.')
  }

  const sort = (url.searchParams.get('sort') ?? 'latest') as Sort
  if (!['latest', 'featured', 'difficulty'].includes(sort)) {
    throw new ApiInputError('INVALID_FILTER', '지원하지 않는 정렬입니다.')
  }

  const rawLimit = url.searchParams.get('limit') ?? '24'
  if (!/^\d+$/.test(rawLimit)) {
    throw new ApiInputError('INVALID_FILTER', 'limit은 정수여야 합니다.')
  }
  const limit = Number(rawLimit)
  if (limit < 1 || limit > 24) {
    throw new ApiInputError('INVALID_FILTER', 'limit은 1 이상 24 이하여야 합니다.')
  }
  const cursor = parseCursor(url.searchParams.get('cursor'), sort)

  const tags: ExampleFilters['tags'] = {}
  for (const axis of tagAxes) {
    if (axis === 'difficulty') continue
    const values = listParameter(url, axis)
    if (values) tags[axis] = values
  }

  return {
    q: q || undefined,
    tags,
    difficulty,
    origin: origin ?? undefined,
    featured: featuredValue === null ? undefined : featuredValue === 'true',
    sort,
    limit,
    cursor,
  }
}

function parseCursor(raw: string | null, sort: Sort): Cursor | undefined {
  if (!raw) return undefined
  try {
    const normalized = raw.replace(/-/g, '+').replace(/_/g, '/')
    const value = JSON.parse(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')),
    ) as Cursor
    if (
      value.v !== 1 ||
      value.sort !== sort ||
      typeof value.id !== 'string' ||
      typeof value.publishedAt !== 'string'
    ) {
      throw new Error('invalid cursor')
    }
    return value
  } catch {
    throw new ApiInputError('INVALID_CURSOR', '유효하지 않은 cursor입니다.')
  }
}

function encodeCursor(row: EntryRow, sort: Sort): string {
  const value: Cursor = {
    v: 1,
    sort,
    id: row.id,
    publishedAt: row.published_at,
    featured: row.featured,
    difficultyRank: difficultyRank(row.difficulty),
  }
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function difficultyRank(difficulty: Difficulty): number {
  return { beginner: 1, intermediate: 2, advanced: 3 }[difficulty]
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ')
}

function orderBy(sort: Sort): string {
  if (sort === 'featured') {
    return 'e.featured DESC, e.published_at DESC, e.id ASC'
  }
  if (sort === 'difficulty') {
    return "CASE e.difficulty WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 ELSE 3 END, e.published_at DESC, e.id ASC"
  }
  return 'e.published_at DESC, e.id ASC'
}

function toCard(row: EntryRow, tags: ExampleCard['tags']): ExampleCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    origin: row.content_origin,
    difficulty: row.difficulty,
    featured: row.featured === 1,
    preview: {
      kind: 'codepen',
      penId: row.pen_id,
      embedUrl: row.embed_url,
    },
    tags,
    publishedAt: row.published_at,
  }
}

export class ExamplesRepository {
  constructor(private readonly db: D1Database) {}

  async list(filters: ExampleFilters): Promise<{
    items: ExampleCard[]
    nextCursor: string | null
  }> {
    const conditions = ["e.status = 'published'", "e.preview_kind = 'codepen'", 'p.active = 1']
    const bindings: unknown[] = []

    if (filters.q) {
      conditions.push(`(e.search_text LIKE ? OR EXISTS (
        SELECT 1 FROM entry_tags search_et
        JOIN tags search_t ON search_t.id = search_et.tag_id
        WHERE search_et.animation_entry_id = e.id
          AND (search_t.key LIKE ? OR search_t.label_ko LIKE ? OR search_t.label_en LIKE ?)
      ))`)
      const search = `%${filters.q.toLocaleLowerCase('ko-KR')}%`
      bindings.push(search, search, search, search)
    }
    if (filters.difficulty?.length) {
      conditions.push(`e.difficulty IN (${placeholders(filters.difficulty.length)})`)
      bindings.push(...filters.difficulty)
    }
    if (filters.origin) {
      conditions.push('e.content_origin = ?')
      bindings.push(filters.origin)
    }
    if (filters.featured !== undefined) {
      conditions.push('e.featured = ?')
      bindings.push(filters.featured ? 1 : 0)
    }
    for (const [axis, values] of Object.entries(filters.tags)) {
      if (!values?.length) continue
      conditions.push(`EXISTS (
        SELECT 1 FROM entry_tags filter_et
        JOIN tags filter_t ON filter_t.id = filter_et.tag_id
        WHERE filter_et.animation_entry_id = e.id
          AND filter_t.axis = ?
          AND filter_t.key IN (${placeholders(values.length)})
      )`)
      bindings.push(axis, ...values)
    }

    if (filters.cursor) {
      const cursor = filters.cursor
      if (filters.sort === 'latest') {
        conditions.push('(e.published_at < ? OR (e.published_at = ? AND e.id > ?))')
        bindings.push(cursor.publishedAt, cursor.publishedAt, cursor.id)
      } else if (filters.sort === 'featured' && cursor.featured !== undefined) {
        conditions.push(`(e.featured < ? OR (e.featured = ? AND
          (e.published_at < ? OR (e.published_at = ? AND e.id > ?))))`)
        bindings.push(
          cursor.featured,
          cursor.featured,
          cursor.publishedAt,
          cursor.publishedAt,
          cursor.id,
        )
      } else if (filters.sort === 'difficulty' && cursor.difficultyRank !== undefined) {
        const rank =
          "CASE e.difficulty WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 ELSE 3 END"
        conditions.push(`(${rank} > ? OR (${rank} = ? AND
          (e.published_at < ? OR (e.published_at = ? AND e.id > ?))))`)
        bindings.push(
          cursor.difficultyRank,
          cursor.difficultyRank,
          cursor.publishedAt,
          cursor.publishedAt,
          cursor.id,
        )
      } else {
        throw new ApiInputError('INVALID_CURSOR', '정렬과 cursor가 일치하지 않습니다.')
      }
    }

    bindings.push(filters.limit + 1)
    const query = `
      SELECT e.id, e.slug, e.title, e.original_title, e.summary,
        e.content_origin, e.difficulty, e.featured, e.published_at,
        p.pen_id, p.embed_url, s.creator_name, s.canonical_url,
        s.license_code, s.license_evidence_url
      FROM animation_entries e
      JOIN codepen_refs p ON p.animation_entry_id = e.id
      JOIN sources s ON s.id = e.source_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy(filters.sort)}
      LIMIT ?
    `
    const { results } = await this.db
      .prepare(query)
      .bind(...bindings)
      .all<EntryRow>()

    const hasNextPage = results.length > filters.limit
    const pageRows = hasNextPage ? results.slice(0, filters.limit) : results
    const items = await this.hydrateTags(pageRows)
    const lastRow = pageRows.at(-1)
    return {
      items,
      nextCursor: hasNextPage && lastRow ? encodeCursor(lastRow, filters.sort) : null,
    }
  }

  async findPublishedBySlug(slug: string): Promise<ExampleDetail | null> {
    const row = await this.db
      .prepare(
        `SELECT e.id, e.slug, e.title, e.original_title, e.summary,
          e.content_origin, e.difficulty, e.featured, e.published_at,
          p.pen_id, p.embed_url, s.creator_name, s.canonical_url,
          s.license_code, s.license_evidence_url
        FROM animation_entries e
        JOIN codepen_refs p ON p.animation_entry_id = e.id AND p.active = 1
        JOIN sources s ON s.id = e.source_id
        WHERE e.slug = ? AND e.status = 'published' AND e.preview_kind = 'codepen'`,
      )
      .bind(slug)
      .first<EntryRow>()

    if (!row) return null
    const card = (await this.hydrateTags([row]))[0]
    if (!card) return null
    return {
      ...card,
      originalTitle: row.original_title,
      source: {
        creatorName: row.creator_name,
        canonicalUrl: row.canonical_url,
        licenseCode: row.license_code,
        licenseEvidenceUrl: row.license_evidence_url,
      },
    }
  }

  async statusBySlug(slug: string): Promise<string | null> {
    const row = await this.db
      .prepare('SELECT status FROM animation_entries WHERE slug = ?')
      .bind(slug)
      .first<{ status: string }>()
    return row?.status ?? null
  }
  private async hydrateTags(rows: EntryRow[]): Promise<ExampleCard[]> {
    if (rows.length === 0) return []

    const ids = rows.map((row) => row.id)
    const { results } = await this.db
      .prepare(
        `SELECT et.animation_entry_id, t.axis, t.key
        FROM entry_tags et
        JOIN tags t ON t.id = et.tag_id AND t.active = 1
        WHERE et.animation_entry_id IN (${placeholders(ids.length)})
        ORDER BY t.axis, t.key`,
      )
      .bind(...ids)
      .all<TagRow>()

    const tagsByEntry = new Map<string, ExampleCard['tags']>()
    for (const tag of results) {
      const tags = tagsByEntry.get(tag.animation_entry_id) ?? {}
      const values = tags[tag.axis] ?? []
      values.push(tag.key)
      tags[tag.axis] = values
      tagsByEntry.set(tag.animation_entry_id, tags)
    }

    return rows.map((row) => toCard(row, tagsByEntry.get(row.id) ?? {}))
  }
}
