# Phase 2 자체 제작 Kit 10개 로컬 구현 · 2026-10-29

상태: 로컬 fixture. Production 공개 및 Phase 2 완료 판정 전.

## 이번 추가 6개

| Entry | 자체 제작 동작 | 실행 라이브러리 |
| --- | --- | --- |
| `gsap-mouse-interaction` | 포인터 좌표에 따라 원 이동·확대, 중앙 복귀 | GSAP 3.15.0 |
| `gsap-dynamic-timeline` | 시작 간격을 둔 세 막대의 순차 등장 | GSAP 3.15.0 |
| `gsap-text-reveal` | 한국어 문구의 단어별 등장 | GSAP 3.15.0 |
| `gsap-rainbow-background` | 배경색 순환·일시 중지 | GSAP 3.15.0 |
| `gsap-text-drawing` | 자체 SVG 경로 그리기·문구 등장 | GSAP 3.15.0 |
| `gsap-scrolltrigger` | 실행 화면 내부 스크롤에 따른 카드 등장 | GSAP·ScrollTrigger 3.15.0 |

코드·문구·SVG 경로를 새로 작성했고 원본 CodePen 코드·독점 에셋을 가져오지 않았다. 라이브러리는 npm 고정 버전을 격리 Preview에 주입하며 원격 스크립트·이미지·폰트 없이 실행한다. 움직임 줄이기 설정은 각 Kit에서 중간 애니메이션을 건너뛴다.

## 결정적 검사

| 검사 | 결과 |
| --- | --- |
| `npm run test:contracts` | 50개 통과. 로컬 `ready` Kit 10건과 새 6건의 버전·권리 메타데이터 확인. 변형 Kit v1 보존과 v2 연결 확인 |
| `npm run test` | 118개 통과. 플러그인 허용 목록·CodePen 순서·Preview 주입 순서 확인 |
| `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run build` | 통과 |
| `npm run test:e2e` | Chromium 49개 통과. 10개 Kit 실제 실행·가로 잘림·동작·움직임 줄이기와 기존 초안 보호/새 버전 선택 포함 |
| WebKit 연습 검사 | `KWAK_CROSS_BROWSER=1`에서 연습 31개 전체 통과. 초기 색상 일시 중지 검사의 클릭 직후 측정은 렌더링 갱신 후 측정으로 고쳐 재실행 |
| `npm run verify:deploy:preview` | Worker·Client 빌드와 Preview binding dry-run 통과. 원격 쓰기는 수행하지 않음 |
| Preview D1 읽기 | `wrangler d1 list --json`으로 Preview DB 존재 확인. `wrangler d1 execute ... --remote --env preview --command "SELECT COUNT(*) ..."`는 Cloudflare API 7403으로 실패. Kit seed·배포는 진행하지 않음 |

## 에이전트 화면 검수

1280×800과 390×844에서 10개 Kit의 실제 iframe 화면 20장을 캡처해 보았다. 변형 Kit의 `도착` 라벨이 움직인 원과 겹치는 문제를 발견해, 기존 `practice-basic-transform-v1`은 보존하고 라벨 위치를 고친 `v2`를 새 진입에 연결했다. 수정 후 두 화면 크기에서 겹침이 사라졌고, 결정적 가로 넘침 검사도 통과했다. 이 검수는 소유자의 콘텐츠 승인이나 모든 확대·보조 기술 환경의 확인을 대신하지 않는다.

## 남은 공개 게이트

- 이번 10건의 화면·키보드·축소·권리 정보를 사람이 검수하고 결과를 기록한다. 자동 검사는 미적 유사성과 권리 판단을 대신하지 않는다.
- Firefox, 모바일 확대, 저장 용량 한계, 오래된 실행 로그, CodePen 실제 수신과 운영 smoke·롤백을 검증한다. 이 Windows 환경의 Playwright Firefox 실행 파일은 앱 시작 전에 side-by-side configuration 오류로 종료되어 브라우저 검사가 실행되지 않았다. 제품 실패로 계산하지 않고 다른 실행 환경에서 재검증한다.
- Preview D1의 원격 조회 7403 원인을 확인하고 나서만 Preview에 Kit을 입력한다. Wrangler OAuth 로그인과 D1 목록은 정상이지만 query API는 거절됐다. 권한 또는 서비스 상태 중 무엇이 원인인지는 아직 확정하지 않았다.
- Production에는 아직 seed하지 않는다. `ready`는 로컬 fixture 상태이며 운영 공개 승인 근거가 아니다.
