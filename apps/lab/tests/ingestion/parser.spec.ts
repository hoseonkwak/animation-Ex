// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { normalizeCodePenUrl, IngestionParseError } from '../../ingestion/normalize.ts'
import { parsePaginationPages, parseWsssArticle, parseWsssList } from '../../ingestion/parser.ts'
import {
  advanceCheckpoint,
  buildCandidates,
  completeProcessedPosts,
  selectPostsForRun,
} from '../../ingestion/pipeline.ts'
import { fetchWsss, CollectionStoppedError, robotsAllows } from '../../ingestion/policy.ts'
import { suggestTags } from '../../ingestion/tags.ts'

const fixture = (name: string) => readFileSync(path.resolve('fixtures/wsss', name), 'utf8')
const categoryUrl = 'https://wsss.tistory.com/category/Animation/GSAP'

describe('WSSS parser fixture', () => {
  it('목록의 숫자 게시물과 pagination만 발견한다', () => {
    const html = fixture('category-gsap.html')
    expect(parseWsssList(html, categoryUrl)).toEqual([
      {
        id: '1603',
        url: 'https://wsss.tistory.com/1603',
        title: 'GSAP 홈페이지 메인 애니메이션',
        category: 'Animation/GSAP',
        page: 1,
      },
      {
        id: '1604',
        url: 'https://wsss.tistory.com/1604',
        title: 'GSAP 다중 Pen 예제',
        category: 'Animation/GSAP',
        page: 1,
      },
    ])
    expect(parsePaginationPages(html, categoryUrl)).toEqual([1, 2])
  })

  it('페이지네이션에서 중간 링크가 생략되어도 모든 페이지를 방문한다', () => {
    const html = '<a href="?page=2">2</a><a href="?page=4">4</a><a href="?page=6">6</a>'
    expect(parsePaginationPages(html, categoryUrl)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('한 게시물의 여러 Pen을 순서대로 보존한다', () => {
    const article = parseWsssArticle(
      fixture('article-1604-multi.html'),
      'https://wsss.tistory.com/1604',
    )
    expect(article.pens.map((pen) => pen.penKey)).toEqual([
      'georgedoescode/abC123',
      'Sicontis/XyZ789',
    ])
    expect(article.pens.map((pen) => pen.creatorName)).toEqual(['George Francis', 'Sicontis'])
  })

  it('목록 구조 변경을 빈 성공 대신 실패로 기록한다', () => {
    expect(() => parseWsssList('<html><body>changed</body></html>', categoryUrl)).toThrowError(
      expect.objectContaining({ code: 'LIST_STRUCTURE_CHANGED' }),
    )
  })
})

describe('CodePen canonicalization과 태그', () => {
  it('Pen과 embed URL의 query·fragment를 같은 canonical URL로 만든다', () => {
    expect(normalizeCodePenUrl('http://codepen.io/Creator/pen/AbC123/?x=1#result')).toEqual({
      canonicalUrl: 'https://codepen.io/Creator/pen/AbC123',
      penKey: 'Creator/AbC123',
      creatorSlug: 'Creator',
      penId: 'AbC123',
    })
    expect(
      normalizeCodePenUrl('https://codepen.io/Creator/embed/AbC123?default-tab=result')
        .canonicalUrl,
    ).toBe('https://codepen.io/Creator/pen/AbC123')
  })

  it('팀 Pen URL도 원래 제작자 경로로 정규화한다', () => {
    expect(normalizeCodePenUrl('https://codepen.io/team/keyframers/pen/ZMRMEw/')).toEqual({
      canonicalUrl: 'https://codepen.io/team/keyframers/pen/ZMRMEw',
      penKey: 'team/keyframers/ZMRMEw',
      creatorSlug: 'team/keyframers',
      penId: 'ZMRMEw',
    })
    const article = parseWsssArticle(
      '<meta property="og:title" content="팀 Pen"><a href="/category/Parallax/Scroll">Scroll</a><a href="https://codepen.io/team/keyframers/pen/ZMRMEw/">Apple Watch Scroll</a>',
      'https://wsss.tistory.com/1052',
    )
    expect(article.pens[0]?.canonicalUrl).toBe('https://codepen.io/team/keyframers/pen/ZMRMEw')
  })

  it('CodePen 외 host를 거절하고 GSAP category만 확정 태그로 만든다', () => {
    expect(() => normalizeCodePenUrl('https://example.com/user/pen/abc')).toThrow(
      IngestionParseError,
    )
    const tags = suggestTags('Animation/GSAP', 'Homepage reveal')
    expect(tags).toContainEqual({
      axis: 'technology',
      key: 'gsap',
      source: 'imported',
      confidence: 1,
      confirmed: true,
    })
    expect(tags).toContainEqual({
      axis: 'section',
      key: 'hero',
      source: 'inferred',
      confidence: 0.7,
      confirmed: false,
    })
  })

  it('명확한 카테고리와 제목만 제안하고 일반 Animation은 임의 분류하지 않는다', () => {
    expect(suggestTags('Particles/Canvas', 'Floating dots')).toContainEqual({
      axis: 'technology',
      key: 'canvas',
      source: 'inferred',
      confidence: 0.85,
      confirmed: false,
    })
    expect(suggestTags('Animation/Animation', 'GSAP Text Reveal')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ axis: 'technology', key: 'gsap', confirmed: false }),
        expect.objectContaining({ axis: 'section', key: 'text', confirmed: false }),
      ]),
    )
    expect(suggestTags('Animation/Animation', 'Untitled animation')).toEqual([])
    expect(suggestTags('Animation/Animation', 'COMICS HEROES IN POLYGONS')).toEqual([])
  })
})

