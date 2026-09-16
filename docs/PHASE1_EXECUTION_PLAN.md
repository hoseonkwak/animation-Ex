# Phase 1 실행 계획

문서 상태: Active v0.2
목적: 설계 문서를 작고 검토 가능한 구현 단위와 검증 증거로 변환한다.
현재 단계: WP0~WP5 완료, WP6 착수 준비

## 진행 현황

| 작업 패키지                  | 상태 | 증거                                               |
| ---------------------------- | ---- | -------------------------------------------------- |
| WP0 · 기준선과 하네스        | 완료 | [`evidence/WP0_REPORT.md`](evidence/WP0_REPORT.md) |
| WP1 · 데이터와 API 수직 절편 | 완료 | [`evidence/WP1_REPORT.md`](evidence/WP1_REPORT.md) |
| WP2 · Explore와 Preview Card | 완료 | [`evidence/WP2_REPORT.md`](evidence/WP2_REPORT.md) |
| WP3 · 기존 15개 이전         | 완료 | [`evidence/WP3_REPORT.md`](evidence/WP3_REPORT.md) |
| WP4 · 관리자 검수            | 완료 | [`evidence/WP4_REPORT.md`](evidence/WP4_REPORT.md) |
| WP5 · WSSS 수집              | 완료 | [`evidence/WP5_REPORT.md`](evidence/WP5_REPORT.md) |
| WP6~WP8                      | 대기 | 선행 작업 완료 후 진행                             |

## 1. 완료 결과

Phase 1이 끝나면 다음 흐름이 공개 환경에서 동작해야 한다.

```text
WSSS 후보 수집
→ 관리자 실제 Preview 검수
→ 승인
→ 공개 Explore 검색
→ CodePen 실제 실행
→ 브라우저 저장
```

사용자 로그인, 자체 코드 편집기, AI 검색과 일반 웹 코드 생성은 포함하지 않는다.

## 2. 저장소 전환 전략

현재 정적 사이트와 커밋되지 않은 사용자 변경을 보존하기 위해 Vue 앱을 별도 경로에서 만든다.

```text
animation-Ex/
├─ apps/
│  └─ lab/
│     ├─ src/
│     │  ├─ app/          Vue 화면과 router
│     │  ├─ components/   공통 UI
│     │  ├─ features/     explore, examples, admin 등
│     │  ├─ worker/       Cloudflare Worker API
│     │  └─ shared/       API schema와 공통 타입
│     ├─ db/
│     │  ├─ migrations/
│     │  └─ seeds/
│     ├─ ingestion/
│     └─ tests/
├─ fixtures/
│  └─ wsss/
├─ docs/
├─ index.html             기존 사이트, 전환 전까지 유지
├─ css/ js/ pages/ images/ 기존 자산, 전환 전까지 유지
└─ package.json            기존 script를 보존하며 workspace로 확장
```

배포 대상만 `apps/lab`으로 지정한다. 기존 루트 파일은 공개 전환이 확인될 때까지 이동하거나 삭제하지 않는다.

### 기존 콘텐츠 기준선

- `pages/animation/gsap/list.html`의 공개 목록: 15개
- 폴더 전체에서 찾은 고유 CodePen embed: 16개
- `detail.html`의 Pen은 `basic-1.html`과 중복
- 목록 밖 Tutorial Pen은 자동 공개하지 않고 Candidate로 등록
- `gasp-text2 copy.html`은 CodePen embed가 아닌 별도 마크업이므로 이전 목록에 포함하지 않음

Phase 1 완료 기준의 “기존 예제 15개”는 `list.html`에 연결된 항목을 뜻한다.

## 3. 구현 기본값

| 영역           | 기본값                                                    |
| -------------- | --------------------------------------------------------- |
| 패키지 관리    | 기존 npm 구성을 유지하고 workspace 추가                   |
| 언어           | TypeScript strict mode                                    |
| 화면           | Vue 3, Vue Router                                         |
| 전역 상태      | router query, feature composable과 브라우저 저장부터 사용 |
| API            | Cloudflare Worker의 명시적 route handler                  |
| 입력 검증      | 공유 schema에서 요청과 응답 동시 검증                     |
| DB             | D1 prepared statement와 repository 계층, ORM 미사용       |
| 스타일         | CSS custom properties와 scoped component CSS              |
| 단위/계약 검사 | Vitest                                                    |
| 브라우저 검사  | Playwright                                                |
| 배포 도구      | Wrangler                                                  |

