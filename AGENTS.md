# Kwak Motion Lab 프로젝트 지침

## 기준 문서

아키텍처, 기능, 콘텐츠 파이프라인 또는 UX 작업을 시작하기 전에 다음 문서를 읽는다.

1. `docs/RENEWAL_PRODUCT_SPEC.md`
2. `docs/DECISIONS.md`
3. `docs/PHASE1_TECHNICAL_DESIGN.md`
4. API 작업은 `docs/API_CONTRACT.md`, 데이터 작업은 `docs/D1_SCHEMA.md`
5. 관리자 작업은 `docs/ADMIN_REVIEW_SPEC.md`, WSSS 수집 작업은 `docs/WSSS_INGESTION_SPEC.md`
6. 공개 UI 작업은 `docs/PUBLIC_SCREEN_SPEC.md`와 `docs/DESIGN_SYSTEM.md`
7. 작업 순서와 증거는 `docs/PHASE1_EXECUTION_PLAN.md`
8. `docs/HARNESS_ROADMAP.md`에서 현재 작업에 연결한 세부 문서

문서가 충돌하면 `docs/DECISIONS.md`에서 가장 최근에 명시적으로 확정한 결정이 우선한다. 이미 합의한 제품 결정을 알리지 않고 변경하지 않는다.

## 제품 제약

- 공개 애니메이션 미리보기는 실제 코드를 실행해야 한다. 이미지, GIF 또는 녹화 영상으로 대체하지 않는다.
- 초기 사용자 경험은 회원가입 없이 동작해야 한다.
- Light를 기본 테마로 하고 Dark는 선택 사항으로 제공한다.
- 실행 코드의 원본은 서비스 내부에 저장한다. CodePen은 원본 Pen 임베드와 외부 편집, 저장, Fork 및 공유에 사용한다.
- 일반 웹 사례는 HTML, CSS, JavaScript, 샘플 문구, 이미지와 SVG를 새로 제작한다. 원본 사이트의 로고나 독점 에셋을 복사하지 않는다.
- 기존 CodePen을 임베드하거나 수정할 때 제작자와 라이선스 정보를 유지한다.
- 초기 관리자는 소유자 한 명이다. 새로운 결정 없이 팀 권한을 추가하지 않는다.
- 초기 제품 언어는 한국어다. 원본 제목과 영어 기술 태그는 필요에 따라 유지한다.
- Phase 1은 월 고정비 없이 운영한다. 무료 한도를 자동으로 넘기는 유료 기능과 AI API는 새로운 결정 없이 활성화하지 않는다.

## 작업 규칙

- 사용자가 명시적으로 범위를 넓히지 않는 한 현재 출시 단계 안에서 작업한다.
- 기존의 커밋되지 않은 사용자 변경을 보존하고 관련 없는 파일을 다시 작성하지 않는다.
- 문서화된 완료 조건을 만족하는 작고 검토 가능한 변경을 선호한다.
- 제품 또는 아키텍처 결정이 바뀌면 `docs/DECISIONS.md`에 기록한다.
- 구현 중 누락된 제약을 발견하면 가장 가까운 명세를 갱신한다.
- 프로젝트 Skill은 작업이 반복되거나 안정적인 다단계 절차가 필요할 때 만든다.
- Subagent는 전문 작업에 구분되는 문맥, 도구 또는 검증 책임이 있을 때만 추가한다.

## 검증 규칙

- `docs/QUALITY_GATES.md`의 관련 조건을 통과하기 전에는 콘텐츠를 공개 가능 상태로 표시하지 않는다.
- `docs/PHASE1_ACCEPTANCE.md`를 통과하기 전에는 Phase 1을 완료로 표시하지 않는다.
- 스키마, 링크, 실행 오류와 sandbox 정책에는 결정적인 자동 검사를 우선한다.
- 에이전트의 판단과 결정적 검사 결과를 분리해 기록한다.
- 자동화 단계가 실패하면 항목을 조용히 건너뛰지 말고 원인을 추적할 수 있는 실패 상태를 남긴다.

## 현재 구현 상태

- 저장소에는 정적 HTML, CSS와 JavaScript로 만든 GSAP 갤러리가 있다.
- `apps/lab`에 Vue 3, Vue Router, TypeScript와 Cloudflare Worker 기반 WP0가 있다.
- Node.js 24.12 이상을 사용한다. `.nvmrc`의 검증 버전은 24.19.0이다.
- 의존성 설치는 저장소 루트에서 `npm ci`로 재현한다.
- 로컬 실행은 `npm run dev`, production build는 `npm run build`다.
- 기본 검증은 `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run test`다.
- 브라우저 검증은 Playwright 브라우저 설치 후 `npm run test:e2e`로 실행한다.
- 계약 및 수집 fixture가 생기면 `npm run test:contracts`, `npm run test:ingestion`을 필수 게이트로 올린다.
- 기존 루트 정적 사이트는 전환 검증이 끝날 때까지 그대로 보존한다.
