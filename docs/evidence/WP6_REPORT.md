# WP6 공개 화면 구현 결과

작성일: 2026-09-16

상태: 완료

## 구현 결과

- 기존 Explore를 `/explore`로 분리하고 실행형 라이브러리를 설명하는 Home을 추가했다.
- Light 기본, Dark 선택과 복원을 지원하는 공통 Header·Footer를 구현했다.
- 예제 상세에 실제 CodePen 실행, 재실행, 전체 화면, 원본, 제작자, 라이선스, 태그, 난이도, 관련 Pattern과 예제를 연결했다.
- 공개 예제가 있는 Section만 노출하고 Hero 등 Section 상세를 제공한다.
- 세 개의 Pattern과 Collection seed를 추가해 Home에서 탐색할 수 있게 했다.
- `저장한 예제`와 `나중에 연습`을 브라우저에 분리 저장하고 재시작 후 복원한다.
- URL 제보에 8KB 본문, URL·note 검증, Turnstile과 canonical 중복 비노출을 적용했다.
- About, 404, 410과 영역별 API·Preview 오류 상태를 구현했다.
- 공개 상세·Section만 포함하는 sitemap, robots, canonical, description과 Open Graph 메타데이터를 추가했다.
- Phase 1 Header에는 Practice와 Learn 진입점을 노출하지 않는다.

## 검증 증거

- 전체 Vitest 10개 파일, 46개 검사 통과
- Playwright E2E 14개 통과
- Home, Explore, 상세, Saved 재시작 복원, Sections, 중복 URL 제보, 404 noindex 검사
- 공개 Discovery, 제보 멱등 처리와 sitemap draft 제외 계약 검사
- TypeScript, ESLint, Prettier와 production build 통과
- 1440px 실제 브라우저에서 Home과 CodePen 실행 화면을 시각 점검하고 한글 제목 줄바꿈을 수정

로컬 E2E는 하나의 Miniflare D1 상태를 공유하므로 단일 worker로 직렬 실행한다. 병렬 실행에서 발생하던 D1 요청 정체를 제거하고 반복 실행 결과를 안정화했다.

## 운영 설정

- 로컬에서는 `LOCAL_ADMIN_SIMULATION=true`일 때 Turnstile 토큰 `local-test-token`을 사용한다.
- production에는 build 환경 변수 `VITE_TURNSTILE_SITE_KEY`와 Worker secret `TURNSTILE_SECRET_KEY`가 필요하다.
- 실제 production 배포와 Cloudflare Access·무료 한도 안전장치는 WP7 범위다.

## 다음 단계

WP7에서 local·preview·production D1을 분리하고 Access, 무료 한도 중지, 백업·복구와 배포 smoke test를 구현한다.
