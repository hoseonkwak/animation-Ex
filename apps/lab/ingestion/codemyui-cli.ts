import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sendSignedJson, submitCandidateBatches } from './client.ts'
import {
  CODEMYUI_API_BASE,
  CODEMYUI_CATEGORY,
  advanceCodeMyUiCheckpoint,
  parseCodeMyUiPosts,
  type CodeMyUiCheckpoint,
} from './codemyui.ts'
import { CollectionStoppedError, robotsAllows } from './policy.ts'
import type { IngestionCandidate } from './types.ts'

const args = process.argv.slice(2)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiBase = process.env.INGESTION_API_URL ?? ''
const credentials = {
  keyId: process.env.INGESTION_KEY_ID ?? '',
  secret: process.env.INGESTION_HMAC_SECRET ?? '',
}

async function fetchSource(url: string): Promise<Response> {
  const allowed =
    url === 'https://codemyui.com/robots.txt' ||
    /^https:\/\/codemyui\.com\/wp-json\/wp\/v2\/posts\?per_page=100&page=\d{1,2}&_fields=id,link,title,content,tags$/.test(
      url,
    )
  if (!allowed)
    throw new CollectionStoppedError(
      'SOURCE_URL_FORBIDDEN',
      '허용된 공개 API와 robots만 요청합니다.',
    )
  for (const delay of [5_000, 20_000, null]) {
    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          'user-agent': 'KwakMotionLab/0.1 (+https://github.com/hoseonkwak/animation-Ex)',
        },
        signal: AbortSignal.timeout(20_000),
      })
    } catch (error) {
      if (delay === null) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }
    if (response.status === 403 || response.status === 429) {
      throw new CollectionStoppedError('SOURCE_RATE_LIMITED', `CodeMyUI HTTP ${response.status}`)
    }
    if (response.status >= 500 && delay !== null) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }
    if (!response.ok)
      throw new CollectionStoppedError('SOURCE_UNAVAILABLE', `CodeMyUI HTTP ${response.status}`)
    return response
  }
  throw new CollectionStoppedError('SOURCE_UNAVAILABLE', 'CodeMyUI 요청 실패')
}

