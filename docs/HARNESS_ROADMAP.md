# 하네스 확장 로드맵

문서 상태: Active v0.1
목적: 필요한 문서, Skill, Subagent, 도구와 자동 검사를 실제 필요 시점에 추가한다.

## 1. 현재 하네스

### 완료

- `AGENTS.md`
- `README.md`
- `docs/RENEWAL_PRODUCT_SPEC.md`
- `docs/DECISIONS.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/CONTENT_SCHEMA.md`
- `docs/QUALITY_GATES.md`
- `docs/PHASE1_ACCEPTANCE.md`
- `docs/UX_SPEC.md`
- `docs/PHASE1_TECHNICAL_DESIGN.md`
- `docs/API_CONTRACT.md`
- `docs/D1_SCHEMA.md`
- `docs/ADMIN_REVIEW_SPEC.md`
- `docs/WSSS_INGESTION_SPEC.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/PUBLIC_SCREEN_SPEC.md`
- `docs/PHASE1_EXECUTION_PLAN.md`
- `docs/evidence/PHASE1_BASELINE.md`
- `docs/evidence/WP0_REPORT.md`
- `apps/lab`의 TypeScript, ESLint, Prettier, Vitest, Playwright와 production build 하네스
- `.github/workflows/ci.yml`의 install → typecheck → lint → test → build 게이트

### 다음 구현 단계에서 추가

- 데이터 migration 규칙
- 테스트 fixture
- Preview sandbox threat model
- 운영 Runbook
- 무료 한도 점검 및 수집 중지 자동화

구현 순서와 각 항목의 증거는 `PHASE1_EXECUTION_PLAN.md`를 따른다.

## 2. Skill 생성 기준

Skill은 이름만 먼저 만들지 않는다. 다음 중 하나가 충족되면 `.agents/skills/<name>/SKILL.md`로 추가한다.

- 같은 절차를 두 번 이상 수행함
- 작업 순서가 바뀌면 데이터 또는 공개 품질에 문제가 생김
- 특정 입력 및 출력 스키마가 필요함
- 전용 검증 스크립트나 참고 문서가 필요함
- 새로운 세션에서도 동일하게 재현해야 함

### 예정 Skill

#### source-ingestion

생성 시점: 첫 WSSS 또는 URL 수집기를 구현할 때

포함할 내용:

- source canonicalization
- metadata extraction
- provenance
- deduplication
- candidate fixture와 검증 명령

#### example-authoring

생성 시점: 일반 웹 사례를 내부 CodePackage로 처음 생성할 때

포함할 내용:

- motion 분석 입력
- 샘플 에셋 규칙
- 허용 기술과 외부 리소스
- CodePackage 출력 계약
- 생성 실패 분류

#### example-validation

생성 시점: Preview Runtime과 첫 runtime validator를 구현할 때

포함할 내용:

- static checks
- runtime checks
- sandbox policy
- 증거 수집
- ValidationRun 출력

#### tutorial-authoring

생성 시점: 첫 단계별 Tutorial을 만들 때

포함할 내용:

- tutorial 구조
- mission contract
- hint와 solution 규칙
- 단계별 실행 검증

## 3. Subagent 생성 기준

다음 조건이 생기기 전에는 별도 Subagent를 만들지 않는다.

- 작업에 독립적인 도구 또는 권한이 필요함
- 긴 수집 결과가 구현 컨텍스트를 오염시킴
- 생성과 검증을 의도적으로 분리해야 함
- 서로 독립적인 작업을 병렬 실행할 이점이 분명함

예정 역할은 Discovery, Classification, Example Authoring과 Review다. Review 역할은 생성 역할과 분리하며 결정적 검사 결과를 우선한다.

## 4. MCP와 외부 도구

다음 요구가 실제 구현될 때만 추가한다.

- 브라우저 기반 웹 섹션 분석
- 외부 검색 공급자
- 원격 작업 큐 또는 데이터 시스템
- GitHub 자동 리뷰
- 디자인 도구 연결

제품 런타임에 필요한 수집기와 Codex 개발용 MCP를 혼동하지 않는다. 제품 기능은 배포 환경에서 독립적으로 동작해야 한다.

## 5. 문서 갱신 규칙

- 새 제품 결정: `DECISIONS.md`
- 시스템 경계 변경: `ARCHITECTURE.md`
- 엔터티 또는 관계 변경: `DATA_MODEL.md`
- 필드 또는 상태 변경: `CONTENT_SCHEMA.md`
- 검증 조건 변경: `QUALITY_GATES.md`
- Phase 1 범위 변경: `PHASE1_ACCEPTANCE.md`
- 반복 작업 정착: 해당 Skill
- 운영 장애와 복구 절차: 향후 `RUNBOOK.md`

구현 중 발견한 내용은 작업 종료 전에 가장 가까운 문서에 반영한다. 문서와 구현이 다르면 구현을 그대로 정답으로 간주하지 않고 차이를 검토한다.
