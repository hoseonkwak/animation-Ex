// @vitest-environment node

import { describe, expect, it } from 'vitest'

import worker from '../../server/index'
import { findReadyPracticeKit } from '../../server/practice'
import { createMigratedDatabase } from './database'

const context = { waitUntil() {}, passThroughOnException() {} } as ExecutionContext

describe('Phase 2 Practice Kit contract', () => {
  it('Practice 홈 목록은 공개된 ready Kit만 반환한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    const list = async (filter: string) =>
      worker.fetch(
        new Request(`https://example.test/api/v1/examples?${filter}`),
        { DB: d1 },
        context,
      )
    const response = await list('practiceReady=true&limit=12')
    const body = (await response.json()) as { data: { items: { slug: string }[] } }
    expect(response.status).toBe(200)
    expect(body.data.items).toHaveLength(10)
    expect(body.data.items.map((item) => item.slug)).toContain('gsap-scrolltrigger')
    sqlite.exec("UPDATE practice_kits SET status='paused' WHERE id='practice-basic-tween'")
    const paused = (await (await list('practiceReady=true&limit=12')).json()) as {
      data: { items: { slug: string }[] }
    }
    expect(paused.data.items).toHaveLength(9)
    expect(paused.data.items.map((item) => item.slug)).not.toContain('gsap-basic-tween')
    expect((await list('practiceReady=false')).status).toBe(400)
    sqlite.close()
  })

  it('공개 예제의 검증된 자체 제작 시작 코드와 고정 버전만 반환한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    const response = await worker.fetch(
      new Request('https://example.test/api/v1/examples/interactive-card-hover/practice-kit'),
      { DB: d1 },
      context,
    )
    const body = (await response.json()) as {
      data: {
        versionId: string
        code: { html: string; javascript: string }
        libraries: string[]
        provenance: { basis: string; licenseCode: string }
      }
    }
    expect(response.status).toBe(200)
    expect(body.data.versionId).toBe('practice-card-hover-v1')
    expect(body.data.code.html).toContain('kit-card')
    expect(body.data.code.javascript).toContain('pointermove')
    expect(body.data.libraries).toEqual([])
    expect(body.data.provenance).toMatchObject({
      basis: 'independent-reimplementation',
      licenseCode: 'MIT',
    })
    const detail = await worker.fetch(
      new Request('https://example.test/api/v1/examples/interactive-card-hover'),
      { DB: d1 },
      context,
    )
    expect(
      ((await detail.json()) as { data: { practiceKitReady: boolean } }).data.practiceKitReady,
    ).toBe(true)
    sqlite.close()
  })

  it('GSAP Kit은 허용된 내장 라이브러리와 자체 제작 시작 코드를 제공한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    const response = await worker.fetch(
      new Request('https://example.test/api/v1/examples/gsap-basic-tween/practice-kit'),
      { DB: d1 },
      context,
    )
    const body = (await response.json()) as {
      data: { versionId: string; libraries: string[]; code: { javascript: string } }
    }
    expect(response.status).toBe(200)
    expect(body.data.versionId).toBe('practice-basic-tween-v1')
    expect(body.data.libraries).toEqual(['gsap@3.15.0'])
    expect(body.data.code.javascript).toContain('gsap.to')
    sqlite.close()
  })

  it.each([
    ['gsap-basic-transform', 'practice-basic-transform-v2', 'gsap.to'],
    ['gsap-from-fromto-timeline', 'practice-from-fromto-timeline-v1', 'gsap.timeline'],
  ])('%s Kit을 올바른 Entry의 고정 GSAP 코드로 반환한다', async (slug, versionId, api) => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    const response = await worker.fetch(
      new Request(`https://example.test/api/v1/examples/${slug}/practice-kit`),
      { DB: d1 },
      context,
    )
    const body = (await response.json()) as {
      data: { versionId: string; libraries: string[]; code: { javascript: string } }
    }
    expect(response.status).toBe(200)
    expect(body.data.versionId).toBe(versionId)
    expect(body.data.libraries).toEqual(['gsap@3.15.0'])
    expect(body.data.code.javascript).toContain(api)
    sqlite.close()
  })

  it('추가 Kit 6개의 Entry·권리·실행 정책을 공개 API에서 확인한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    const cases = [
      ['gsap-mouse-interaction', 'practice-mouse-interaction-v1', 1],
      ['gsap-dynamic-timeline', 'practice-dynamic-timeline-v1', 1],
      ['gsap-text-reveal', 'practice-text-reveal-v1', 1],
      ['gsap-rainbow-background', 'practice-rainbow-background-v1', 1],
      ['gsap-text-drawing', 'practice-text-drawing-v1', 1],
      ['gsap-scrolltrigger', 'practice-scrolltrigger-v1', 2],
    ] as const
    for (const [slug, versionId, libraryCount] of cases) {
      const response = await worker.fetch(
        new Request(`https://example.test/api/v1/examples/${slug}/practice-kit`),
        { DB: d1 },
        context,
      )
      const body = (await response.json()) as {
        data: {
          versionId: string
          libraries: string[]
          code: { html: string; css: string; javascript: string }
          provenance: { basis: string; author: string; licenseCode: string }
        }
      }
      expect(response.status, slug).toBe(200)
      expect(body.data.versionId).toBe(versionId)
      expect(body.data.libraries).toHaveLength(libraryCount)
      expect(body.data.libraries).toContain('gsap@3.15.0')
      expect(
        body.data.code.html.length + body.data.code.css.length + body.data.code.javascript.length,
      ).toBeGreaterThan(300)
      expect(body.data.provenance).toMatchObject({
        basis: 'independent-reimplementation',
        author: 'Kwak Motion Lab',
        licenseCode: 'MIT',
      })
    }
    expect(
      (
        sqlite
          .prepare("SELECT count(*) AS count FROM practice_kits WHERE status='ready'")
          .get() as {
          count: number
        }
      ).count,
    ).toBe(10)
    sqlite.close()
  })

  it('Kit이 없거나 중지되면 시작 코드를 제공하지 않는다', async () => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    const missing = await worker.fetch(
      new Request('https://example.test/api/v1/examples/gsap-stagger-grid/practice-kit'),
      { DB: d1 },
      context,
    )
    expect(missing.status).toBe(404)
    sqlite.exec("UPDATE practice_kits SET status = 'paused' WHERE id = 'practice-card-hover'")
    expect(await findReadyPracticeKit(d1, 'interactive-card-hover')).toBeNull()
    sqlite.exec("UPDATE practice_kits SET status = 'paused' WHERE id = 'practice-basic-tween'")
    expect(await findReadyPracticeKit(d1, 'gsap-basic-tween')).toBeNull()
    sqlite.close()
  })

  it('버전 본문 수정과 다른 Entry의 시작 코드 연결을 거부한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    expect(() =>
      sqlite.exec(
        "UPDATE code_package_versions SET html = '<p>changed</p>' WHERE id = 'practice-card-hover-v1'",
      ),
    ).toThrow('immutable')
    expect(() =>
      sqlite.exec(
        `INSERT INTO practice_kits
          (id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at)
         VALUES ('wrong-kit', 'entry-basic-1', 'practice-card-hover-v1', 'free', 'draft', '2026-10-27', '2026-10-27')`,
      ),
    ).toThrow('entry mismatch')
    sqlite.exec("UPDATE practice_kits SET status = 'draft' WHERE id = 'practice-card-hover'")
    expect(await findReadyPracticeKit(d1, 'interactive-card-hover')).toBeNull()
    sqlite.close()
  })

  it('기존 초안용 v1 코드를 보존하고 새 Kit 진입에는 v2를 제공한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    const versions = sqlite
      .prepare(
        "SELECT id, version, css FROM code_package_versions WHERE id IN ('practice-basic-transform-v1', 'practice-basic-transform-v2') ORDER BY version",
      )
      .all() as { id: string; version: number; css: string }[]
    expect(versions.map(({ id, version }) => ({ id, version }))).toEqual([
      { id: 'practice-basic-transform-v1', version: 1 },
      { id: 'practice-basic-transform-v2', version: 2 },
    ])
    expect(versions[0].css).toContain('.transform-target{right:34px;bottom:18px}')
    expect(versions[1].css).toContain('.transform-target{right:34px;top:18px}')
    expect(() =>
      sqlite.exec(
        "UPDATE code_package_versions SET css = 'changed' WHERE id = 'practice-basic-transform-v1'",
      ),
    ).toThrow('immutable')
    const response = await worker.fetch(
      new Request('https://example.test/api/v1/examples/gsap-basic-transform/practice-kit'),
      { DB: d1 },
      context,
    )
    expect(((await response.json()) as { data: { versionId: string } }).data.versionId).toBe(
      'practice-basic-transform-v2',
    )
    sqlite.close()
  })

  it('허용하지 않은 외부 라이브러리 정책은 공개 API에서 거부한다', async () => {
    const { sqlite, d1 } = createMigratedDatabase({ includePracticeSeed: true })
    sqlite.exec(`INSERT INTO code_package_versions (
      id, animation_entry_id, version, html, css, javascript,
      external_scripts_json, external_styles_json, assets_json, viewport_json,
      interaction_instructions, runtime_policy_json, provenance_json, license_code,
      created_by, created_at
    ) SELECT 'practice-basic-tween-invalid', animation_entry_id, 2, html, css, javascript,
      external_scripts_json, external_styles_json, assets_json, viewport_json,
      interaction_instructions,
      '{"sandbox":"allow-scripts","network":"blocked","libraries":["unknown@1"]}',
      provenance_json, license_code, created_by, created_at
      FROM code_package_versions WHERE id = 'practice-basic-tween-v1'`)
    sqlite.exec(`UPDATE practice_kits
      SET starter_code_package_version_id = 'practice-basic-tween-invalid'
      WHERE id = 'practice-basic-tween'`)
    await expect(findReadyPracticeKit(d1, 'gsap-basic-tween')).rejects.toThrow(
      'violates the public runtime or rights policy',
    )
    sqlite.close()
  })
})