async function run(): Promise<void> {
  const fixture = JSON.parse(await readFile(path.join(root, 'fixtures/codemyui.json'), 'utf8'))
  if (parseCodeMyUiPosts(fixture).items.length !== 2) throw new Error('CODEMYUI_FIXTURE_INVALID')
  if (!args.includes('--live') && !args.includes('--preflight-live')) {
    process.stdout.write('CodeMyUI fixture passed\n')
    return
  }
  const robots = await (await fetchSource('https://codemyui.com/robots.txt')).text()
  if (!robotsAllows(robots, '/wp-json/wp/v2/posts')) {
    throw new CollectionStoppedError('ROBOTS_DISALLOWED', 'CodeMyUI 공개 API 수집 비허용')
  }
  let checkpoint: CodeMyUiCheckpoint | undefined
  if (args.includes('--remote-checkpoint')) {
    if (!apiBase || !credentials.keyId || !credentials.secret) {
      throw new Error('INGESTION_API_URL, INGESTION_KEY_ID, INGESTION_HMAC_SECRET가 필요합니다.')
    }
    const response = await sendSignedJson<{ data: { checkpoint: CodeMyUiCheckpoint | null } }>(
      apiBase,
      '/api/v1/ingestion/checkpoint',
      { sourceKey: 'codemyui', category: CODEMYUI_CATEGORY },
      credentials,
    )
    checkpoint = response.data.checkpoint ?? undefined
    if (checkpoint && checkpoint.category !== CODEMYUI_CATEGORY) {
      throw new Error('CODEMYUI_CHECKPOINT_MISMATCH')
    }
  }
  const items: IngestionCandidate[] = []
  let totalPages = 1
  let examined = 0
  let withoutPen = 0
  let knownInvalid = 0
  const invalidPostIds: number[] = []
  const refreshTags = args.includes('--refresh-tags')
  for (let page = 1; page <= totalPages; page += 1) {
    if (page > 15)
      throw new CollectionStoppedError('SOURCE_PAGE_LIMIT', 'CodeMyUI 페이지가 15개를 초과합니다.')
    const url = `${CODEMYUI_API_BASE}?per_page=100&page=${page}&_fields=id,link,title,content,tags`
    const response = await fetchSource(url)
    if (page === 1) {
      const declared = Number(response.headers.get('X-WP-TotalPages'))
      if (!Number.isSafeInteger(declared) || declared < 1 || declared > 15) {
        throw new CollectionStoppedError(
          'SOURCE_PAGE_LIMIT',
          'CodeMyUI 페이지 수를 확인할 수 없습니다.',
        )
      }
      totalPages = declared
    }
    const result = parseCodeMyUiPosts(await response.json(), checkpoint, refreshTags)
    items.push(
      ...(refreshTags
        ? result.items.filter((item) =>
            item.tags.some((tag) => tag.axis === 'section' && tag.source === 'imported'),
          )
        : result.items),
    )
    examined += result.examined
    withoutPen += result.withoutPen
    knownInvalid += result.knownInvalid
    invalidPostIds.push(...result.invalidPostIds)
    if (page < totalPages) await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  const unique = [...new Map(items.map((item) => [item.source.canonicalUrl, item])).values()]
  if (args.includes('--preflight-live')) {
    process.stdout.write(
      JSON.stringify({
        pages: totalPages,
        examined,
        withoutPen,
        knownInvalid,
        refreshTags,
        invalid: invalidPostIds.length,
        invalidPostIds,
        candidates: unique.length,
        sample: unique.slice(0, 3),
      }) + '\n',
    )
    return
  }
  if (!apiBase || !credentials.keyId || !credentials.secret) {
    throw new Error('INGESTION_API_URL, INGESTION_KEY_ID, INGESTION_HMAC_SECRET가 필요합니다.')
  }
  const runId = `codemyui-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  const trigger = args.includes('--scheduled') ? 'schedule' : 'manual'
  const batch = unique.length
    ? await submitCandidateBatches(
        apiBase,
        runId,
        unique,
        checkpoint ? JSON.stringify(checkpoint) : null,
        credentials,
        trigger,
        'codemyui',
      )
    : (
        await sendSignedJson<{ data: Awaited<ReturnType<typeof submitCandidateBatches>> }>(
          apiBase,
          '/api/v1/ingestion/batches',
          {
            runId,
            sourceKey: 'codemyui',
            trigger,
            checkpointBefore: checkpoint ? JSON.stringify(checkpoint) : null,
            items: [],
          },
          credentials,
        )
      ).data
  const savedIds = batch.items
    .filter((item) => item.result !== 'failed')
    .map((item) => item.externalId)
  const next = advanceCodeMyUiCheckpoint(checkpoint, savedIds, invalidPostIds)
  await sendSignedJson(
    apiBase,
    `/api/v1/ingestion/runs/${runId}/complete`,
    { checkpointAfter: next, sourceInvalidPostIds: invalidPostIds },
    credentials,
  )
  process.stdout.write(
    JSON.stringify({
      runId,
      pages: totalPages,
      examined,
      withoutPen,
      knownInvalid,
      refreshTags,
      invalid: invalidPostIds.length,
      invalidPostIds,
      candidates: unique.length,
      ...batch,
      checkpointCount: next.processedExternalIds.length,
    }) + '\n',
  )
}

try {
  await run()
} catch (error) {
  const code = error instanceof CollectionStoppedError ? error.code : 'CODEMYUI_RUN_FAILED'
  const message = error instanceof Error ? error.message : String(error)
  if (process.env.GITHUB_ACTIONS === 'true') {
    const annotation = `${code}: ${message}`
      .replaceAll('%', '%25')
      .replaceAll('\r', '%0D')
      .replaceAll('\n', '%0A')
    process.stderr.write(`::error title=CodeMyUI ingestion::${annotation}\n`)
  } else {
    process.stderr.write(`${code}: ${message}\n`)
  }
  process.exitCode = 1
}
