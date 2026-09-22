# Kwak Motion Lab

웹 애니메이션을 찾고, 실제 코드로 실행하고, 직접 수정하며 학습하는 한국어 애니메이션 라이브러리입니다.

기존 정적 HTML 기반 GSAP 예제 모음을 보존한 채, `apps/lab`에서 Vue 기반 **Kwak Motion Lab** 리뉴얼을 구현하고 있습니다.

## 프로젝트가 해결하려는 문제

웹에서 좋은 애니메이션을 발견해도 다시 찾기 어렵고, 이미지나 영상만으로는 실제 동작과 코드를 확인하기 어렵습니다.

Kwak Motion Lab은 다음 경험을 한곳에서 제공하는 것을 목표로 합니다.

```text
찾기 → 실제 코드로 실행 → 코드 확인 → 직접 수정 → 원리 학습 → CodePen 저장
```

## 핵심 원칙

- 공개되는 모든 애니메이션은 실제 코드로 실행합니다.
- 이미지, GIF와 녹화 영상으로 실행 화면을 대신하지 않습니다.
- GSAP, Scroll, Hero, Slider 등 여러 분류를 조합해 탐색할 수 있게 합니다.
- 일반 웹 사례는 모션 패턴을 분석하고 코드와 샘플 에셋을 새로 제작합니다.
- 모든 사용자 기능은 로그인 없이 이용할 수 있게 시작합니다.
- 콘텐츠와 실행 코드의 원본은 서비스 내부에서 관리합니다.
- CodePen은 원본 Pen 표시, 외부 편집, Fork, 저장과 공유에 사용합니다.
- 자동 수집과 코드 생성 과정은 검증을 통과한 결과만 공개합니다.
- Phase 1은 월 고정비 없이 운영하며 사용량이 커진 뒤 유료 전환을 검토합니다.

## 주요 기능

### Explore

- 키워드 및 자연어 검색
- Technology, Trigger, Motion, Section과 Technique 필터
- 실제 코드가 실행되는 미리보기 카드
- 최신, 추천, 난이도와 학습 상태별 탐색

### Sections

애니메이션을 적용할 웹페이지 영역을 기준으로 탐색합니다.

- Hero
- Navigation
- Gallery
- Slider
- Card
- Button
- Text
- Loading
- Background

### Practice

- HTML, CSS와 JavaScript 편집
- 격리된 Preview에서 보호된 자동 실행
- 자유 연습과 단계별 미션
- 브라우저 임시 저장과 오류 복구
- CodePen으로 내보내기

### Learn

- 모든 예제의 짧은 구현 분석
- 선별된 예제의 단계별 튜토리얼
- 난이도, 기술과 구현 패턴별 학습
- 자동 미션 판정과 단계별 힌트

### Personal

- 북마크
- 나중에 연습
- 최근 연습과 작성 코드 복원
- 로그인 없는 브라우저 저장

## 콘텐츠 수집

다음 경로에서 애니메이션 후보를 확보합니다.

1. 관리자가 URL 직접 등록
2. WSSS 등 지정 출처 정기 순회
3. 일반 웹 자동 검색
4. 사용자의 로그인 없는 URL 제보