describe('checkpoint와 요청 안전 정책', () => {
  it('backfill은 이전에 완료한 글을 건너뛰고 새 글 수만 제한한다', () => {
    const posts = Array.from({ length: 35 }, (_, index) => ({
      id: String(index),
      url: `https://wsss.tistory.com/${index}`,
      title: `Post ${index}`,
      category: 'Parallax/Scroll',
      page: 1,
    }))
    const checkpoint = {
      category: 'Parallax/Scroll',
      page: 1,
      lastPostId: '29',
      processedExternalIds: posts.slice(0, 30).map((post) => `wsss:${post.id}:0`),
      completedPostIds: posts.slice(0, 30).map((post) => post.id),
    }
    expect(selectPostsForRun(posts, checkpoint, 3, true).map((post) => post.id)).toEqual([
      '30',
      '31',
      '32',
    ])
    expect(selectPostsForRun(posts, checkpoint, 3, false)).toEqual([])
  })

  it('한 글의 모든 Pen이 저장된 뒤에만 상세 페이지를 완료 처리한다', () => {
    const post = parseWsssList(fixture('category-gsap.html'), categoryUrl)[1]!
    const documents = new Map([[post.url, fixture('article-1604-multi.html')]])
    const base = buildCandidates([post], documents).checkpoint
    const partial = completeProcessedPosts(
      advanceCheckpoint(base, ['wsss:1604:0']),
      [post],
      documents,
    )
    expect(partial.completedPostIds).toEqual([])
    const full = completeProcessedPosts(
      advanceCheckpoint(partial, ['wsss:1604:1']),
      [post],
      documents,
    )
    expect(full.completedPostIds).toEqual(['1604'])
  })

  it('다음 배치를 만들 때 기존 완료 게시물 목록을 유지한다', () => {
    const post = parseWsssList(fixture('category-gsap.html'), categoryUrl)[0]!
    const checkpoint = {
      category: post.category,
      page: post.page,
      lastPostId: '999',
      processedExternalIds: ['wsss:999:0'],
      completedPostIds: ['999'],
    }
    const result = buildCandidates(
      [post],
      new Map([[post.url, fixture('article-1603.html')]]),
      checkpoint,
    )
    expect(result.checkpoint.completedPostIds).toEqual(['999'])
  })

  it('같은 fixture를 세 번 처리해도 저장 완료된 후보가 다시 나오지 않는다', () => {
    const posts = parseWsssList(fixture('category-gsap.html'), categoryUrl)
    const documents = new Map([
      ['https://wsss.tistory.com/1603', fixture('article-1603.html')],
      ['https://wsss.tistory.com/1604', fixture('article-1604-multi.html')],
    ])
    const first = buildCandidates(posts, documents)
    expect(first.items).toHaveLength(3)
    const partialCheckpoint = advanceCheckpoint(first.checkpoint, [first.items[0]!.externalId])
    expect(buildCandidates(posts, documents, partialCheckpoint).items).toHaveLength(2)
    const checkpoint = advanceCheckpoint(
      partialCheckpoint,
      first.items.slice(1).map((item) => item.externalId),
    )
    expect(buildCandidates(posts, documents, checkpoint).items).toHaveLength(0)
    expect(buildCandidates(posts, documents, checkpoint).items).toHaveLength(0)
  })

  it('robots 금지 경로를 구분한다', () => {
    const robots = 'User-agent: *\nDisallow: /admin\nDisallow: /search\n'
    expect(robotsAllows(robots, '/1603')).toBe(true)
    expect(robotsAllows(robots, '/admin')).toBe(false)
  })

  it.each([403, 429])('HTTP %s에서 재시도 없이 전체 실행을 중지한다', async (status) => {
    let requests = 0
    const fetcher = async () => {
      requests += 1
      return new Response('', { status })
    }
    await expect(
      fetchWsss('https://wsss.tistory.com/1603', {
        fetcher,
        wait: async () => {},
        retryDelaysMs: [0, 0],
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<CollectionStoppedError>>({ code: 'SOURCE_RATE_LIMITED' }),
    )
    expect(requests).toBe(1)
  })

  it('5xx는 두 번만 재시도하고 세 번째 실패에서 중지한다', async () => {
    let requests = 0
    const fetcher = async () => {
      requests += 1
      return new Response('', { status: 503 })
    }
    await expect(
      fetchWsss('https://wsss.tistory.com/1603', {
        fetcher,
        wait: async () => {},
        retryDelaysMs: [0, 0],
      }),
    ).rejects.toEqual(expect.objectContaining({ code: 'ARTICLE_UNAVAILABLE' }))
    expect(requests).toBe(3)
  })
  it('ZIP·이미지·CodePen URL은 요청 함수에 도달하기 전에 차단한다', async () => {
    let requests = 0
    const fetcher = async () => {
      requests += 1
      return new Response('ok')
    }
    for (const url of [
      'https://wsss.tistory.com/file.zip',
      'https://wsss.tistory.com/a.png',
      'https://codepen.io/user/pen/abc',
    ]) {
      await expect(fetchWsss(url, { fetcher })).rejects.toBeInstanceOf(IngestionParseError)
    }
    expect(requests).toBe(0)
  })
})
