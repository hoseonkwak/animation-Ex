// @vitest-environment node

import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createMigratedDatabase } from './database'

interface LegacyExample {
  position: number
  file: string
  penId: string
  slug: string
  title: string
  tags: string[]
}

const workspaceRoot = path.resolve('../..')
const legacyDirectory = path.join(workspaceRoot, 'pages/animation/gsap')
const examples = JSON.parse(
  readFileSync(path.resolve('fixtures/legacy-gsap.json'), 'utf8'),
) as LegacyExample[]
let sqlite: DatabaseSync

function count(query: string): number {
  const row = sqlite.prepare(query).get() as { count: number }
  return row.count
}

beforeAll(() => {
  sqlite = createMigratedDatabase().sqlite
})

afterAll(() => sqlite?.close())

describe('legacy GSAP import', () => {
  it('list.html의 15개 항목과 manifest의 순서·제목·Pen ID가 일치한다', () => {
    const listHtml = readFileSync(path.join(legacyDirectory, 'list.html'), 'utf8')
    const listItems = [
      ...listHtml.matchAll(/data-path="[^"]+\/(?<file>[^"]+)"[\s\S]*?<p>(?<title>[^<]+)<\/p>/g),
    ]

    expect(listItems).toHaveLength(15)
    expect(examples).toHaveLength(15)
    expect(examples.map((example) => example.position)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    )

    for (const [index, example] of examples.entries()) {
      expect(listItems[index]?.groups?.file).toBe(example.file)
      expect(listItems[index]?.groups?.title.trim()).toBe(example.title)

      const detailHtml = readFileSync(path.join(legacyDirectory, example.file), 'utf8')
      expect(detailHtml).toContain(`codepen.io/hoseonkwak/embed/${example.penId}`)
    }
  })

  it('15개를 Source, Candidate, Entry, CodePenRef와 pass ValidationRun으로 연결한다', () => {
    expect(
      count(
        "SELECT COUNT(*) AS count FROM candidates WHERE source_category = 'legacy-gsap' AND status = 'approved'",
      ),
    ).toBe(15)
    expect(
      count(
        "SELECT COUNT(*) AS count FROM animation_entries WHERE status = 'published' AND candidate_id IS NOT NULL",
      ),
    ).toBe(15)
    expect(
      count(`SELECT COUNT(*) AS count FROM codepen_refs p
        JOIN animation_entries e ON e.id = p.animation_entry_id
        JOIN candidates c ON c.id = e.candidate_id
        WHERE p.active = 1 AND c.source_category = 'legacy-gsap'`),
    ).toBe(15)
    expect(
      count(
        "SELECT COUNT(*) AS count FROM validation_runs WHERE validator = 'admin-codepen-embed' AND result = 'pass'",
      ),
    ).toBe(15)
    expect(
      count(
        "SELECT COUNT(*) AS count FROM review_decisions WHERE reason_code = 'legacy-migration' AND decision = 'approve'",
      ),
    ).toBe(15)
  })

  it('canonical URL, 제작자와 MIT 근거가 모두 있고 중복이 없다', () => {
    expect(
      count(`SELECT COUNT(*) AS count FROM sources
        WHERE creator_name = 'hoseonkwak'
          AND license_code = 'MIT'
          AND license_evidence_url = 'https://blog.codepen.io/documentation/licensing/'
          AND availability = 'available'`),
    ).toBe(15)
    expect(
      count(`SELECT COUNT(DISTINCT canonical_url) AS count FROM sources
        WHERE creator_name = 'hoseonkwak' AND availability = 'available'`),
    ).toBe(15)
    expect(
      count(`SELECT COUNT(DISTINCT p.pen_key) AS count FROM codepen_refs p
        JOIN animation_entries e ON e.id = p.animation_entry_id
        JOIN candidates c ON c.id = e.candidate_id
        WHERE p.active = 1 AND c.source_category = 'legacy-gsap'`),
    ).toBe(15)
  })

  it('모든 Entry와 Candidate에 검수한 태그를 연결한다', () => {
    expect(
      count(`SELECT COUNT(DISTINCT et.animation_entry_id) AS count FROM entry_tags et
        JOIN animation_entries e ON e.id = et.animation_entry_id
        JOIN candidates c ON c.id = e.candidate_id
        WHERE c.source_category = 'legacy-gsap'`),
    ).toBe(15)
    expect(count('SELECT COUNT(DISTINCT candidate_id) AS count FROM candidate_tags')).toBe(15)
    expect(examples.every((example) => example.tags.length >= 4)).toBe(true)
  })

  it('detail.html 중복과 목록 밖 tutorial Pen을 공개 15개에서 제외한다', () => {
    const detailHtml = readFileSync(path.join(legacyDirectory, 'detail.html'), 'utf8')
    const tutorialHtml = readFileSync(path.join(legacyDirectory, 'toturial-1.html'), 'utf8')

    expect(detailHtml).toContain('codepen.io/hoseonkwak/embed/LEVeYQO')
    expect(examples.filter((example) => example.penId === 'LEVeYQO')).toHaveLength(1)
    expect(tutorialHtml).toContain('codepen.io/GreenSock/embed/LYpgKPe')
    expect(examples.some((example) => example.penId === 'LYpgKPe')).toBe(false)
  })
})
