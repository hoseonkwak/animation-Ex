# Phase 2 자체 제작 Kit 10개 구현·Preview 검증 · 2026-10-29

상태: 로컬·Preview 검증. Production 공개 및 Phase 2 완료 판정 전.

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
| `npm run test:contracts` | 51개 통과. 로컬 `ready` Kit 10건, 목록 필터, 새 6건의 버전·권리 메타데이터와 변형 Kit v1 보존/v2 연결 확인 |
| `npm run test` | 119개 통과. 플러그인 허용 목록·CodePen 순서·Preview 주입 순서 확인 |
| `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run build:preview` | 통과 |
| `npm run test:e2e` | 최신 변경에서 Chromium 52개 통과. 10개 Kit 실제 실행·가로 잘림·동작·움직임 줄이기, 기존 초안 보호/새 버전 선택, Practice 홈의 Kit 목록·모바일 진입 포함 |
| WebKit 연습 검사 | `KWAK_CROSS_BROWSER=1`에서 연습 31개 전체 통과. 초기 색상 일시 중지 검사의 클릭 직후 측정은 렌더링 갱신 후 측정으로 고쳐 재실행 |
| WebKit Practice 홈 검사 | Kit 10건·모바일 진입 대상 1개 통과 |
| Linux Firefox CI | [Actions 실행 #7](https://github.com/hoseonkwak/animation-Ex/actions/runs/40808666295)에서 최신 코드의 연습 34개 전부 통과. Windows의 Firefox 실행 파일 오류를 Linux 실행으로 분리해 검증 |
| 좁은 화면·다운로드 격리 추가 검사 | 320px 작업 공간의 가로 넘침 없음과 sandbox iframe의 다운로드 차단을 로컬 Chromium·WebKit 및 Linux Firefox에서 확인. 320px 검사는 배포된 Preview Chromium에서도 통과 |
| CodePen 새 창 복구 안내 | 내보내기 클릭 뒤 새 창이 안 열렸을 때 확인할 안내와 복사 가능한 현재 코드 경로를 추가. POST payload·안내·복사 경로는 로컬 Chromium·WebKit에서 확인. CodePen 서비스의 실제 수신은 아직 확인 전 |
| 이전 실행 로그 폐기 | 700ms 뒤 출력하는 이전 iframe을 새 실행으로 교체하고 800ms 뒤 Console에 이전 로그가 없는지 로컬 Chromium·WebKit 및 배포된 Preview Chromium에서 확인 |
| `npm run verify:deploy:preview` | Worker·Client 빌드와 Preview binding dry-run 통과 |

## 에이전트 화면 검수

1280×800과 390×844에서 10개 Kit의 실제 iframe 화면 20장을 캡처해 보았다. 변형 Kit의 `도착` 라벨이 움직인 원과 겹치는 문제를 발견해, 기존 `practice-basic-transform-v1`은 보존하고 라벨 위치를 고친 `v2`를 새 진입에 연결했다. 수정 후 두 화면 크기에서 겹침이 사라졌고, 결정적 가로 넘침 검사도 통과했다. 이 검수는 소유자의 콘텐츠 승인이나 모든 확대·보조 기술 환경의 확인을 대신하지 않는다.

Practice 홈에 10개 실제 코드 실행 화면을 썸네일로 넣었다. 데스크톱·모바일 전체 화면을 다시 캡처해 비어 보이던 CodePen 원격 썸네일을 로컬 이미지로 교체하고, 연습 행동 버튼을 카드 폭에 맞게 정리했다. 로컬 썸네일이 없는 향후 Kit은 원본 CodePen 이미지와 제목 대체 화면으로 순서대로 내려간다.

## Preview 배포와 복구 증거

- Preview D1을 `.wrangler/preview-before-phase2-2026-10-29.sql`로 백업했다. 이 파일은 Git에서 제외된 로컬 운영 백업이다.
- 첫 원격 query는 Cloudflare API 7403이었지만, 재조회에서 실제 상태인 `no such table: practice_kits`를 확인했다. 미적용 0013·0014 migration을 적용했고, 대상 공개 Entry 10건의 ID·상태를 읽기 전용으로 확인했다.
- `practice_phase2.sql`을 Preview D1에 적용했다. 22개 SQL 명령이 성공했고 `practice_kits.status='ready'` 10건을 재조회했다.
- Preview Worker 최초 검증 버전 `f71b374f-41ed-4d57-8acf-a3e0295e549a`에서 공개 Practice Kit API 10건의 버전·라이브러리, `practiceReady=true` 목록 10건과 로컬 썸네일 10개의 HTTP 200을 확인했다.
- Firefox 회귀 검사에서 초안 로드 직후 예약된 불필요한 재실행을 찾아 Vue 반응성 갱신이 끝난 뒤 실행 준비 상태로 전환했다. 차단된 팝업에 Firefox가 예외를 던지는 동작도 테스트에 반영했다. 수정본 Preview Worker `e91344a2-da67-4e06-b438-d6510ef58745`를 배포하고 smoke 5개와 배포 URL의 색상 멈추기·격리 브라우저 검사 2개를 통과했다.
- CodePen 새 창 복구 안내를 포함한 최종 Preview Worker `a6a2d47f-b5f8-4316-9e55-5454e15e2532`를 배포했다. smoke 5개와 배포 URL의 CodePen POST·안내·코드 복사 브라우저 검사가 통과했다.
- `smoke:preview`의 health, 공개 목록, robots 차단, 비로그인 홈, 관리자 비인증 차단 5개가 통과했다. 배포된 URL의 Chromium 연습 검사 31개와, 홈 목록·모바일 진입 대상 1개가 통과했다.
- Preview의 `practice-basic-tween` Kit을 잠시 `paused`로 바꿨을 때 공개 API는 404를 반환했다. 즉시 `ready`로 복구하니 200을 반환했다. Production D1은 변경하지 않았다.

## 남은 공개 게이트

- 이번 10건의 화면·키보드·축소·권리 정보를 사람이 검수하고 결과를 기록한다. 자동 검사는 미적 유사성과 권리 판단을 대신하지 않는다.
- 모바일 확대, 저장 용량 한계와 CodePen 실제 수신을 검증한다. 2026-10-29에 Preview에서 샘플 코드를 담아 실제 Chromium으로 전송했을 때 새 창은 열렸으나 CodePen의 Cloudflare `Just a moment...` 확인 화면에서 멈췄다. 직접 HTTP POST도 403을 반환했다. 편집기에 코드가 반영됐다는 증거는 아직 없으며 `PHASE2_OPERATIONS.md`의 일반 브라우저 절차가 필요하다.
- Production에는 아직 seed하지 않는다. Preview의 `ready`와 운영 리허설은 소유자의 콘텐츠 승인 및 Production 출시 근거를 대신하지 않는다.
