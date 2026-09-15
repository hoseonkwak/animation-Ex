# 개념 아키텍처

문서 상태: Draft v0.2
범위: 시스템 경계와 Phase 1 기술 구성

## 1. 목표

Kwak Motion Lab은 수집, 검수, 공개 탐색과 사용자 코드 실행을 분리한다. 자동화 실패가 사용자 화면이나 관리자 데이터에 조용히 섞이지 않도록 모든 단계에 명시적인 상태와 검증 결과를 둔다.

## 2. 시스템 영역

```text
Public Web
├─ Home / Explore / Sections / Learn
├─ Executable preview cards
├─ Detail
└─ Practice editor

Admin Web
├─ Candidate inbox
├─ Review queues
├─ Source registry
├─ Tags and collections
└─ Failure inspection

Application API
├─ Public content queries
├─ Search and filters
├─ Anonymous aggregate events
└─ Admin commands

Content Pipeline
├─ Discovery
├─ Extraction
├─ Deduplication
├─ Classification
├─ Generation
├─ Validation
└─ Monitoring

Preview Runtime
├─ Isolated execution origin
├─ Sandbox policy
├─ Resource limits
└─ Runtime reporting

Data
├─ Content metadata
├─ Source provenance
├─ Code packages and versions
├─ Validation and review history
└─ Search index
```

## 3. 신뢰 경계

### Public Web

사용자 코드나 자동 생성 코드를 직접 실행하지 않는다. Preview Runtime에 코드 패키지를 전달하고 구조화된 상태만 받는다.

### Admin Web

소유자 인증이 필요하다. 승인, 거절, 공개 중지, 코드 수정과 재생성 요청을 수행한다.

### Preview Runtime

Public Web과 다른 출처에서 동작한다. 서비스 인증 쿠키, API 키와 관리자 정보를 갖지 않는다. 외부 네트워크와 브라우저 기능은 허용 목록으로 제한한다.

### Content Pipeline

수집 결과를 바로 공개하지 않는다. 각 단계의 출력 스키마와 Quality Gate를 통과한 항목만 다음 상태로 이동한다.

## 4. 주요 흐름

### CodePen 콘텐츠

```text
Source discovery
→ CodePen canonical URL extraction
→ Metadata and license extraction
→ Deduplication
→ Runtime availability check
→ Admin review
→ Publish original embed
```

### 일반 웹 콘텐츠

```text
Website discovery
→ Motion and section analysis
→ New sample content and assets
→ Code package generation
→ Static validation
→ Isolated runtime validation
→ Admin code review
→ Publish internal live preview
```

### Practice

```text
Published code package
→ Copy to browser draft
→ Edit
→ Isolated auto-run
→ Save locally
→ Optional CodePen prefill export
```

## 5. 단계별 아키텍처 범위

### Phase 1

- Vue 3, TypeScript와 Vite 기반 Public/Admin Web
- Cloudflare Workers Static Assets와 API
- Cloudflare D1 기반 콘텐츠 및 검수 데이터
- GitHub Actions 기반 CodePen 수집
- Cloudflare Access 기반 단일 관리자 인증
- CodePen 지연 실행 Preview와 기본 실행 가능성 검사

구체적인 무료 한도, 배포 경계와 구현 순서는 `PHASE1_TECHNICAL_DESIGN.md`를 따른다.

### Phase 2

- Internal code package storage
- Practice editor
- Isolated Preview Runtime
- Browser draft persistence
- CodePen export

### Phase 3

- General website analyzer
- Code generator
- Runtime and visual validation
- Mission evaluator
- Tutorial pipeline

### Phase 4

- Scheduled source discovery
- Open-web discovery
- Conditional auto-approval
- Monitoring, retry, and prioritization loops

## 6. Phase 2 이후 확정할 사항

다음은 구현 직전에 선택한다.

- 코드 편집기 라이브러리
- Preview 배포 방식
- AI 모델과 호출 공급자
- 대규모 검색 엔진과 작업 큐

선택할 때는 비용, 개인 운영 난이도, Preview 격리, 예약 작업과 데이터 이전 가능성을 비교한다.