Pinia, UI component library, 외부 검색 엔진과 ORM은 실제 필요가 확인되기 전에는 추가하지 않는다. 의존성 버전은 구현을 시작하는 날 공식 지원 범위를 확인하고 lockfile로 고정한다.

## 4. 작업 순서

### WP0 · 기준선과 하네스

목표: 새 작업이 기존 파일과 결정 사항을 훼손하지 않게 한다.

작업:

1. 구현용 `codex/phase1-foundation` branch 준비
2. 현재 dirty 파일과 사용자 변경 기록
3. `apps/lab` workspace 생성
4. root `package.json`의 기존 `chrome-devtools-mcp` script 보존
5. TypeScript, lint, format, unit, contract, build 명령 정의
6. 최소 CI에서 install → typecheck → test → build 실행
7. `AGENTS.md`에 확정 명령 반영

완료 증거:

- 기존 정적 사이트 파일 hash 또는 diff 기준선
- 새 Vue 빈 화면 build 성공
- 새 명령을 깨끗한 checkout에서 재현
- 기존 사용자 변경이 그대로 남아 있다는 `git diff`

중단 조건:

- 기존 `index.html`, `package.json` 변경이 자동으로 덮어써짐
- 로컬과 CI의 Node/npm 버전이 달라 lockfile을 재작성함

### WP1 · 데이터와 API 수직 절편

목표: D1부터 Vue까지 연결되는 가장 작은 실제 흐름을 만든다.

작업:

1. `D1_SCHEMA.md`의 0001~0007 migration 작성
2. 초기 Tag와 테스트용 CodePen 3개 seed
3. 공통 요청/응답 schema 작성
4. `GET /api/v1/examples`, `GET /api/v1/examples/:slug` 구현
5. Vue에서 카드 3개를 조회하고 실제 CodePen Preview 1개 실행
6. 공개 상태 이외의 Entry 누출 검사

완료 증거:

- 빈 local D1 migration 성공
- migration 재구성 및 seed 성공
- API 계약 fixture 통과
- 실제 CodePen Preview가 로컬 브라우저에서 실행
- `published`가 아닌 fixture가 응답에 없는 검사

중단 조건:

- 클라이언트가 D1 열 이름에 직접 의존함
- API가 내부 provenance 또는 관리자 메모를 반환함

### WP2 · Explore와 Preview Card

목표: 제품의 핵심인 탐색과 실제 실행 성능을 먼저 검증한다.

작업:

1. 디자인 토큰과 전역 Shell
2. Preview Card의 idle/loading/running/paused/error 상태
3. IntersectionObserver 기반 지연 로딩
4. 동시 실행 2개 scheduler
5. 검색, 축별 필터, 정렬과 cursor pagination
6. URL query 복원
7. 1~4열 반응형 구현

완료 증거:

- 같은 축 OR, 다른 축 AND 계약 검사
- 뒤로가기 후 query와 스크롤 복원 브라우저 검사
- iframe 동시 실행 수가 2를 넘지 않는 자동 검사
- 320, 768, 1024, 1440px 화면 검수
- Preview 오류가 다른 카드를 중단시키지 않는 검사

### WP3 · 기존 15개 이전

목표: 현재 공개 목록을 새 데이터 구조로 옮긴다.

작업:

1. `list.html`에서 15개 연결 항목 추출
2. embed URL을 canonical Pen URL과 pen key로 변환
3. 제목, 요약, 난이도와 태그 검수
4. Source, Candidate, Entry와 CodePenRef seed 생성
5. 15개 Preview 수동 실행 확인
6. `detail.html` 중복과 목록 밖 Pen을 별도 보고

완료 증거:

- 입력 15개, 고유 공개 Entry 15개
- canonical URL 중복 0개
- Preview pass ValidationRun 15개
- creator, MIT 근거와 원본 링크 누락 0개

중단 조건:

- 실행되지 않는 Pen을 seed 편의를 위해 published로 표시함
- 기존 제목이나 출처가 근거 없이 바뀜

### WP4 · 관리자 검수

목표: owner 한 명이 후보를 안전하게 공개할 수 있게 한다.

작업:

1. local Access identity simulation
2. Candidate Inbox 목록과 필터
3. 실제 CodePen Preview와 viewport 전환
4. 메타데이터와 축별 태그 편집
5. Preview ValidationRun 저장
6. 승인, 수정 필요, 중복, 거절
7. version 충돌과 idempotency 처리
8. Published 공개 중지