초기 핵심 출처에는 [WSSS](https://wsss.tistory.com/), CodePen, GSAP Showcase, Awwwards와 Godly가 포함됩니다.

후보 수집량은 최대화하되 실행 가능한 코드가 없는 콘텐츠는 공개하지 않습니다. 품질 점수는 수집 여부가 아니라 코드 생성과 튜토리얼 제작의 우선순위를 정하는 데 사용합니다.

## 자동화 흐름

```text
Discovery
→ Extraction
→ Deduplication
→ Classification
→ Code Generation
→ Static Validation
→ Runtime Validation
→ Human Review
→ Publishing
→ Monitoring
```

초기에는 관리자가 승인한 콘텐츠만 공개합니다. 충분한 검증 이력과 운영 데이터가 쌓인 뒤 신뢰할 수 있는 출처와 결과부터 조건부 자동 공개로 발전시킵니다.

## 콘텐츠 분류

| 분류       | 예시                                      |
| ---------- | ----------------------------------------- |
| Technology | GSAP, CSS, JavaScript, Three.js, WebGL    |
| Trigger    | Load, Scroll, Hover, Click, Drag          |
| Motion     | Slide, Fade, Scale, Rotate, Morph, Reveal |
| Section    | Hero, Gallery, Card, Navigation, Button   |
| Technique  | Mask, Parallax, Pin, Scrub, Stagger       |
| Difficulty | Beginner, Intermediate, Advanced          |
| Mood       | Minimal, Dynamic, Cinematic, Playful      |

## 출시 계획

### Phase 1 · Executable Library

- Vue 기반 사용자 사이트
- 기존 GSAP 예제 이전
- WSSS 관련 CodePen 수집
- 실행형 카드와 상세 화면
- 검색, 태그, 필터와 Hero 컬렉션
- 관리자 승인과 기본 검증

### Phase 2 · Practice

- 자체 코드 편집기
- 격리된 자동 실행
- 자유 연습
- 브라우저 저장
- CodePen 내보내기

### Phase 3 · Generation and Learning

- 일반 웹 애니메이션 분석
- 실행 코드 자동 생성과 검증
- 단계별 미션
- 튜토리얼 생성

### Phase 4 · Automated Operation

- 지정 출처 정기 순회 확대
- 일반 웹 자동 발견
- 조건부 자동 승인과 공개
- 사용자 요청 기반 제작 우선순위

## 현재 저장소

기존 구현은 HTML, CSS와 JavaScript로 구성된 GSAP 예제 갤러리이며, 개별 상세 화면에서 CodePen을 불러와 실행합니다. 새 Vue 앱과 Cloudflare Worker API의 WP0~WP6 구현은 `apps/lab`에 분리했습니다. Home, Explore, 상세, Sections, Saved, URL 제보, 기존 예제 15개, owner 관리자 검수와 WSSS 후보 수집 흐름이 동작합니다.

```text
animation-Ex/
├─ apps/lab/              Vue 3 + Worker 애플리케이션
├─ index.html
├─ css/
├─ js/
├─ images/
├─ pages/animation/gsap/
└─ docs/
```

## 실행 방법

### 1. 준비 사항

- Node.js 24.12 이상
- npm 10 이상
- Git

저장소의 `.nvmrc`에는 현재 검증 버전인 Node 24.19.0이 지정되어 있습니다. nvm-windows를 사용한다면 다음 명령으로 버전을 맞춥니다.

```powershell
nvm install 24.19.0
nvm use 24.19.0
node --version
```

`node --version` 결과가 `v24.19.0`이거나 24.12 이상의 버전인지 확인합니다.

### 2. 의존성 설치

저장소 루트에서 실행합니다.

```bash
npm ci
npm run db:setup:local
```

`npm ci`는 `package-lock.json`에 기록된 버전을 그대로 설치합니다. 의존성을 변경하는 작업이 아니라면 `npm install`보다 `npm ci`를 사용합니다.

`db:setup:local`은 0001~0010 migration을 로컬 D1에 적용하고 공개·검수·수집 fixture를 넣습니다. 0008에는 기존 GSAP 공개 예제 15개가, `wp4.sql`에는 관리자 검수용 실제 CodePen 후보가, `wp5.sql`에는 WSSS 발견 출처와 수집 태그가, `wp6.sql`에는 공개 Pattern과 Collection이 포함됩니다. 이미 적용한 migration과 seed는 다시 실행해도 중복 데이터를 만들지 않습니다.

처음 한 번 `apps/lab/.dev.vars.example`을 `apps/lab/.dev.vars`로 복사합니다. `.dev.vars`는 Git에서 제외되며 로컬 관리자와 수집 서명 모의 값만 담습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 준비되면 다음 주소를 사용합니다.

| 용도             | 주소                                    |
| ---------------- | --------------------------------------- |
| Home             | `http://localhost:5173`                 |
| Explore          | `http://localhost:5173/explore`         |
| Sections         | `http://localhost:5173/sections`        |
| Saved            | `http://localhost:5173/saved`           |
| URL 제보         | `http://localhost:5173/submit`          |
| Worker 상태 확인 | `http://localhost:5173/api/v1/health`   |
| 공개 예제 API    | `http://localhost:5173/api/v1/examples` |
| 관리자 검수      | `http://localhost:5173/admin/review`    |

URL 제보는 로컬에서 `local-test-token`으로 Turnstile을 모의합니다. production build에는 `VITE_TURNSTILE_SITE_KEY`, Worker secret에는 `TURNSTILE_SECRET_KEY`를 설정해야 제보 폼을 사용할 수 있습니다.

Vue 파일과 Worker 코드를 수정하면 개발 서버가 변경 사항을 자동으로 반영합니다. 로컬 관리자 화면은 `owner@local.test` 신원을 모의하며 production에서는 Cloudflare Access 신원과 `ADMIN_EMAIL`이 모두 일치해야 합니다. 서버를 종료할 때는 실행 중인 터미널에서 `Ctrl+C`를 누릅니다.

### 4. Production build와 미리보기

```bash
npm run build
npm run preview
```

빌드 결과는 `apps/lab/dist`에 생성됩니다. `preview`는 production build 결과를 로컬에서 확인할 때 사용합니다.

### 5. 코드 품질 검사

| 명령                               | 검사 내용                            |
| ---------------------------------- | ------------------------------------ |
| `npm run format:check`             | Prettier 형식 검사                   |
| `npm run typecheck`                | Vue와 Worker TypeScript 검사         |
| `npm run lint`                     | ESLint 정적 검사                     |
| `npm run test`                     | Vitest 단위 테스트                   |
| `npm run test:contracts`           | API 계약 테스트                      |
| `npm run test:ingestion`           | 수집 파이프라인 테스트               |
| `npm run ingest:wsss:fixture`      | 저장된 최소 HTML로 parser 실행       |
| `npm run ingest:wsss:preflight`    | 현재 WSSS 한 건을 읽기 전용으로 점검 |
| `npm run ingest:wsss:live`         | 서명된 batch API로 후보 제출         |
| `npm run sync:cloudflare-usage`    | Cloudflare 일일 사용량 동기화        |
| `npm run test:e2e`                 | 실제 브라우저 E2E 테스트             |
| `npm run build`                    | production build 검사                |
| `npm run db:migrate:local`         | 로컬 D1 migration 적용               |
| `npm run db:seed:local`            | 로컬 D1 예제 데이터 입력             |
| `npm run db:setup:local`           | migration과 seed 순차 실행           |
| `npm run db:rehearse:restore`      | D1 export를 임시 새 D1에 복구 검증   |
| `npm run verify:deploy:preview`    | preview 환경과 D1 binding dry-run    |
| `npm run verify:deploy:production` | production 환경과 D1 binding dry-run |

환경별 빌드와 배포 절차, 무료 한도 중지와 복구는 [`docs/RUNBOOK.md`](docs/RUNBOOK.md)를 따릅니다.

일반적인 변경을 마친 뒤에는 다음 순서로 확인합니다.

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
```

### 6. WSSS 후보 수집

실제 출처를 순회하기 전에 fixture와 읽기 전용 사전 점검을 실행합니다.

```bash
npm run test:ingestion
npm run ingest:wsss:fixture
npm run ingest:wsss:preflight
```

후보를 서버로 제출할 때는 `apps/lab`에서 다음 환경 변수를 설정한 뒤 live 명령을 실행합니다.

- `INGESTION_API_URL`: 배포한 Worker 기준 URL
- `INGESTION_KEY_ID`: Worker의 `INGESTION_KEY_ID`와 같은 키 식별자
- `INGESTION_HMAC_SECRET`: Worker secret과 같은 HMAC 비밀값

```bash
npm run ingest:wsss:live -- --max-articles 50 --max-pages 1
```

GitHub Actions의 `WSSS ingestion` workflow도 같은 세 비밀값을 사용하며 현재는 수동 실행만 허용합니다. 수동 실행의 구조 변화, 속도 제한과 checkpoint 복구가 안정화된 뒤 하루 1회 일정을 활성화합니다.

Cloudflare 사용량은 `Cloudflare daily usage` workflow 또는 `npm run sync:cloudflare-usage`로 동기화합니다. Worker 요청 수와 D1 읽기·쓰기 행 수를 GraphQL Analytics에서 읽고 HMAC 인증 API를 통해 `daily_metrics`에 저장합니다. 필요한 변수와 비밀값은 [`docs/RUNBOOK.md`](docs/RUNBOOK.md)에 정리되어 있습니다.

### 7. Playwright E2E 실행

처음 한 번 Playwright용 Chromium을 설치합니다.

```bash
npx playwright install chromium
```

설치 후 다음 명령을 실행합니다.

```bash
npm run test:e2e
```

E2E 하네스는 Cloudflare 개발 서버를 자동으로 시작하고 테스트가 끝나면 종료합니다. 현재 실제 브라우저에서 다음 항목을 확인합니다.

- Vue 첫 화면 렌더링
- Worker의 `/api/v1/health` 응답
- 공개 Explore 검색·필터·Preview 회귀
- owner Candidate Inbox와 실제 CodePen Preview 확인
- 관리자 API의 인증 차단
- 상세 출처와 실제 CodePen 실행
- Saved·나중에 연습의 브라우저 재시작 복원
- Sections, URL 제보, 테마 복원과 404 noindex

Windows에 설치된 Chrome을 직접 사용하려면 PowerShell에서 실행 경로를 지정할 수 있습니다.

```powershell
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run test:e2e
```

### 8. 자주 발생하는 실행 문제

#### Node 버전 오류

Vite 또는 Vue가 Node 버전을 지원하지 않는다는 메시지가 나오면 `node --version`을 확인하고 Node 24.12 이상으로 전환합니다.

#### 5173 포트가 이미 사용 중인 경우

기존 `npm run dev` 프로세스를 종료한 뒤 다시 실행합니다. E2E 테스트는 5173 포트를 고정으로 사용하므로 같은 포트의 개발 서버가 남아 있으면 시작하지 못합니다.

#### Playwright 브라우저가 없다는 오류

```bash
npx playwright install chromium
```

위 명령으로 브라우저를 설치하거나 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`에 로컬 Chrome 경로를 지정합니다.

## 설계 문서

- [리뉴얼 제품 설계서](docs/RENEWAL_PRODUCT_SPEC.md)
- [결정 기록](docs/DECISIONS.md)
- [개념 아키텍처](docs/ARCHITECTURE.md)
- [개념 데이터 모델](docs/DATA_MODEL.md)
- [콘텐츠 스키마 계약](docs/CONTENT_SCHEMA.md)
- [사용자 경험 상세 명세](docs/UX_SPEC.md)
- [Phase 1 무료 운영 기술 설계](docs/PHASE1_TECHNICAL_DESIGN.md)
- [Phase 1 API 계약](docs/API_CONTRACT.md)
- [Phase 1 D1 스키마 설계](docs/D1_SCHEMA.md)
- [관리자 검수 화면 명세](docs/ADMIN_REVIEW_SPEC.md)
- [WSSS 수집 파이프라인 명세](docs/WSSS_INGESTION_SPEC.md)
- [디자인 시스템](docs/DESIGN_SYSTEM.md)
- [Phase 1 공개 화면 명세](docs/PUBLIC_SCREEN_SPEC.md)
- [Phase 1 실행 계획](docs/PHASE1_EXECUTION_PLAN.md)
- [WP0 구현 결과](docs/evidence/WP0_REPORT.md)
- [WP1 구현 결과](docs/evidence/WP1_REPORT.md)
- [WP2 구현 결과](docs/evidence/WP2_REPORT.md)
- [WP3 구현 결과](docs/evidence/WP3_REPORT.md)
- [WP4 구현 결과](docs/evidence/WP4_REPORT.md)
- [WP5 구현 결과](docs/evidence/WP5_REPORT.md)
- [WP6 구현 결과](docs/evidence/WP6_REPORT.md)
- [품질 게이트](docs/QUALITY_GATES.md)
- [Phase 1 완료 기준](docs/PHASE1_ACCEPTANCE.md)
- [하네스 확장 로드맵](docs/HARNESS_ROADMAP.md)

제품 요구사항과 주요 결정은 구현 과정에서도 위 문서를 기준으로 관리합니다.

## 콘텐츠 및 출처

- 일반적인 모션 패턴을 새 코드와 샘플 에셋으로 제작한 예제는 Kwak Motion Lab 콘텐츠로 표시합니다.
- 기존 CodePen을 실행하거나 공개 Pen의 코드를 활용하는 경우 원작자, 원본 Pen과 적용 라이선스를 표시합니다.
- 자동화 과정에서 확인한 원본과 발견 경로는 중복 방지와 감사 추적을 위해 내부에 보관합니다.

## License

프로젝트 자체 코드의 라이선스는 아직 정하지 않았습니다. 외부 CodePen과 에셋에는 각 원본의 라이선스가 적용됩니다.
