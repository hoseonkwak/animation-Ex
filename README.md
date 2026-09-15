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

| 분류 | 예시 |
|---|---|
| Technology | GSAP, CSS, JavaScript, Three.js, WebGL |
| Trigger | Load, Scroll, Hover, Click, Drag |
| Motion | Slide, Fade, Scale, Rotate, Morph, Reveal |
| Section | Hero, Gallery, Card, Navigation, Button |
| Technique | Mask, Parallax, Pin, Scrub, Stagger |
| Difficulty | Beginner, Intermediate, Advanced |
| Mood | Minimal, Dynamic, Cinematic, Playful |

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

기존 구현은 HTML, CSS와 JavaScript로 구성된 GSAP 예제 갤러리이며, 개별 상세 화면에서 CodePen을 불러와 실행합니다. 새 Vue 앱과 Cloudflare Worker API의 WP0 기반은 `apps/lab`에 분리했습니다.

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

### 로컬 실행

Node.js 24.12 이상이 필요합니다. 저장소의 `.nvmrc`는 검증한 Node 24.19.0을 지정합니다.

```bash
npm ci
npm run dev
```

기본 주소는 `http://localhost:5173`이며 Worker 상태 확인은 `/api/v1/health`에서 할 수 있습니다.

### 검증

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
```

Playwright 브라우저를 설치한 환경에서는 `npm run test:e2e`로 실제 Vue 화면과 Worker API를 함께 검증합니다.

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
