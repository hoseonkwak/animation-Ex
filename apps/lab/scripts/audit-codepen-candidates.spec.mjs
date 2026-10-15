import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyProbe, codePenEmbedUrl } from './audit-codepen-candidates.mjs'

test('CodePen 이외의 주소를 검사 대상에 넣지 않는다', () => {
  assert.equal(codePenEmbedUrl('https://example.com/pen/abc'), null)
  assert.equal(codePenEmbedUrl('https://codepen.io/user/pen/abc?token=secret'), null)
  assert.equal(
    codePenEmbedUrl('https://codepen.io/team/name/pen/abc'),
    'https://codepen.io/team/name/embed/abc?default-tab=result&theme-id=light',
  )
})

test('403과 실행 내용 미확인은 공개 가능 판정이 아니다', () => {
  assert.equal(
    classifyProbe({ httpStatus: 403, frameLoaded: false, bodyLength: null, pageErrors: 0 }),
    'inconclusive',
  )
  assert.equal(
    classifyProbe({ httpStatus: 200, frameLoaded: true, bodyLength: 0, pageErrors: 0 }),
    'inconclusive',
  )
})

test('로드 성공도 실제 모션 검증 결과와 구분한다', () => {
  assert.equal(
    classifyProbe({ httpStatus: 200, frameLoaded: true, bodyLength: 10, pageErrors: 0 }),
    'loaded',
  )
  assert.equal(
    classifyProbe({ httpStatus: 404, frameLoaded: false, bodyLength: null, pageErrors: 0 }),
    'failed',
  )
})
