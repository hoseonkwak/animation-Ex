// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DatabaseSync } from 'node:sqlite'

import worker from '../../server/index'
import { createMigratedDatabase } from './database'

const context = { waitUntil() {}, passThroughOnException() {} } as ExecutionContext
let sqlite: DatabaseSync
let database: D1Database

beforeEach(() => {
  const migrated = createMigratedDatabase()
  sqlite = migrated.sqlite
  database = migrated.d1
})

afterEach(() => sqlite.close())

function report(body: Record<string, unknown>, slug = 'gsap-basic-tween'): Promise<Response> {
  return worker.fetch(
    new Request(`http://localhost/api/v1/examples/${slug}/reports`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { DB: database, LOCAL_ADMIN_SIMULATION: 'true' },
    context,
  )
}

function admin(path: string, init: RequestInit = {}, authenticated = true): Promise<Response> {
  const headers = new Headers(init.headers)
  if (authenticated) headers.set('X-Local-Access-Email', 'owner@local.test')
  if (init.method === 'POST') {
    headers.set('Origin', 'http://localhost')
    headers.set('content-type', 'application/json')
  }
  return worker.fetch(
    new Request(`http://localhost${path}`, { ...init, headers }),
    { DB: database, LOCAL_ADMIN_SIMULATION: 'true' },
    context,
  )
}

const validReport = {
  reasonCode: 'not-working',
  note: '실행 화면이 비어 있습니다.',
  turnstileToken: 'local-test-token',
}

describe('공개 예제 문제 신고 계약', () => {
  it('사람 확인과 입력값을 검증하고 같은 날 같은 사유를 한 건으로 모은다', async () => {
    expect((await report({ ...validReport, turnstileToken: '' })).status).toBe(400)
    expect((await report({ ...validReport, reasonCode: 'unknown' })).status).toBe(400)
    expect(
      (await report({ ...validReport, reasonCode: 'removal-request', note: '짧음' })).status,
    ).toBe(400)
    expect((await report(validReport, 'missing-example')).status).toBe(404)
    expect((await report(validReport)).status).toBe(202)
    expect((await report(validReport)).status).toBe(202)
    expect(sqlite.prepare('SELECT report_count AS count FROM example_reports').get()).toEqual({
      count: 2,
    })
    expect(
      sqlite.prepare("SELECT status FROM animation_entries WHERE id = 'entry-basic-1'").get(),
    ).toEqual({ status: 'published' })
  })

  it('관리자만 신고를 읽고, 문제없음 처리와 중복 처리를 구분한다', async () => {
    await report(validReport)
    expect((await admin('/api/v1/admin/example-reports', {}, false)).status).toBe(401)
    const response = await admin('/api/v1/admin/example-reports')
    const body = (await response.json()) as {
      data: { counts: { open: number }; items: Array<{ id: string; slug: string }> }
    }
    expect(body.data.counts.open).toBe(1)
    expect(body.data.items[0]?.slug).toBe('gsap-basic-tween')
    const id = body.data.items[0]!.id
    expect(
      (
        await admin(
          `/api/v1/admin/example-reports/${id}/resolve`,
          { method: 'POST', body: JSON.stringify({ action: 'dismiss', note: '정상 동작 확인' }) },
          false,
        )
      ).status,
    ).toBe(401)
    const request = () =>
      admin(`/api/v1/admin/example-reports/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action: 'dismiss', note: '정상 동작 확인' }),
      })
    expect((await request()).status).toBe(200)
    expect((await request()).status).toBe(409)
    const closed = await admin('/api/v1/admin/example-reports?status=closed')
    expect(
      ((await closed.json()) as { data: { counts: { closed: number } } }).data.counts.closed,
    ).toBe(1)
    expect((await report(validReport)).status).toBe(202)
    expect(
      sqlite.prepare("SELECT COUNT(*) AS count FROM example_reports WHERE status = 'open'").get(),
    ).toEqual({ count: 1 })
  })

  it('관리자가 공개 중지하면 감사 기록을 남기고 상세 API가 410을 반환한다', async () => {
    await report(validReport)
    const id = sqlite.prepare('SELECT id FROM example_reports').get() as { id: string }
    const response = await admin(`/api/v1/admin/example-reports/${id.id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'unpublish', note: '실행 화면이 비어 있음을 확인했습니다.' }),
    })
    expect(response.status).toBe(200)
    expect(sqlite.prepare('SELECT status FROM example_reports').get()).toEqual({
      status: 'resolved',
    })
    expect(
      sqlite.prepare("SELECT status FROM animation_entries WHERE id = 'entry-basic-1'").get(),
    ).toEqual({ status: 'unpublished' })
    expect(
      sqlite
        .prepare(
          "SELECT decision, reason_code FROM review_decisions WHERE target_id = 'entry-basic-1' AND decision = 'unpublish'",
        )
        .get(),
    ).toEqual({ decision: 'unpublish', reason_code: 'not-working' })
    const detail = await worker.fetch(
      new Request('http://localhost/api/v1/examples/gsap-basic-tween'),
      { DB: database },
      context,
    )
    expect(detail.status).toBe(410)
    expect((await report(validReport)).status).toBe(404)
  })
})
