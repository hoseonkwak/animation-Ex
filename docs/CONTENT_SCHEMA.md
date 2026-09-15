# 콘텐츠 스키마 계약

문서 상태: Draft v0.2
목적: 수집, 생성, 검증과 공개 단계가 공유하는 최소 콘텐츠 계약

## 1. 공개 콘텐츠 예시

```json
{
  "id": "anim_01",
  "slug": "scroll-image-reveal",
  "title": "스크롤 이미지 리빌",
  "originalTitle": "Smooth Scrolly Images",
  "summary": "스크롤 진행에 따라 이미지가 마스크 영역 안에서 펼쳐지는 예제",
  "contentOrigin": "lab-created",
  "status": "published",
  "difficulty": "intermediate",
  "source": {
    "type": "website",
    "canonicalUrl": "https://example.com/work",
    "publicAttribution": false,
    "license": null
  },
  "tags": {
    "technology": ["gsap"],
    "trigger": ["scroll"],
    "motion": ["reveal", "scale"],
    "section": ["gallery"],
    "technique": ["mask", "scrub"],
    "mood": ["minimal"]
  },
  "codePackage": {
    "version": 1,
    "html": "<main>...</main>",
    "css": "html, body { ... }",
    "javascript": "gsap.registerPlugin(ScrollTrigger);",
    "externalScripts": [
      "https://cdn.jsdelivr.net/npm/gsap/dist/gsap.min.js"
    ],
    "externalStyles": [],
    "assets": [],
    "viewport": {
      "width": 1440,
      "height": 900
    },
    "interactionInstructions": "Preview 영역을 스크롤하세요."
  }
}
```

예시 URL과 CDN 버전은 계약 형식을 설명하기 위한 값이다. 실제 허용 CDN과 버전 고정 정책은 구현 단계에서 정의한다.

## 2. 필수 필드

### 모든 Candidate

- source.type
- source.url
- source.canonicalUrl 또는 canonical 판정 실패 이유
- discoveredAt
- status
- deduplicationKey

### 모든 공개 AnimationEntry

- id
- slug
- title
- summary
- contentOrigin
- status
- difficulty
- 하나 이상의 tag
- 실행 가능한 CodePen 참조 또는 active code package
- validation result
- source provenance

### 모든 CodePackage

- version
- html
- css
- javascript
- externalScripts
- externalStyles
- assets
- viewport
- runtimePolicy

빈 HTML, CSS와 JavaScript 문자열은 허용할 수 있지만 세 값이 모두 비어 있으면 공개할 수 없다.

원본 CodePen을 직접 실행하는 `original-pen` 콘텐츠는 CodePackage 대신 검증된 creator, Pen ID, canonical URL과 embed URL을 가진 CodePenRef를 사용한다.

## 3. 상태 값

Candidate와 Entry 상태는 `RENEWAL_PRODUCT_SPEC.md`의 상태 모델을 사용한다. API와 저장소에서는 소문자 kebab-case로 정규화한다.

예:

- `candidate`
- `analyzing`
- `generating`
- `validating`
- `review`
- `published`
- `practice-ready`
- `tutorial`
- `validation-failed`

Phase 1 Candidate는 `candidate`, `analyzing`, `review`, `approved`, `rejected`, `needs-edit`, `duplicate`, `source-unavailable`, `validation-failed`만 사용한다. 추출과 중복 검사 같은 세부 작업 단계는 수집 실행 이력에 기록한다.

## 4. 출처 타입

- `codepen`: 공개 Pen 또는 소유 Pen
- `website`: 일반 웹사이트
- `directory`: WSSS처럼 다른 원본을 소개하는 출처
- `submission`: 사용자가 제출한 URL
- `independent`: 특정 외부 작품에 연결되지 않은 자체 예제

## 5. 공개 출처 규칙

- original Pen embed: creator, canonical CodePen URL과 license 필요
- CodePen code-derived: creator, canonical CodePen URL과 license 필요
- lab-created generic pattern: 내부 provenance는 필요하며 공개 attribution은 선택
- external licensed asset: asset 단위 license와 credit 필요
- unknown license asset: 공개 패키지에 포함할 수 없음

## 6. 태그 계약

- 태그는 정의된 axis에 속해야 한다.
- 임의 문자열을 바로 공개 태그로 만들지 않는다.
- 새로운 태그 후보는 관리자 승인 전까지 alias 후보로 보관한다.
- 자동 추론 태그에는 confidence를 기록한다.
- 관리자 확정 태그는 후속 자동 처리로 제거하지 않는다.

## 7. 변경 관리

이 계약을 깨는 변경은 다음을 포함해야 한다.

1. `DECISIONS.md` 결정 추가
2. schema version 증가
3. 기존 데이터 migration 계획
4. fixture 갱신
5. contract validation 갱신
