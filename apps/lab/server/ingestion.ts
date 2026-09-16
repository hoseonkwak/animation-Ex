import type { IngestionCandidate, SuggestedTag } from '../ingestion/types'

interface IngestionEnv {
  DB: D1Database
  INGESTION_KEY_ID?: string
  INGESTION_HMAC_SECRET?: string
}

interface BatchBody {
  runId: string
  trigger: 'manual' | 'schedule'
  checkpointBefore: string | null
  items: unknown[]
}

export class IngestionApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

function newId(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let time = Date.now()
  let value = ''
  for (let index = 0; index < 10; index += 1) {
    value = alphabet[time % 32] + value
    time = Math.floor(time / 32)
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  for (const byte of bytes) value += alphabet[byte % 32]
  return value
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

export async function ingestionSignature(
  method: string,
  pathname: string,
  timestamp: string,
  requestId: string,
  body: string,
  secret: string,
): Promise<{ signature: string; bodyHash: string }> {
  const bodyHash = await sha256(body)
  const canonical = `${method.toUpperCase()}\n${pathname}\n${timestamp}\n${requestId}\n${bodyHash}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return {
    signature: hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical))),
    bodyHash,
  }
}

export async function authenticateIngestion(
  request: Request,
  rawBody: string,
  env: IngestionEnv,
): Promise<string> {
  const keyId = request.headers.get('X-Ingestion-Key-Id') ?? ''
  const timestamp = request.headers.get('X-Ingestion-Timestamp') ?? ''
  const requestId = request.headers.get('X-Ingestion-Request-Id') ?? ''
  const supplied = request.headers.get('X-Ingestion-Signature') ?? ''
  if (!keyId || !timestamp || !requestId || !supplied) {
    throw new IngestionApiError(401, 'INGESTION_AUTH_REQUIRED', '수집 서명 헤더가 필요합니다.')
  }
  if (!env.INGESTION_KEY_ID || !env.INGESTION_HMAC_SECRET || keyId !== env.INGESTION_KEY_ID) {
    throw new IngestionApiError(401, 'INGESTION_AUTH_FAILED', '수집 인증 정보가 올바르지 않습니다.')
  }
  const timestampMs = Date.parse(timestamp)
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    throw new IngestionApiError(
      401,
      'INGESTION_TIMESTAMP_EXPIRED',
      '수집 요청 시간이 허용 범위를 벗어났습니다.',
    )
  }
  const prior = await env.DB.prepare(
    'SELECT request_id FROM ingestion_requests WHERE request_id = ?',
  )
    .bind(requestId)
    .first<{ request_id: string }>()
  if (prior) throw new IngestionApiError(409, 'INGESTION_REPLAYED', '이미 처리한 request ID입니다.')

  const expected = await ingestionSignature(
    request.method,
    new URL(request.url).pathname,
    timestamp,
    requestId,
    rawBody,
    env.INGESTION_HMAC_SECRET,
  )
  if (!timingSafeEqual(expected.signature, supplied.toLowerCase())) {
    throw new IngestionApiError(401, 'INGESTION_AUTH_FAILED', '수집 서명이 일치하지 않습니다.')
  }
  await env.DB.prepare(
    `INSERT INTO ingestion_requests (request_id, key_id, request_timestamp, body_sha256, created_at)
      VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(requestId, keyId, timestamp, expected.bodyHash, new Date().toISOString())
    .run()
  return requestId
}

function parseBatch(rawBody: string): BatchBody {
  if (new TextEncoder().encode(rawBody).byteLength > 256 * 1024) {
    throw new IngestionApiError(413, 'BATCH_TOO_LARGE', '수집 batch 본문이 너무 큽니다.')
  }
  let value: unknown
  try {
    value = JSON.parse(rawBody)
  } catch {
    throw new IngestionApiError(400, 'INVALID_JSON', 'JSON 요청 본문을 확인해주세요.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new IngestionApiError(400, 'INVALID_BATCH', '수집 batch 형식이 올바르지 않습니다.')
  }
  const body = value as Partial<BatchBody>
  if (
    typeof body.runId !== 'string' ||
    !['manual', 'schedule'].includes(body.trigger ?? '') ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > 50
  ) {
    throw new IngestionApiError(400, 'INVALID_BATCH', 'runId, trigger와 1~50개 items가 필요합니다.')
  }
  return body as BatchBody
}

function validCandidate(item: unknown): item is IngestionCandidate {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false
  const value = item as Partial<IngestionCandidate>
  return Boolean(
    typeof value.externalId === 'string' &&
    /^wsss:\d+:\d+$/.test(value.externalId) &&
    value.discoveredVia?.key === 'wsss' &&
    typeof value.discoveredVia.url === 'string' &&
    typeof value.discoveredVia.category === 'string' &&
    value.source?.type === 'codepen' &&
    typeof value.source.canonicalUrl === 'string' &&
    /^https:\/\/codepen\.io\/[^/]+\/pen\/[A-Za-z0-9]+$/.test(value.source.canonicalUrl) &&
    typeof value.source.creatorSlug === 'string' &&
    typeof value.source.title === 'string' &&
    Array.isArray(value.tags),
  )
}

async function knownTags(
  db: D1Database,
  tags: SuggestedTag[],
): Promise<Array<SuggestedTag & { id: string }>> {
  const found: Array<SuggestedTag & { id: string }> = []
  for (const tag of tags) {
    const row = await db
      .prepare('SELECT id FROM tags WHERE axis = ? AND key = ? AND active = 1')
      .bind(tag.axis, tag.key)
      .first<{ id: string }>()
    if (row) found.push({ ...tag, id: row.id })
  }
  return found
}

async function processItem(
  db: D1Database,
  runId: string,
  requestId: string,
  item: IngestionCandidate,
): Promise<{ externalId: string; result: 'accepted' | 'duplicate'; candidateId?: string }> {
  const now = new Date().toISOString()
  const previousDiscovery = await db
    .prepare(
      `SELECT c.id AS candidate_id
      FROM source_discoveries d
      LEFT JOIN candidates c ON c.source_id = d.source_id
      WHERE d.discovery_source_id = 'discovery-wsss' AND d.external_id = ?`,
    )
    .bind(item.externalId)
    .first<{ candidate_id: string | null }>()
  if (previousDiscovery) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO ingestion_items (
          id, ingestion_run_id, external_id, request_id, source_url, result, candidate_id, created_at
        ) VALUES (?, ?, ?, ?, ?, 'duplicate', ?, ?)`,
      )
      .bind(
        newId(),
        runId,
        item.externalId,
        `${requestId}:${item.externalId}`,
        item.discoveredVia.url,
        previousDiscovery.candidate_id,
        now,
      )
      .run()
    return {
      externalId: item.externalId,
      result: 'duplicate',
      ...(previousDiscovery.candidate_id ? { candidateId: previousDiscovery.candidate_id } : {}),
    }
  }

  const existing = await db
    .prepare('SELECT id FROM sources WHERE canonical_url = ?')
    .bind(item.source.canonicalUrl)
    .first<{ id: string }>()
  if (existing) {
    const candidate = await db
      .prepare('SELECT id FROM candidates WHERE source_id = ?')
      .bind(existing.id)
      .first<{ id: string }>()
    await db.batch([
      db
        .prepare(
          `INSERT OR IGNORE INTO source_discoveries (
          source_id, discovery_source_id, discovered_url, external_id, first_seen_at, last_seen_at
        ) VALUES (?, 'discovery-wsss', ?, ?, ?, ?)`,
        )
        .bind(existing.id, item.discoveredVia.url, item.externalId, now, now),
      db
        .prepare(
          `INSERT INTO ingestion_items (
          id, ingestion_run_id, external_id, request_id, source_url, result, candidate_id, created_at
        ) VALUES (?, ?, ?, ?, ?, 'duplicate', ?, ?)`,
        )
        .bind(
          newId(),
          runId,
          item.externalId,
          `${requestId}:${item.externalId}`,
          item.discoveredVia.url,
          candidate?.id ?? null,
          now,
        ),
    ])
    return {
      externalId: item.externalId,
      result: 'duplicate',
      ...(candidate ? { candidateId: candidate.id } : {}),
    }
  }

  const sourceId = newId()
  const candidateId = newId()
  const tags = await knownTags(db, item.tags)
  const metadata = JSON.stringify({
    publicTitle: item.suggestedTitleKo,
    summary: '',
    slug: '',
    featured: false,
    interactionNote: '',
  })
  const statements = [
    db
      .prepare(
        `INSERT INTO sources (
        id, type, url, canonical_url, creator_name, license_code, license_evidence_url,
        availability, first_seen_at, created_at, updated_at
      ) VALUES (?, 'codepen', ?, ?, ?, 'MIT', 'https://blog.codepen.io/legal/terms-of-service/',
        'unknown', ?, ?, ?)`,
      )
      .bind(
        sourceId,
        item.source.url,
        item.source.canonicalUrl,
        item.source.creatorName || item.source.creatorSlug,
        now,
        now,
        now,
      ),
    db
      .prepare(
        `INSERT INTO source_discoveries (
        source_id, discovery_source_id, discovered_url, external_id, first_seen_at, last_seen_at
      ) VALUES (?, 'discovery-wsss', ?, ?, ?, ?)`,
      )
      .bind(sourceId, item.discoveredVia.url, item.externalId, now, now),
    db
      .prepare(
        `INSERT INTO candidates (
        id, source_id, status, source_title, source_category, metadata_json,
        deduplication_key, confidence, priority_score, created_at, updated_at
      ) VALUES (?, ?, 'review', ?, ?, ?, ?, ?, 50, ?, ?)`,
      )
      .bind(
        candidateId,
        sourceId,
        item.source.title,
        item.discoveredVia.category,
        metadata,
        `codepen:${item.source.creatorSlug}/${item.source.canonicalUrl.split('/').at(-1)}`,
        item.tags.length ? 0.8 : 0.5,
        now,
        now,
      ),
    ...tags.map((tag) =>
      db
        .prepare(
          `INSERT INTO candidate_tags (candidate_id, tag_id, source, confidence, confirmed)
        VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(candidateId, tag.id, tag.source, tag.confidence, tag.confirmed ? 1 : 0),
    ),
    db
      .prepare(
        `INSERT INTO ingestion_items (
        id, ingestion_run_id, external_id, request_id, source_url, result, candidate_id, created_at
      ) VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?)`,
      )
      .bind(
        newId(),
        runId,
        item.externalId,
        `${requestId}:${item.externalId}`,
        item.discoveredVia.url,
        candidateId,
        now,
      ),
  ]
  await db.batch(statements)
  return { externalId: item.externalId, result: 'accepted', candidateId }
}

function failedItemIdentity(
  item: unknown,
  index: number,
): { externalId: string; sourceUrl: string } {
  if (item && typeof item === 'object') {
    const value = item as { externalId?: unknown; discoveredVia?: { url?: unknown } }
    return {
      externalId: typeof value.externalId === 'string' ? value.externalId : `invalid:${index}`,
      sourceUrl: typeof value.discoveredVia?.url === 'string' ? value.discoveredVia.url : 'invalid',
    }
  }
  return { externalId: `invalid:${index}`, sourceUrl: 'invalid' }
}

async function recordFailedItem(
  db: D1Database,
  runId: string,
  requestId: string,
  identity: { externalId: string; sourceUrl: string },
  failureCode: string,
  index: number,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ingestion_items (
        id, ingestion_run_id, external_id, request_id, source_url, result, failure_code, created_at
      ) VALUES (?, ?, ?, ?, ?, 'failed', ?, ?)`,
    )
    .bind(
      newId(),
      runId,
      identity.externalId,
      `${requestId}:failed:${index}`,
      identity.sourceUrl,
      failureCode,
      new Date().toISOString(),
    )
    .run()
}
export async function handleIngestionBatch(
  rawBody: string,
  requestId: string,
  env: IngestionEnv,
): Promise<{ accepted: number; duplicates: number; failed: number; items: unknown[] }> {
  const body = parseBatch(rawBody)
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT OR IGNORE INTO ingestion_runs (
        id, discovery_source_id, status, trigger, checkpoint_before, started_at
      ) VALUES (?, 'discovery-wsss', 'running', ?, ?, ?)`,
  )
    .bind(body.runId, body.trigger, body.checkpointBefore, now)
    .run()

  const items: Array<Record<string, unknown>> = []
  let accepted = 0
  let duplicates = 0
  let failed = 0
  for (const [index, item] of body.items.entries()) {
    if (!validCandidate(item)) {
      failed += 1
      const identity = failedItemIdentity(item, index)
      await recordFailedItem(env.DB, body.runId, requestId, identity, 'INVALID_ITEM', index)
      items.push({ externalId: identity.externalId, result: 'failed', failureCode: 'INVALID_ITEM' })
      continue
    }
    try {
      const result = await processItem(env.DB, body.runId, requestId, item)
      items.push(result)
      if (result.result === 'accepted') accepted += 1
      else duplicates += 1
    } catch {
      failed += 1
      const identity = { externalId: item.externalId, sourceUrl: item.discoveredVia.url }
      await recordFailedItem(env.DB, body.runId, requestId, identity, 'ITEM_WRITE_FAILED', index)
      items.push({
        externalId: item.externalId,
        result: 'failed',
        failureCode: 'ITEM_WRITE_FAILED',
      })
    }
  }
  return { accepted, duplicates, failed, items }
}

