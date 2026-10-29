# Phase 2 GSAP Kit 추가 묶음 · 2026-10-29

상태: 로컬 구현 검증. Production 공개 및 Phase 2 완료 판정 전.

## 자체 제작 시작 코드

| 연결된 공개 Entry | Kit 버전 | 동작 |
| --- | --- | --- |
| `gsap-basic-transform` | `practice-basic-transform-v1` | 원의 위치와 크기를 함께 변경하고 다시 실행 |
| `gsap-from-fromto-timeline` | `practice-from-fromto-timeline-v1` | `from`, `fromTo`, 타임라인의 순차 등장과 다시 실행 |

HTML, CSS, JavaScript와 화면 문구를 새로 작성했다. 원본 CodePen 코드·에셋을 가져오지 않았다. 두 Kit은 로컬에 묶인 `gsap@3.15.0`을 격리 Preview에서 실행하며, 원격 스크립트·이미지·폰트를 요청하지 않는다. 움직임 줄이기 설정에서는 중간 애니메이션 없이 최종 상태를 표시한다.

후속 화면 캡처에서 변형 Kit v1의 라벨 겹침을 발견했다. 불변 코드 본문을 수정하지 않고 v2를 추가해 새 Kit 진입점에 연결했다. 상세 내용은 `PHASE2_TEN_KITS_2026-10-29.md`에 기록했다.

## 결정적 검사

| 검사 | 결과 |
| --- | --- |
| `npm run typecheck`, `npm run lint`, `npm run format:check` | 통과 |
| `npm run test:contracts` | 48개 테스트 통과. 두 Kit의 Entry·버전·라이브러리 계약 확인 |
| `npm run test` | 113개 테스트 통과 |
| `npm run build` | Worker·Client 빌드 통과 |
| `npm run test:e2e` | 격리 D1 기반 Chromium 40개 시나리오 통과 |

브라우저 검사는 시작 코드 진입, 실제 GSAP 실행, 다시 실행, CodePen payload, 초안 복원과 움직임 줄이기를 다룬다. 테스트가 화면의 미적 품질이나 원본과의 패턴 유사성을 판정하지는 않는다.

## 남은 게이트

- Practice Ready Kit 목표 10개 중 로컬 fixture 4개. 추가 6개가 필요하다.
- Kit별 시각·권리 검수, 다른 브라우저·화면 확대·키보드 흐름과 운영 smoke·롤백 증거가 필요하다.
- Production seed 명령은 이 fixture를 포함하지 않는다.
