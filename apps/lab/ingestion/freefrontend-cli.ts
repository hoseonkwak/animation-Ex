import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sendSignedJson, submitCandidateBatches } from './client.ts'
import {
  FREEFRONTEND_PAGES,
  advanceFreeFrontendCheckpoint,
  parseFreeFrontendPage,
  type FreeFrontendCheckpoint,
} from './freefrontend.ts'
import { CollectionStoppedError, robotsAllows } from './policy.ts'

const args = process.argv.slice(2)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = 'https://freefrontend.com'
const credentials = {
  keyId: process.env.INGESTION_KEY_ID ?? '',
  secret: process.env.INGESTION_HMAC_SECRET ?? '',
}
const apiBase = process.env.INGESTION_API_URL ?? ''

async function fixture(): Promise<void> {
  const html = await readFile(path.join(root, 'fixtures/freefrontend-hero.html'), 'utf8')
  const page = FREEFRONTEND_PAGES.find((item) => item.slug === 'css-hero-sections')!
  if (parseFreeFrontendPage(html, page).length !== 2) {
    throw new Error('FREEFRONTEND_FIXTURE_INVALID')
  }
}

async function fetchSource(url: string): Promise<string> {
  if (
    url !== `${source}/robots.txt` &&
    !FREEFRONTEND_PAGES.some((page) => url === `${source}/${page.slug}/`)
  ) {
    throw new CollectionStoppedError(
      'SOURCE_URL_FORBIDDEN',
      '허용된 FreeFrontend 목록과 robots만 요청합니다.',
    )
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
        `FreeFrontend HTTP ${response.status}`,
      )
    }
    if (response.status >= 500 && delay !== null) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }
    if (!response.ok) {
      throw new CollectionStoppedError('SOURCE_UNAVAILABLE', `FreeFrontend HTTP ${response.status}`)
    }
    return response.text()
  }
  throw new CollectionStoppedError('SOURCE_UNAVAILABLE', 'FreeFrontend 요청 실패')
}

async function run(): Promise<void> {
  await fixture()
  if (!args.includes('--live') && !args.includes('--preflight-live')) {
    process.stdout.write('FreeFrontend fixture passed\n')
    return
  }
  const slug = args[args.indexOf('--page') + 1]
  const page = FREEFRONTEND_PAGES.find((item) => item.slug === slug)
  if (!page) throw new Error('FREEFRONTEND_PAGE_INVALID')
  const robots = await fetchSource(`${source}/robots.txt`)
  if (!robotsAllows(robots, `/${page.slug}/`)) {
    throw new CollectionStoppedError('ROBOTS_DISALLOWED', `FreeFrontend ${page.slug} 수집 비허용`)
  }
  const html = await fetchSource(`${source}/${page.slug}/`)
  let checkpoint: FreeFrontendCheckpoint | undefined
  if (args.includes('--remote-checkpoint')) {
    if (!apiBase || !credentials.keyId || !credentials.secret) {
      throw new Error('FreeFrontend 원격 checkpoint 인증값이 필요합니다.')
    }
    const response = await sendSignedJson<{ data: { checkpoint: FreeFrontendCheckpoint | null } }>(
      apiBase,
      '/api/v1/ingestion/checkpoint',
      { sourceKey: 'freefrontend', category: page.category },
      credentials,
    )
    checkpoint = response.data.checkpoint ?? undefined
    if (checkpoint && checkpoint.category !== page.category)
      throw new Error('FREEFRONTEND_CHECKPOINT_MISMATCH')
  }
  const items = parseFreeFrontendPage(html, page, checkpoint)
  if (args.includes('--preflight-live')) {
    process.stdout.write(
      `${JSON.stringify({ category: page.category, candidates: items.length, sample: items.slice(0, 3) }, null, 2)}\n`,
    )
    return
  }
  if (!apiBase || !credentials.keyId || !credentials.secret) {
    throw new Error('INGESTION_API_URL, INGESTION_KEY_ID, INGESTION_HMAC_SECRET가 필요합니다.')
  }
  const runId = `freefrontend-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  const trigger = args.includes('--scheduled') ? 'schedule' : 'manual'
  const batch = items.length
    ? await submitCandidateBatches(
        apiBase,
        runId,
        items,
        checkpoint ? JSON.stringify(checkpoint) : null,
        credentials,
        trigger,
        'freefrontend',
      )
    : (
        await sendSignedJson<{ data: Awaited<ReturnType<typeof submitCandidateBatches>> }>(
          apiBase,
          '/api/v1/ingestion/batches',
          {
            runId,
            sourceKey: 'freefrontend',
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
  const next = advanceFreeFrontendCheckpoint(page, checkpoint, savedIds)
  await sendSignedJson(
    apiBase,
    `/api/v1/ingestion/runs/${runId}/complete`,
    { checkpointAfter: next },
    credentials,
  )
  process.stdout.write(
    `${JSON.stringify({ runId, category: page.category, candidates: items.length, ...batch, checkpoint: next }, null, 2)}\n`,
  )
}

await run()
