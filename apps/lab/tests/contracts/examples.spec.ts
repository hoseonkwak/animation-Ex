import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DatabaseSync } from 'node:sqlite'

import worker from '../../server/index'
import type { ExampleCard } from '../../src/shared/examples'
import { createMigratedDatabase } from './database'

let sqlite: DatabaseSync
let database: D1Database

const context = {
  waitUntil() {},
  passThroughOnException() {},
} as ExecutionContext

async function request(pathname: string): Promise<Response> {
  return worker.fetch(new Request(`https://example.test${pathname}`), { DB: database }, context)
}

beforeAll(() => {
  const migrated = createMigratedDatabase()
  sqlite = migrated.sqlite
  database = migrated.d1
})

afterAll(() => sqlite?.close())

describe('D1 migrations', () => {
  it('0001~0007과 WP1 seed를 빈 데이터베이스에 재구성한다', () => {
    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)

    expect(tables).toContain('animation_entries')
    expect(tables).toContain('codepen_refs')
    expect(tables).toContain('ingestion_runs')
    expect(tables).toContain('submissions')
  })

  it('잘못된 공개 상태를 DB 제약으로 거절한다', () => {
    expect(() =>
      sqlite
        .prepare(
          `INSERT INTO animation_entries (
            id, slug, title, summary, search_text, content_origin, preview_kind,
            status, difficulty, featured, published_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          'invalid-entry',
          'invalid-entry',
          'Invalid',
          'Invalid',
          'invalid',
          'original-pen',
          'codepen',
          'published',
          'beginner',
          0,
          null,
          '2026-09-16T00:00:00.000Z',
          '2026-09-16T00:00:00.000Z',
        ),
    ).toThrow()
  })
})

describe('GET /api/v1/examples', () => {
  it('published 예제 3개만 카드 계약으로 반환한다', async () => {
    const response = await request('/api/v1/examples')
    const body = (await response.json()) as {
      data: { items: ExampleCard[]; nextCursor: null }
    }

    expect(response.status).toBe(200)
    expect(body.data.items).toHaveLength(3)
    expect(body.data.items.map((item) => item.slug)).not.toContain('hidden-draft-example')
    expect(JSON.stringify(body)).not.toContain('failure_detail')
    expect(JSON.stringify(body)).not.toContain('deduplication_key')
  })

  it('서로 다른 태그 축을 AND로 결합한다', async () => {
    const response = await request('/api/v1/examples?technology=gsap&trigger=scroll')
    const body = (await response.json()) as { data: { items: ExampleCard[] } }

    expect(body.data.items.map((item) => item.slug)).toEqual(['scroll-circle-reveal'])
  })

  it('알 수 없는 필터를 400으로 거절한다', async () => {
    const response = await request('/api/v1/examples?unknown=value')
    const body = (await response.json()) as { error: { code: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_FILTER')
  })
})

describe('GET /api/v1/examples/:slug', () => {
  it('공개 상세에는 출처와 실제 CodePen 실행 정보를 포함한다', async () => {
    const response = await request('/api/v1/examples/gsap-basic-tween')
    const body = (await response.json()) as {
      data: { preview: { embedUrl: string }; source: { creatorName: string } }
    }

    expect(response.status).toBe(200)
    expect(body.data.preview.embedUrl).toContain('codepen.io/hoseonkwak/embed/')
    expect(body.data.source.creatorName).toBe('hoseonkwak')
  })

  it('draft 상세를 404로 숨긴다', async () => {
    const response = await request('/api/v1/examples/hidden-draft-example')

    expect(response.status).toBe(404)
  })
})
