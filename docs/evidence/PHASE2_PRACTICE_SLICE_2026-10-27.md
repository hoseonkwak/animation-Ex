# Phase 2 자유 연습 첫 구현 증거 · 2026-10-27

상태: 로컬 구현 검증. 운영 공개 및 Phase 2 완료 판정 전.

## 구현한 흐름

- `/practice`의 새 연습·최근 초안, 이름 수정, 예제 상세 및 나중에 연습의 빈 코드 진입, 독립 초안 URL.
- HTML·CSS·JavaScript 편집, 저장 후 Run, 입력 지연 자동 실행, Console, 마지막 정상 코드, 초기화 전 복구 스냅샷.
- 데스크톱 35~65% 폭 조절, 모바일 코드/실행 탭. 모바일 코드 탭에서는 실행 iframe을 제거한다.
- `sandbox="allow-scripts"`의 불투명 출처 `srcdoc` 실행, CSP, 실행 ID별 메시지 검증, 앱 API의 iframe 탐색 403.
- 원본 참고 패널에서 `원본 실행 화면 보기`를 눌러야 Embed를 시작하고 닫으면 제거한다. 자체 코드를 CodePen POST prefill로 보내고, 새 창이 열리지 않을 때 파일별 코드를 직접 복사할 수 있다.
- 최신 공개 코드(`336a26d`)를 기준으로 별도 작업 트리에 통합했다. 이전 작업 폴더의 미커밋 변경은 그대로 보존했다.

## 결정적 검사

Node 24.19.0, 저장소 루트에서 실행했다.

| 검사 | 결과 |
| --- | --- |
| `npm run format:check` | 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm run test` | 21개 파일, 104개 테스트 통과 |
| `npm run test:contracts` | 6개 파일, 41개 테스트 통과 |
| `npm run build` | Worker와 Client 빌드 통과 |
| `playwright test tests/e2e/practice.spec.ts` | Chromium 14개 시나리오 통과 |

Playwright는 기존 로컬 서버와 로컬 D1에 연결하고, 테스트 과정에서 새 연습 초안만 브라우저 IndexedDB에 만들었다. `npm run test:e2e`는 로컬 D1을 초기화하는 스크립트이므로 실행하지 않았다.

CodePen POST 검사는 브라우저의 새 창 요청을 테스트 안에서 가로채 payload를 확인했다. 외부 CodePen으로 실제 전송해 성공 응답을 확인한 것은 아니다.

## 브라우저 확인 범위

- 빈 코드 연습 진입 → 코드 수정 → Run → 실행 화면 → 새로고침 후 복원. 초안 이름 변경과 최근 목록 반영.
- 모바일 탭 전환 시 Preview iframe 생성·제거, 데스크톱 폭 조절의 키보드 조작·복원.
- 초기화 전 코드 스냅샷, 새로고침 후 이전 코드 복구. 손상된 초안은 삭제하지 않고 오류로 표시.
- 저장 실패를 강제로 일으킨 뒤 자동 실행 중지, 현재 코드 복사와 저장 없는 일회 실행 확인.
- 부모 문서와 localStorage 접근 실패, 상위 이동·팝업·폼·`fetch` 차단, iframe의 앱 API 탐색 403 및 frame 표시 금지.
- CodePen 버튼을 누르기 전 POST가 없으며, 누른 뒤 현재 HTML이 prefill payload에 포함됨.
- 원본 참고 Embed는 두 번째 클릭 전까지 생성되지 않고 패널을 닫으면 제거됨.
- Preview가 세 번 연속 heartbeat를 보내지 않으면 자동 실행을 끄고, 정상 실행 후 장애 표시가 해제됨.
- Console은 최근 50개 메시지와 메시지당 500자만 표시됨.
- 화면 설정용 localStorage 읽기·쓰기가 막혀도 IndexedDB 초안 편집과 Run이 유지됨.

## 남은 검증과 구현

- 자체 제작 Practice Kit의 스키마·API·권리 메타데이터와 최소 10개 콘텐츠.
- 실제 저장 공간 한계와 오래된 실행 로그의 브라우저 검사.
- 다른 브라우저, 화면 확대, 키보드 전체 흐름, Light/Dark 및 reduced motion 확인.
- 원본 참고의 라이선스·Embed 전수 검사와 실제 CodePen prefill 수신 확인.
- Preview 자체 이동의 외부 GET 요청은 현재 브라우저 정책상 완전히 차단하지 못한다. `PHASE2_PREVIEW_THREAT_MODEL.md`의 잔여 위험과 공개 게이트를 유지한다.

위 항목이 해결되기 전에는 `PHASE2_EXECUTION_PLAN.md`의 Phase 2 완료 체크를 표시하지 않는다.
