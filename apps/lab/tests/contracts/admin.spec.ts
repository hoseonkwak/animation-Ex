// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DatabaseSync } from 'node:sqlite'
import worker from '../../server/index'
import { createMigratedDatabase } from './database'

let sqlite: DatabaseSync
let database: D1Database
const context = { waitUntil() {}, passThroughOnException() {} } as ExecutionContext
const env = () => ({
  DB: database,
  ADMIN_EMAIL: 'owner@example.test',
  LOCAL_ADMIN_SIMULATION: 'false',
})

function request(
  path: string,
  init: RequestInit = {},
  email = 'owner@example.test',
): Promise<Response> {
  const headers = new Headers(init.headers)
  if (email) headers.set('Cf-Access-Authenticated-User-Email', email)
  if (init.method && init.method !== 'GET') {
    headers.set('Origin', 'https://example.test')
    headers.set('content-type', 'application/json')
  }
  return worker.fetch(
    new Request(`https://example.test${path}`, { ...init, headers }),
    env(),
    context,
  )
}

beforeEach(() => {
  const migrated = createMigratedDatabase({ includeAdminSeed: true })
  sqlite = migrated.sqlite
  database = migrated.d1
})
afterEach(() => sqlite.close())

describe('P1-ADMIN 관리자 검수 계약', () => {
  it('인증 없음은 401, 허용되지 않은 이메일은 403이다', async () => {
    expect((await request('/api/v1/admin/candidates', {}, '')).status).toBe(401)
    expect((await request('/api/v1/admin/candidates', {}, 'other@example.test')).status).toBe(403)
  })

  it('P1-ADMIN-01 실제 CodePen 후보와 태그를 반환한다', async () => {
    const response = await request('/api/v1/admin/candidates?status=review&sort=oldest')
    const body = (await response.json()) as { data: { items: Array<{ id: string }> } }
    expect(response.status).toBe(200)
    expect(body.data.items.map((item) => item.id)).toContain('candidate-admin-tutorial')
    const detail = await request('/api/v1/admin/candidates/candidate-admin-tutorial')
    const detailBody = (await detail.json()) as { data: { embedUrl: string; tags: unknown[] } }
    expect(detailBody.data.embedUrl).toContain('codepen.io/GreenSock/embed/LYpgKPe')
    expect(detailBody.data.tags.length).toBeGreaterThan(0)
  })

  it('P1-ADMIN-05 오래된 version 수정을 409로 거절한다', async () => {
    const payload = {
      version: 1,
      sourceTitle: '수정 제목',
      publicTitle: '공개 제목',
      summary: '충분한 요약',
      slug: 'updated-admin-candidate',
      difficulty: 'intermediate',
      featured: false,
      interactionNote: '스크롤',
      creatorName: 'GreenSock',
      licenseCode: 'MIT',
      licenseEvidenceUrl: 'https://codepen.io/GreenSock/pen/LYpgKPe',
      tagIds: ['tag-technology-gsap'],
    }
    expect(
      (
        await request('/api/v1/admin/candidates/candidate-admin-tutorial', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      ).status,
    ).toBe(200)
    expect(
      (
        await request('/api/v1/admin/candidates/candidate-admin-tutorial', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      ).status,
    ).toBe(409)
  })

  it('P1-ADMIN-06 Preview 확인 없이는 승인할 수 없다', async () => {
    const response = await request('/api/v1/admin/candidates/candidate-admin-tutorial/approve', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'without-preview' },
      body: JSON.stringify({ version: 1 }),
    })
    const body = (await response.json()) as { error: { code: string } }
    expect(response.status).toBe(409)
    expect(body.error.code).toBe('PREVIEW_CHECK_REQUIRED')
  })

  it('P1-ADMIN-07 승인 트랜잭션과 멱등성이 Entry 하나를 유지한다', async () => {
    const preview = await request(
      '/api/v1/admin/candidates/candidate-admin-tutorial/preview-checks',
      {
        method: 'POST',
        body: JSON.stringify({
          result: 'pass',
          penKey: 'GreenSock/LYpgKPe',
          viewport: 'desktop',
          failureCodes: [],
        }),
      },
    )
    expect(preview.status).toBe(200)
    const init = {
      method: 'POST',
      headers: { 'Idempotency-Key': 'same-approval-key' },
      body: JSON.stringify({ version: 1 }),
    }
    expect(
      (await request('/api/v1/admin/candidates/candidate-admin-tutorial/approve', init)).status,
    ).toBe(201)
    expect(
      (await request('/api/v1/admin/candidates/candidate-admin-tutorial/approve', init)).status,
    ).toBe(201)
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM animation_entries WHERE candidate_id = 'candidate-admin-tutorial'",
        )
        .get(),
    ).toEqual({ count: 1 })
    expect(
      sqlite.prepare("SELECT status FROM candidates WHERE id = 'candidate-admin-tutorial'").get(),
    ).toEqual({ status: 'approved' })
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM review_decisions WHERE target_id = 'candidate-admin-tutorial' AND decision = 'approve'",
        )
        .get(),
    ).toEqual({ count: 1 })
  })

  it('P1-ADMIN-07 승인 도중 실패하면 앞선 INSERT도 모두 되돌린다', async () => {
    await request('/api/v1/admin/candidates/candidate-admin-tutorial/preview-checks', {
      method: 'POST',
      body: JSON.stringify({
        result: 'pass',
        penKey: 'GreenSock/LYpgKPe',
        viewport: 'desktop',
        failureCodes: [],
      }),
    })
    sqlite.exec(`CREATE TRIGGER reject_test_approval
      BEFORE INSERT ON review_decisions
      WHEN NEW.decision = 'approve'
      BEGIN SELECT RAISE(ABORT, 'forced approval failure'); END`)

    await expect(
      request('/api/v1/admin/candidates/candidate-admin-tutorial/approve', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'forced-failure' },
        body: JSON.stringify({ version: 1 }),
      }),
    ).rejects.toThrow('forced approval failure')
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM animation_entries WHERE candidate_id = 'candidate-admin-tutorial'",
        )
        .get(),
    ).toEqual({ count: 0 })
    expect(
      sqlite.prepare("SELECT status FROM candidates WHERE id = 'candidate-admin-tutorial'").get(),
    ).toEqual({ status: 'review' })
  })
  it('P1-ADMIN-10 공개 중지 후 기존 상세 URL은 410이다', async () => {
    const response = await request('/api/v1/admin/examples/entry-basic-1/unpublish', {
      method: 'POST',
      body: JSON.stringify({ reasonCode: 'owner-request', note: '운영 검증을 위한 공개 중지' }),
    })
    expect(response.status).toBe(200)
    const publicResponse = await worker.fetch(
      new Request('https://example.test/api/v1/examples/gsap-basic-tween'),
      env(),
      context,
    )
    expect(publicResponse.status).toBe(410)
  })
})
