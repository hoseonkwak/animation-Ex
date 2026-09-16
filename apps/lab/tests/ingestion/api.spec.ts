// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DatabaseSync } from 'node:sqlite'

import { ingestionSignature } from '../../server/ingestion'
import worker from '../../server/index'
import { parseWsssList } from '../../ingestion/parser.ts'
import { buildCandidates } from '../../ingestion/pipeline.ts'
import { createMigratedDatabase } from '../contracts/database'

let sqlite: DatabaseSync
let database: D1Database
const secret = 'contract-secret'
const context = { waitUntil() {}, passThroughOnException() {} } as ExecutionContext
const env = () => ({
  DB: database,
  INGESTION_KEY_ID: 'contract-key',
  INGESTION_HMAC_SECRET: secret,
  ADMIN_EMAIL: 'owner@example.test',
  LOCAL_ADMIN_SIMULATION: 'false',
})
const fixture = (name: string) => readFileSync(path.resolve('fixtures/wsss', name), 'utf8')

function fixtureItems() {
  const categoryUrl = 'https://wsss.tistory.com/category/Animation/GSAP'
  const posts = parseWsssList(fixture('category-gsap.html'), categoryUrl)
  return buildCandidates(
    posts,
    new Map([
      ['https://wsss.tistory.com/1603', fixture('article-1603.html')],
      ['https://wsss.tistory.com/1604', fixture('article-1604-multi.html')],
    ]),
  ).items
}

async function signedRequest(
  pathname: string,
  bodyValue: unknown,
  options: { requestId?: string; timestamp?: string; signature?: string } = {},
): Promise<Response> {
  const body = JSON.stringify(bodyValue)
  const timestamp = options.timestamp ?? new Date().toISOString()
  const requestId = options.requestId ?? crypto.randomUUID()
  const calculated = await ingestionSignature('POST', pathname, timestamp, requestId, body, secret)
  return worker.fetch(
    new Request(`https://example.test${pathname}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Ingestion-Key-Id': 'contract-key',
        'X-Ingestion-Timestamp': timestamp,
        'X-Ingestion-Request-Id': requestId,
        'X-Ingestion-Signature': options.signature ?? calculated.signature,
      },
      body,
    }),
    env(),
    context,
  )
}

beforeEach(() => {
  const migrated = createMigratedDatabase({ includeIngestionSeed: true })
  sqlite = migrated.sqlite
  database = migrated.d1
})
afterEach(() => sqlite.close())

describe('P1-CONTENT WSSS signed batch API', () => {
  it('같은 fixture를 세 실행에 보내도 Candidate는 최초 세 개만 만든다', async () => {
    const items = fixtureItems()
    const results = []
    for (let run = 1; run <= 3; run += 1) {
      const response = await signedRequest('/api/v1/ingestion/batches', {
        runId: `run-${run}`,
        trigger: 'manual',
        checkpointBefore: null,
        items,
      })
      expect(response.status).toBe(200)
      results.push((await response.json()) as { data: { accepted: number; duplicates: number } })
    }
    expect(results.map((result) => [result.data.accepted, result.data.duplicates])).toEqual([
      [3, 0],
      [0, 3],
      [0, 3],
    ])
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM candidates WHERE source_category = 'Animation/GSAP'",
        )
        .get(),
    ).toEqual({ count: 3 })
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM source_discoveries WHERE discovery_source_id = 'discovery-wsss'",
        )
        .get(),
    ).toEqual({ count: 3 })
  })

  it('정상 HMAC만 받고 만료 timestamp와 request ID 재사용을 거절한다', async () => {
    const body = {
      runId: 'auth-run',
      trigger: 'manual',
      checkpointBefore: null,
      items: fixtureItems().slice(0, 1),
    }
    expect(
      (await signedRequest('/api/v1/ingestion/batches', body, { signature: '0'.repeat(64) }))
        .status,
    ).toBe(401)
    expect(
      (
        await signedRequest('/api/v1/ingestion/batches', body, {
          timestamp: '2020-01-01T00:00:00.000Z',
        })
      ).status,
    ).toBe(401)
    const requestId = 'replay-request'
    expect((await signedRequest('/api/v1/ingestion/batches', body, { requestId })).status).toBe(200)
    const replay = await signedRequest('/api/v1/ingestion/batches', body, { requestId })
    expect(replay.status).toBe(409)
    expect(((await replay.json()) as { error: { code: string } }).error.code).toBe(
      'INGESTION_REPLAYED',
    )
  })

  it('완료 요청이 checkpoint와 실행 집계를 저장한다', async () => {
    const items = fixtureItems().slice(0, 1)
    await signedRequest('/api/v1/ingestion/batches', {
      runId: 'complete-run',
      trigger: 'manual',
      checkpointBefore: null,
      items,
    })
    const complete = await signedRequest('/api/v1/ingestion/runs/complete-run/complete', {
      checkpointAfter: { page: 1, lastPostId: '1603' },
    })
    expect(complete.status).toBe(200)
    expect(
      sqlite
        .prepare(
          "SELECT status, accepted_count, checkpoint_after FROM ingestion_runs WHERE id = 'complete-run'",
        )
        .get(),
    ).toEqual({
      status: 'success',
      accepted_count: 1,
      checkpoint_after: '{"page":1,"lastPostId":"1603"}',
    })
    const adminResponse = await worker.fetch(
      new Request('https://example.test/api/v1/admin/ingestion-runs', {
        headers: { 'Cf-Access-Authenticated-User-Email': 'owner@example.test' },
      }),
      env(),
      context,
    )
    const adminBody = (await adminResponse.json()) as {
      data: { items: Array<{ id: string; acceptedCount: number }> }
    }
    expect(adminBody.data.items).toContainEqual(
      expect.objectContaining({ id: 'complete-run', acceptedCount: 1 }),
    )
  })
  it('항목 일부가 실패하면 성공 후보를 유지하고 run을 partial로 완료한다', async () => {
    const items: unknown[] = [fixtureItems()[0]!, { externalId: 'wsss:999:0' }]
    const batch = await signedRequest('/api/v1/ingestion/batches', {
      runId: 'partial-run',
      trigger: 'manual',
      checkpointBefore: null,
      items,
    })
    const batchBody = (await batch.json()) as { data: { accepted: number; failed: number } }
    expect(batchBody.data).toMatchObject({ accepted: 1, failed: 1 })

    await signedRequest('/api/v1/ingestion/runs/partial-run/complete', {
      checkpointAfter: { page: 1, lastPostId: '1603' },
    })
    expect(
      sqlite
        .prepare(
          "SELECT status, accepted_count, failed_count FROM ingestion_runs WHERE id = 'partial-run'",
        )
        .get(),
    ).toEqual({ status: 'partial', accepted_count: 1, failed_count: 1 })
  })
})
