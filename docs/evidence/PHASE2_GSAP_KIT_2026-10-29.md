# Phase 2 GSAP Kit 로컬 검증 · 2026-10-29

상태: 로컬 구현 검증. Production 공개와 Phase 2 완료 판정 전.

## 변경

- `gsap-basic-tween`에 자체 제작 시작 코드를 추가했다. 이동·회전과 다시 실행 버튼을 포함하며 원본 Pen의 코드·이미지·SVG는 사용하지 않았다.
- `gsap@3.15.0`을 고정 설치했다. API의 `libraries` 허용 목록, IndexedDB 초안, 격리 Preview, CodePen prefill이 같은 버전을 사용한다. Preview는 로컬에 묶인 스크립트를 사용하고 네트워크 연결은 차단한다.
- 움직임 줄이기 설정에서는 트윈을 재생하지 않고 최종 상태를 표시한다. 빈 코드 연습에는 GSAP을 넣지 않는다.
- E2E 실행기가 매번 별도 임시 D1 상태를 사용하게 했다. 기존 개발용 로컬 D1의 후보·예제 데이터가 테스트 결과에 섞이지 않는다.

## 결정적 검사

Node 24.19.0으로 저장소 루트에서 실행했다.

| 검사 | 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm run format:check` | 통과 |
| `npm run test` | 22개 파일, 111개 테스트 통과 |
| `npm run test:contracts` | 7개 파일, 46개 테스트 통과 |
| `npm run build` | Worker·Client 빌드 통과 |
| `npm run test:e2e` | 격리 D1 기반 Chromium 37개 시나리오 통과 |

계약 검사에서 공개 Kit의 고정 라이브러리 값과 허용하지 않은 라이브러리 거부를 확인했다. 브라우저 검사는 실제 GSAP 실행, 초안 복원, CodePen 전송 데이터의 버전 일치와 움직임 줄이기 동작을 확인한다. CodePen 전송은 테스트에서 요청을 가로채 payload를 확인했으며, 외부 서비스의 실제 수신 결과는 아직 검증하지 않았다.

## 남은 출시 게이트

- Practice Ready Kit 8개 추가와 Kit별 권리·시각·실행 확인.
- 다른 브라우저, 화면 확대와 키보드 전체 흐름, 저장 용량 한계, 외부 CodePen 실제 수신, 운영 smoke·롤백 증거.
- `PHASE2_PREVIEW_THREAT_MODEL.md`의 iframe 자체 이동 잔여 위험 검증.

이 문서는 에이전트가 만든 코드와 결정적 자동 검사 결과를 기록한다. 사람이 확인한 시각·권리 검수 또는 Production 동작 증거로 취급하지 않는다.
