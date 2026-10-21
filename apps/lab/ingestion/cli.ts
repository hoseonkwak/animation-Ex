import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sendSignedJson, submitCandidateBatches } from './client.ts'
import { parsePaginationPages, parseWsssList } from './parser.ts'
import {
  advanceCheckpoint,
  buildCandidates,
  completeProcessedPosts,
  selectPostsForRun,
  type IngestionCheckpoint,
} from './pipeline.ts'
import { fetchWsss, robotsAllows } from './policy.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const mode = args.includes('--live')
  ? 'live'
  : args.includes('--preflight-live')
    ? 'preflight-live'
    : 'fixture'

function value(name: string, fallback?: string): string | undefined {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

async function fixtureRun() {
  const categoryUrl = 'https://wsss.tistory.com/category/Animation/GSAP'
  const listHtml = await readFile(path.join(root, 'fixtures/wsss/category-gsap.html'), 'utf8')
  const posts = parseWsssList(listHtml, categoryUrl)
  const documents = new Map<string, string>([
    [
      'https://wsss.tistory.com/1603',
      await readFile(path.join(root, 'fixtures/wsss/article-1603.html'), 'utf8'),
    ],
    [
      'https://wsss.tistory.com/1604',
      await readFile(path.join(root, 'fixtures/wsss/article-1604-multi.html'), 'utf8'),
    ],
  ])
  return buildCandidates(posts, documents)
}

async function liveRun(submit: boolean): Promise<void> {
  await fixtureRun()
  const categoryUrl = value('--category', 'https://wsss.tistory.com/category/Animation/GSAP')!
  const category = decodeURIComponent(new URL(categoryUrl).pathname.replace(/^\/category\//, ''))
  const apiBase = process.env.INGESTION_API_URL
  const keyId = process.env.INGESTION_KEY_ID
  const secret = process.env.INGESTION_HMAC_SECRET
  const maxArticles = Math.min(Number(value('--max-articles', '200')), 200)
  const maxPages = Math.max(1, Number(value('--max-pages', '1')))
  const backfill = args.includes('--backfill')
  const checkpointPath = value('--checkpoint')
  let checkpoint: IngestionCheckpoint | undefined
  if (checkpointPath) {
    try {
      checkpoint = JSON.parse(await readFile(checkpointPath, 'utf8')) as IngestionCheckpoint
    } catch {
      checkpoint = undefined
    }
  }
  if (args.includes('--remote-checkpoint')) {
    if (!apiBase || !keyId || !secret) {
      throw new Error('원격 checkpoint 조회에는 ingestion API 인증값이 필요합니다.')
    }
    const response = await sendSignedJson<{
      data: { checkpoint: IngestionCheckpoint | null }
    }>(apiBase, '/api/v1/ingestion/checkpoint', { category }, { keyId, secret })
    checkpoint = response.data.checkpoint ?? undefined
    if (checkpoint && checkpoint.category !== category) {
      throw new Error('CHECKPOINT_CATEGORY_MISMATCH')
    }
  }

  const robots = await fetchWsss('https://wsss.tistory.com/robots.txt')
  if (!robotsAllows(robots, new URL(categoryUrl).pathname)) throw new Error('ROBOTS_DISALLOWED')
  const firstList = await fetchWsss(categoryUrl)
  const pages = parsePaginationPages(firstList, categoryUrl).filter((page) => page <= maxPages)
  const postsById = new Map()
  for (const page of pages) {
    const html = page === 1 ? firstList : await fetchWsss(`${categoryUrl}?page=${page}`)
    for (const post of parseWsssList(html, categoryUrl, page)) postsById.set(post.id, post)
  }

  const posts = selectPostsForRun([...postsById.values()], checkpoint, maxArticles, backfill)
  const documents = new Map<string, string>()
  for (const post of posts) {
    if (!robotsAllows(robots, new URL(post.url).pathname)) throw new Error('ROBOTS_DISALLOWED')
    await new Promise((resolve) => setTimeout(resolve, 2_000 + Math.floor(Math.random() * 2_001)))
    documents.set(post.url, await fetchWsss(post.url))
  }
  const result = buildCandidates(posts, documents, checkpoint)
  if (!submit) {
    process.stdout.write(`${JSON.stringify({ mode, ...result }, null, 2)}\n`)
    return
  }
  if (!apiBase || !keyId || !secret) {
    throw new Error('INGESTION_API_URL, INGESTION_KEY_ID, INGESTION_HMAC_SECRET가 필요합니다.')
  }
  if (result.failures.length > 0) {
    throw new Error(`WSSS_ARTICLE_FAILURES: ${JSON.stringify(result.failures)}`)
  }

  const runId = `wsss-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  const trigger = args.includes('--scheduled') ? 'schedule' : 'manual'
  const batch = result.items.length
    ? await submitCandidateBatches(
        apiBase,
        runId,
        result.items,
        checkpoint ? JSON.stringify(checkpoint) : null,
        { keyId, secret },
        trigger,
      )
    : (
        await sendSignedJson<{
          data: Awaited<ReturnType<typeof submitCandidateBatches>>
        }>(
          apiBase,
          '/api/v1/ingestion/batches',
          {
            runId,
            trigger,
            checkpointBefore: checkpoint ? JSON.stringify(checkpoint) : null,
            items: [],
          },
          { keyId, secret },
        )
      ).data
  const savedIds = batch.items
    .filter((item) => item.result !== 'failed')
    .map((item) => item.externalId)
  const nextCheckpoint = completeProcessedPosts(
    advanceCheckpoint(result.checkpoint, savedIds),
    posts,
    documents,
  )
  await sendSignedJson(
    apiBase,
    `/api/v1/ingestion/runs/${runId}/complete`,
    { checkpointAfter: nextCheckpoint },
    { keyId, secret },
  )
  if (checkpointPath)
    await writeFile(checkpointPath, `${JSON.stringify(nextCheckpoint, null, 2)}\n`, 'utf8')
  process.stdout.write(
    `${JSON.stringify({ runId, ...batch, failures: result.failures, checkpoint: nextCheckpoint }, null, 2)}\n`,
  )
}

if (mode === 'live' || mode === 'preflight-live') {
  await liveRun(mode === 'live')
} else {
  process.stdout.write(`${JSON.stringify({ mode, ...(await fixtureRun()) }, null, 2)}\n`)
}
