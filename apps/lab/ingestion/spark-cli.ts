import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sendSignedJson, submitCandidateBatches } from './client.ts'
import { CollectionStoppedError, robotsAllows } from './policy.ts'
import {
  advanceSparkCheckpoint,
  buildSparkCandidates,
  parseSparkFeed,
  type SparkCheckpoint,
} from './spark.ts'

const args = process.argv.slice(2)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const feedUrl = 'https://codepen.io/spark/feed/'
const credentials = {
  keyId: process.env.INGESTION_KEY_ID ?? '',
  secret: process.env.INGESTION_HMAC_SECRET ?? '',
}
const apiBase = process.env.INGESTION_API_URL ?? ''

async function fixture(): Promise<void> {
  const xml = await readFile(path.join(root, 'fixtures/spark/feed.xml'), 'utf8')
  const issues = parseSparkFeed(xml)
  if (issues.length < 2 || buildSparkCandidates(issues).items.length < 2) {
    throw new Error('SPARK_FIXTURE_INVALID')
  }
}

async function fetchSpark(url: string): Promise<string> {
  if (url !== feedUrl && url !== 'https://codepen.io/robots.txt') {
    throw new CollectionStoppedError('SOURCE_URL_FORBIDDEN', 'Spark 피드와 robots만 요청합니다.')
  }
  const response = await fetch(url, {
    headers: { 'user-agent': 'KwakMotionLab/0.1 (+https://github.com/hoseonkwak/animation-Ex)' },
    signal: AbortSignal.timeout(15_000),
  })
  if (response.status === 403 || response.status === 429) {
    throw new CollectionStoppedError('SOURCE_RATE_LIMITED', `CodePen HTTP ${response.status}`)
  }
  if (!response.ok) {
    throw new CollectionStoppedError('SOURCE_UNAVAILABLE', `CodePen HTTP ${response.status}`)
  }
  return response.text()
}

async function run(): Promise<void> {
  await fixture()
  if (!args.includes('--live') && !args.includes('--preflight-live')) {
    process.stdout.write('Spark fixture passed\n')
    return
  }
  const robots = await fetchSpark('https://codepen.io/robots.txt')
  if (!robotsAllows(robots, '/spark/feed/')) {
    throw new CollectionStoppedError('ROBOTS_DISALLOWED', 'Spark 피드 수집이 허용되지 않습니다.')
  }
  const xml = await fetchSpark(feedUrl)
  const limitIndex = args.indexOf('--max-issues')
  const requestedLimit = Number(limitIndex >= 0 ? args[limitIndex + 1] : 10)
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    throw new Error('SPARK_ISSUE_LIMIT_INVALID')
  }
  const issueLimit = Math.min(requestedLimit, 10)
  const issues = parseSparkFeed(xml).slice(0, issueLimit)
  let checkpoint: SparkCheckpoint | undefined
  if (args.includes('--remote-checkpoint')) {
    if (!apiBase || !credentials.keyId || !credentials.secret) {
      throw new Error('Spark 원격 checkpoint 인증값이 필요합니다.')
    }
    const response = await sendSignedJson<{ data: { checkpoint: SparkCheckpoint | null } }>(
      apiBase,
      '/api/v1/ingestion/checkpoint',
      { sourceKey: 'spark', category: 'CodePen/Spark' },
      credentials,
    )
    checkpoint = response.data.checkpoint ?? undefined
    if (checkpoint && checkpoint.category !== 'CodePen/Spark') {
      throw new Error('SPARK_CHECKPOINT_MISMATCH')
    }
  }
  const result = buildSparkCandidates(issues, checkpoint)
  if (args.includes('--preflight-live')) {
    process.stdout.write(
      `${JSON.stringify({ issues: issues.length, newIssues: result.issueIds.length, motionPens: result.discoveredPens, candidates: result.items.length, sample: result.items.slice(0, 5) }, null, 2)}\n`,
    )
    return
  }
  if (!apiBase || !credentials.keyId || !credentials.secret) {
    throw new Error('INGESTION_API_URL, INGESTION_KEY_ID, INGESTION_HMAC_SECRET가 필요합니다.')
  }
  const runId = `spark-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  const trigger = args.includes('--scheduled') ? 'schedule' : 'manual'
  const batch = result.items.length
    ? await submitCandidateBatches(
        apiBase,
        runId,
        result.items,
        checkpoint ? JSON.stringify(checkpoint) : null,
        credentials,
        trigger,
        'spark',
      )
    : (
        await sendSignedJson<{
          data: Awaited<ReturnType<typeof submitCandidateBatches>>
        }>(
          apiBase,
          '/api/v1/ingestion/batches',
          {
            runId,
            sourceKey: 'spark',
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
  const nextCheckpoint = advanceSparkCheckpoint(issues, checkpoint, savedIds)
  if (result.issueIds.length === 0) nextCheckpoint.zeroReason = 'NO_NEW_ISSUES'
  else if (result.discoveredPens === 0) nextCheckpoint.zeroReason = 'NO_MOTION_PENS'
  else if (result.items.length === 0) nextCheckpoint.zeroReason = 'ALL_DUPLICATES'
  await sendSignedJson(
    apiBase,
    `/api/v1/ingestion/runs/${runId}/complete`,
    { checkpointAfter: nextCheckpoint },
    credentials,
  )
  process.stdout.write(
    `${JSON.stringify({ runId, issues: issues.length, newIssues: result.issueIds.length, motionPens: result.discoveredPens, ...batch, checkpoint: nextCheckpoint }, null, 2)}\n`,
  )
}

await run()