export async function completeIngestionRun(
  rawBody: string,
  runId: string,
  env: IngestionEnv,
): Promise<void> {
  let body: { checkpointAfter?: unknown }
  try {
    body = JSON.parse(rawBody) as { checkpointAfter?: unknown }
  } catch {
    throw new IngestionApiError(400, 'INVALID_JSON', 'JSON 요청 본문을 확인해주세요.')
  }
  const run = await env.DB.prepare('SELECT id FROM ingestion_runs WHERE id = ?')
    .bind(runId)
    .first<{ id: string }>()
  if (!run)
    throw new IngestionApiError(404, 'INGESTION_RUN_NOT_FOUND', '수집 실행을 찾을 수 없습니다.')
  const counts = await env.DB.prepare(
    `SELECT
        SUM(CASE WHEN result = 'accepted' THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN result = 'duplicate' THEN 1 ELSE 0 END) AS duplicates,
        SUM(CASE WHEN result = 'failed' THEN 1 ELSE 0 END) AS failed,
        COUNT(*) AS discovered
      FROM ingestion_items WHERE ingestion_run_id = ?`,
  )
    .bind(runId)
    .first<{
      accepted: number | null
      duplicates: number | null
      failed: number | null
      discovered: number
    }>()
  if (!counts)
    throw new IngestionApiError(404, 'INGESTION_RUN_NOT_FOUND', '수집 실행을 찾을 수 없습니다.')
  const accepted = counts.accepted ?? 0
  const duplicates = counts.duplicates ?? 0
  const failed = counts.failed ?? 0
  const status = failed > 0 ? (accepted + duplicates > 0 ? 'partial' : 'failed') : 'success'
  await env.DB.prepare(
    `UPDATE ingestion_runs SET status = ?, checkpoint_after = ?, discovered_count = ?,
        accepted_count = ?, duplicate_count = ?, failed_count = ?, finished_at = ? WHERE id = ?`,
  )
    .bind(
      status,
      JSON.stringify(body.checkpointAfter ?? null),
      counts.discovered,
      accepted,
      duplicates,
      failed,
      new Date().toISOString(),
      runId,
    )
    .run()
}
