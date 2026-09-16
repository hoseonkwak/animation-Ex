import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sendSignedJson, submitCandidateBatches } from './client.ts'
import { parsePaginationPages, parseWsssList } from './parser.ts'
import { advanceCheckpoint, buildCandidates, type IngestionCheckpoint } from './pipeline.ts'
import type { DiscoveredPost } from './types.ts'
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
  const maxArticles = Math.min(Number(value('--max-articles', '200')), 200)
  const maxPages = Math.max(1, Number(value('--max-pages', '1')))
  const checkpointPath = value('--checkpoint')
  let checkpoint: IngestionCheckpoint | undefined
  if (checkpointPath) {
    try {
      checkpoint = JSON.parse(await readFile(checkpointPath, 'utf8')) as IngestionCheckpoint
    } catch {
      checkpoint = undefined
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

  const processedPostIds = new Set(
    checkpoint?.processedExternalIds
      .map((externalId) => externalId.split(':')[1])
      .filter(Boolean) ?? [],
  )
  const posts: DiscoveredPost[] = []
  let consecutiveKnown = 0
  for (const post of postsById.values()) {
    consecutiveKnown = processedPostIds.has(post.id) ? consecutiveKnown + 1 : 0
    if (consecutiveKnown >= 30 || posts.length >= maxArticles) break
    posts.push(post)
  }
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
  const apiBase = process.env.INGESTION_API_URL
  const keyId = process.env.INGESTION_KEY_ID
  const secret = process.env.INGESTION_HMAC_SECRET
  if (!apiBase || !keyId || !secret) {
    throw new Error('INGESTION_API_URL, INGESTION_KEY_ID, INGESTION_HMAC_SECRET가 필요합니다.')
  }
  if (result.items.length === 0) {
    process.stdout.write(`${JSON.stringify({ mode, ...result }, null, 2)}\n`)
    return
  }

  const runId = `wsss-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  const batch = await submitCandidateBatches(
    apiBase,
    runId,
    result.items,
    checkpoint ? JSON.stringify(checkpoint) : null,
    { keyId, secret },
  )
  const savedIds = batch.items
    .filter((item) => item.result !== 'failed')
    .map((item) => item.externalId)
  const nextCheckpoint = advanceCheckpoint(result.checkpoint, savedIds)
  await sendSignedJson(
    apiBase,
    `/api/v1/ingestion/runs/${runId}/complete`,
    { checkpointAfter: nextCheckpoint },
    { keyId, secret },
  )
  if (checkpointPath)
    await writeFile(checkpointPath, `${JSON.stringify(nextCheckpoint, null, 2)}\n`, 'utf8')
  process.stdout.write(
    `${JSON.stringify({ runId, ...batch, checkpoint: nextCheckpoint }, null, 2)}\n`,
  )
}

if (mode === 'live' || mode === 'preflight-live') {
  await liveRun(mode === 'live')
} else {
  process.stdout.write(`${JSON.stringify({ mode, ...(await fixtureRun()) }, null, 2)}\n`)
}
