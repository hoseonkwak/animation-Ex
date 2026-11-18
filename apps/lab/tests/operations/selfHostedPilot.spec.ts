import { describe, expect, it } from 'vitest'
import { validatePackage } from '../../scripts/self-hosted-pilot.mjs'
import { validPracticeLibraries } from '../../src/shared/practice'
import { validPracticeResources } from '../../src/features/practice/resources'

const item = {
  slug: 'test-package',
  source: { canonicalUrl: 'https://codepen.io/example/pen/Test123', creatorName: 'example' },
}

function fixture() {
  return {
    schemaVersion: 1,
    slug: item.slug,
    source: {
      ...item.source,
      licenseCode: 'MIT',
      licenseText: 'Test fixture license evidence',
      acquiredAt: '2026-11-18T00:00:00.000Z',
    },
    code: { html: '<main>검증 fixture</main>', css: '', javascript: '' },
    libraries: [],
    resources: { scripts: [], styles: [], images: [] },
  }
}

describe('자체 실행 파일럿 입력 계약', () => {
  it('예제 출처·라이선스·코드·리소스를 검증한다', () => {
    expect(() =>
      validatePackage(fixture(), item, validPracticeResources, validPracticeLibraries),
    ).not.toThrow()
    const missingLicense = fixture()
    missingLicense.source.licenseText = ''
    expect(() =>
      validatePackage(missingLicense, item, validPracticeResources, validPracticeLibraries),
    ).toThrow('INVALID_PACKAGE')
    const wrongSource = fixture()
    wrongSource.source.canonicalUrl = 'https://codepen.io/another/pen/Test456'
    expect(() =>
      validatePackage(wrongSource, item, validPracticeResources, validPracticeLibraries),
    ).toThrow('INVALID_PACKAGE')
  })

  it('CodePen에 다시 의존하는 패키지를 전환 성공으로 받지 않는다', () => {
    const codepenDependency = {
      ...fixture(),
      resources: { scripts: ['https://codepen.io/example/pen/Test123.js'], styles: [], images: [] },
    }
    expect(() =>
      validatePackage(codepenDependency, item, validPracticeResources, validPracticeLibraries),
    ).toThrow('CODEPEN_RUNTIME_DEPENDENCY')
  })
})
