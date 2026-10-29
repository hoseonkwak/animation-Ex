// @vitest-environment node

import { describe, expect, it } from 'vitest'

import worker from '../../server/index'
import { findReadyPracticeKit } from '../../server/practice'
import { createMigratedDatabase } from './database'

const context = { waitUntil() {}, passThroughOnException() {} } as ExecutionContext

describe('Phase 2 Practice Kit contract', () => {
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
