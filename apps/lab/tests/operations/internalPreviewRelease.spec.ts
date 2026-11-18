// @vitest-environment node
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import catalog from '../../server/internalPreviewCatalog.json'

describe('공개 자체 실행 배포물의 검증 게이트', () => {
  it('실행·화면 비교를 통과한 버전의 실제 파일 해시와 라이선스를 보존한다', () => {
    const report = JSON.parse(
      readFileSync(path.resolve('../../docs/evidence/SELF_HOSTED_RELEASE_2026-11-18.json'), 'utf8'),
    )
    expect(report.complete).toBe(true)
    const ready = report.items.filter(
      (item: { runtime: string; visual: string }) =>
        item.runtime === 'passed' && item.visual === 'passed',
    )
    expect(Object.keys(catalog).sort()).toEqual(
      ready.map((item: { slug: string }) => item.slug).sort(),
    )
    expect(ready.length).toBeGreaterThan(0)
    for (const [slug, record] of Object.entries(catalog)) {
      const proof = ready.find((item: { slug: string }) => item.slug === slug)
      expect(record.version).toBe(proof.version)
      for (const file of proof.files) {
        const bytes = readFileSync(path.join('public/runtime', slug, record.version, file.path))
        expect(createHash('sha256').update(bytes).digest('hex'), slug + file.path).toBe(file.sha256)
      }
      const license = readFileSync(
        path.join('public/runtime', slug, record.version, 'LICENSE.txt'),
        'utf8',
      )
      expect(license).toContain(record.canonicalUrl)
      expect(license).toContain('MIT License')
      const thumbnail = readFileSync(
        path.join('public/self-hosted-thumbnails', `${slug}-${record.version}.png`),
      )
      expect(createHash('sha256').update(thumbnail).digest('hex')).toBe(
        proof.views.find((view: { width: number }) => view.width === 1280).captureSha256.local,
      )
    }
  })
})