완료 증거:

- 인증 없음 401, 다른 이메일 403
- 승인 트랜잭션 전체 성공/전체 취소 검사
- 같은 승인 요청 반복 후 Entry 1개
- 오래된 version 수정 409
- Preview 확인 없이 승인 불가
- 공개 중지 후 API 410

### WP5 · WSSS 수집

목표: 수집 결과가 조용히 손상되지 않는 반복 가능한 파이프라인을 만든다.

이 작업을 시작할 때 `.agents/skills/source-ingestion/SKILL.md`를 생성한다. 첫 실제 반복 절차와 fixture, 명령이 생기는 시점이므로 하네스 생성 조건을 충족한다.

작업:

1. 최소 WSSS HTML fixture 작성
2. 목록 parser와 게시물 parser
3. CodePen URL 정규화
4. 카테고리 태그 제안
5. 중복 제거와 checkpoint
6. HMAC batch API
7. 수동 GitHub Actions workflow
8. 수동 실행 안정화 후 하루 1회 schedule 활성화

완료 증거:

- 같은 fixture 3회 실행 후 Candidate 증가 0
- 한 게시물의 여러 Pen 보존
- parser 구조 변경 fixture 실패
- 403/429에서 전체 중지
- ZIP, 이미지와 CodePen 페이지 요청 0
- 실패 후 마지막 저장 checkpoint에서 재개

중단 조건:

- fixture 실패 상태에서 실제 출처를 순회함
- robots 정책을 확인할 수 없음
- CodePen 페이지나 코드를 자동 수집함

### WP6 · 나머지 공개 화면

목표: 탐색에서 상세, 저장과 제보까지 공개 경험을 완성한다.

작업:

1. 예제 상세와 출처 표시
2. Home
3. Sections와 Hero 허브
4. Pattern과 Collection
5. Saved와 Practice Later 브라우저 저장
6. URL 제보와 Turnstile
7. About과 출처 정책
8. 404, 410, API 및 Preview 오류 상태
9. SEO metadata, sitemap과 robots

완료 증거:

- 로그인 없이 모든 공개 경로 사용
- Light 최초값과 테마 복원
- 공개 Entry만 sitemap 포함
- URL 제보 중복 여부 비노출
- 브라우저 재시작 후 Saved 복원
- Phase 1 Header에 Practice와 Learn 없음

### WP7 · 배포와 운영 안전장치

목표: 무료 범위에서 preview와 production을 안전하게 운영한다.

작업:

1. local, preview, production D1 분리
2. Cloudflare Access와 `ADMIN_EMAIL`
3. Worker/D1 사용량 경고와 수집 중지
4. 구조화 오류 로그
5. D1 export와 복구 rehearsal
6. preview noindex와 production 공개 설정
7. 배포 후 smoke test

완료 증거:

- preview에서 production DB 쓰기 실패
- 관리자 경로 외 공개 페이지는 로그인 없이 접근
- 70% 경고와 90% 수집 중지 fixture
- export로 새 local D1 복구 성공
- 대표 공개 Preview smoke test

### WP8 · 초기 공개 준비

목표: 기능이 아니라 실제 콘텐츠가 있는 공개 버전을 만든다.

작업:

1. 기존 15개 최종 재검수
2. WSSS GSAP 후보 최초 수집
3. 관리자 승인 표본 확보
4. Hero 20개 목표의 부족분 확인
5. 접근성, 반응형과 성능 회귀 검사
6. Phase 1 완료 기준에 증거 연결
7. 공개 후 되돌리기 절차 확인

완료 증거:

- `PHASE1_ACCEPTANCE.md` 전 항목에 증거 링크
- 실패 코드와 미해결 항목 0 또는 명시적 제외 결정
- production 배포와 rollback rehearsal
- 첫 백업 생성

## 5. 의존 관계

```text
WP0
 └─ WP1
     ├─ WP2 ─ WP3
     └─ WP4 ─ WP5
          └────┬─ WP6
               └─ WP7 ─ WP8
```

- WP2와 WP4는 WP1 이후 일부 병렬 진행할 수 있다.
- WP5는 관리자 큐가 있어야 수집 결과를 검수할 수 있다.
- WP6는 WP2의 카드와 API를 재사용한다.
- WP8 전에는 실제 WSSS 대규모 backfill을 실행하지 않는다.

