import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sendSignedJson, submitCandidateBatches } from './client.ts'
import {
  ANIMATED_WEB_CATEGORY,
  ANIMATED_WEB_URL,
  advanceAnimatedWebCheckpoint,
  parseAnimatedWebPage,
  type AnimatedWebCheckpoint,
} from './animatedweb.ts'
import { CollectionStoppedError, robotsAllows } from './policy.ts'

const args = process.argv.slice(2)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiBase = process.env.INGESTION_API_URL ?? ''
const credentials = {
  keyId: process.env.INGESTION_KEY_ID ?? '',
  secret: process.env.INGESTION_HMAC_SECRET ?? '',
}

async function fetchSource(url: string): Promise<string> {
  if (url !== ANIMATED_WEB_URL && url !== 'https://theanimatedweb.com/robots.txt') {
    throw new CollectionStoppedError('SOURCE_URL_FORBIDDEN', '허용된 목록과 robots만 요청합니다.')
  }
  for (const delay of [5_000, 20_000, null]) {
    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          'user-agent': 'KwakMotionLab/0.1 (+https://github.com/hoseonkwak/animation-Ex)',
        },
        signal: AbortSignal.timeout(15_000),
      })
    } catch (error) {
      if (delay === null) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }
    if (response.status === 403 || response.status === 429) {
      throw new CollectionStoppedError(
        'SOURCE_RATE_LIMITED',
        `The Animated Web HTTP ${response.status}`,
      )
    }
    if (response.status >= 500 && delay !== null) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }
    if (!response.ok) {
      throw new CollectionStoppedError(
        'SOURCE_UNAVAILABLE',
        `The Animated Web HTTP ${response.status}`,
      )
    }
    return response.text()
  }
  throw new CollectionStoppedError('SOURCE_UNAVAILABLE', 'The Animated Web 요청 실패')
}

async function run(): Promise<void> {
  const fixture = await readFile(path.join(root, 'fixtures/animatedweb.html'), 'utf8')
  if (parseAnimatedWebPage(fixture).length !== 2) throw new Error('ANIMATED_WEB_FIXTURE_INVALID')
  if (!args.includes('--live') && !args.includes('--preflight-live')) {
    process.stdout.write('The Animated Web fixture passed\n')
    return
  }
  const robots = await fetchSource('https://theanimatedweb.com/robots.txt')
  if (!robotsAllows(robots, '/collection/codepen/')) {
    throw new CollectionStoppedError('ROBOTS_DISALLOWED', 'The Animated Web 목록 수집 비허용')
  }
  const html = await fetchSource(ANIMATED_WEB_URL)
  let checkpoint: AnimatedWebCheckpoint | undefined
  if (args.includes('--remote-checkpoint')) {
    if (!apiBase || !credentials.keyId || !credentials.secret) {
      throw new Error('INGESTION_API_URL, INGESTION_KEY_ID, INGESTION_HMAC_SECRET가 필요합니다.')
    }
    const response = await sendSignedJson<{ data: { checkpoint: AnimatedWebCheckpoint | null } }>(
      apiBase,
      '/api/v1/ingestion/checkpoint',
      { sourceKey: 'animatedweb', category: ANIMATED_WEB_CATEGORY },
      credentials,
    )
    checkpoint = response.data.checkpoint ?? undefined
    if (checkpoint && checkpoint.category !== ANIMATED_WEB_CATEGORY) {
      throw new Error('ANIMATED_WEB_CHECKPOINT_MISMATCH')
    }
  }
  const items = parseAnimatedWebPage(html, checkpoint)
  if (args.includes('--preflight-live')) {
    process.stdout.write(
      JSON.stringify({ candidates: items.length, sample: items.slice(0, 3) }) + '\n',
    )
    return
  }
  if (!apiBase || !credentials.keyId || !credentials.secret) {
    throw new Error('INGESTION_API_URL, INGESTION_KEY_ID, INGESTION_HMAC_SECRET가 필요합니다.')
  }
  const runId = `animatedweb-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  const trigger = args.includes('--scheduled') ? 'schedule' : 'manual'
  const batch = items.length
    ? await submitCandidateBatches(
        apiBase,
        runId,
        items,
        checkpoint ? JSON.stringify(checkpoint) : null,
        credentials,
        trigger,
        'animatedweb',
      )
    : (
        await sendSignedJson<{ data: Awaited<ReturnType<typeof submitCandidateBatches>> }>(
          apiBase,
          '/api/v1/ingestion/batches',
          {
            runId,
            sourceKey: 'animatedweb',
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
  const next = advanceAnimatedWebCheckpoint(checkpoint, savedIds)
  await sendSignedJson(
    apiBase,
    `/api/v1/ingestion/runs/${runId}/complete`,
    { checkpointAfter: next },
    credentials,
  )
  process.stdout.write(
    JSON.stringify({
      runId,
      candidates: items.length,
      ...batch,
      checkpointCount: next.processedExternalIds.length,
    }) + '\n',
  )
}

try {
  await run()
} catch (error) {
  const code = error instanceof CollectionStoppedError ? error.code : 'ANIMATED_WEB_RUN_FAILED'
  const message = error instanceof Error ? error.message : String(error)
  if (process.env.GITHUB_ACTIONS === 'true') {
    const annotation = `${code}: ${message}`
      .replaceAll('%', '%25')
      .replaceAll('\r', '%0D')
      .replaceAll('\n', '%0A')
    process.stderr.write(`::error title=The Animated Web ingestion::${annotation}\n`)
  } else {
    process.stderr.write(`${code}: ${message}\n`)
  }
  process.exitCode = 1
}