## 6. 검증 명령 계약

실제 script 이름은 WP0에서 다음 형태로 확정한다.

```text
npm run typecheck
npm run lint
npm run test
npm run test:contracts
npm run test:ingestion
npm run test:e2e
npm run build
```

기본 개발 검사 순서:

```text
typecheck → 관련 unit/contract test → build
```

병합 전 검사 순서:

```text
typecheck → lint → unit → contracts → ingestion → build → 핵심 e2e
```

모든 변경에 전체 e2e를 반복하지 않는다. 공개 흐름, migration, Preview scheduler, 인증 또는 배포 경계를 바꿀 때 실행한다.

## 7. 증거 보관

```text
artifacts/
└─ phase1/
   ├─ acceptance.json
   ├─ migrations/
   ├─ contracts/
   ├─ ingestion/
   ├─ accessibility/
   └─ smoke/
```

- CI가 만든 기계 판독 결과는 JSON 또는 JUnit으로 남긴다.
- 수동 Preview 검수는 D1 ValidationRun에 남긴다.
- 화면 검수는 경로, viewport, commit SHA와 결과를 남긴다.
- 비밀값, Access 토큰, 전체 요청 본문과 사용자 IP는 artifact에 넣지 않는다.
- `artifacts`의 큰 실행 결과는 Git에 커밋하지 않고 CI artifact로 보관한다.

### 수용 기준 연결표

| 수용 기준              | 주 작업       | 기본 증거                                       |
| ---------------------- | ------------- | ----------------------------------------------- |
| `P1-UX-01`~`06`        | WP2, WP6, WP7 | 공개 경로 e2e, 테마 저장 검사                   |
| `P1-CONTENT-01`~`06`   | WP3, WP4, WP5 | seed 결과, ValidationRun, 승인 계약 검사        |
| `P1-DISCOVERY-01`~`07` | WP2, WP6      | API 계약, query 복원 e2e, viewport 검수         |
| `P1-PREVIEW-01`~`07`   | WP1, WP2      | iframe scheduler와 오류 격리 e2e                |
| `P1-DETAIL-01`~`05`    | WP3, WP6      | 상세 경로 e2e, 출처 fixture                     |
| `P1-ADMIN-01`~`10`     | WP4           | 인증, version, 승인과 중복 계약 검사            |
| `P1-LOCAL-01`~`04`     | WP6           | 브라우저 저장 e2e                               |
| `P1-SEO-01`~`04`       | WP6, WP7      | route, metadata, sitemap 검사                   |
| `P1-OPS-01`~`12`       | WP5, WP7, WP8 | ingestion fixture, 복구 기록, 사용량 guard 검사 |

각 자동 검사 이름이나 수동 기록에는 해당 수용 기준 ID를 넣는다. 하나의 검사가 여러 기준을 입증할 수 있지만, 결과에서 각 ID를 찾을 수 있어야 한다.

## 8. 출시 단위

### R0 · Local Vertical Slice

WP0~WP2 일부. local D1에서 세 개의 예제를 검색하고 실제 Preview를 실행한다.

### R1 · Private Preview

WP3~WP6. 기존 15개, 관리자 승인과 WSSS 수동 수집을 Access로 보호한 preview에서 검수한다.

### R2 · Public Phase 1

WP7~WP8. 공개 탐색, 승인된 콘텐츠, 저장과 제보를 무료 운영 안전장치와 함께 배포한다.

## 9. 범위 변경 규칙

구현 중 새 기능 요청이 생기면 다음 셋 중 하나로 분류한다.

1. Phase 1 완료에 필수: 관련 WP와 수용 기준에 추가
2. Phase 2/3 기능: 해당 단계 문서에 기록하고 현재 구현에서 숨김
3. 운영 가설: 사용량 증거를 모은 뒤 결정

새 기능을 현재 화면에 빈 버튼이나 `준비 중` 페이지로 먼저 추가하지 않는다.

## 10. 구현 시작 조건

다음이 확인되면 WP0부터 시작할 수 있다.

- 현재 문서 기준선 검토 완료
- 기존 dirty 변경의 소유권과 보존 확인
- 설치 시 필요한 네트워크 사용 가능
- Cloudflare 계정 연결은 WP7 전까지 필요하지 않음
- GitHub Actions 비밀값은 WP5 전까지 필요하지 않음

초기 로컬 구현에는 외부 계정이나 결제가 필요하지 않다.
