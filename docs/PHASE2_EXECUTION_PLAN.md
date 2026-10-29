# Phase 2 · Practice 실행 계획

문서 상태: 구현 진행 v0.2
목적: `PHASE2_PRACTICE_SPEC.md`를 검토 가능한 작은 구현 단위와 수용 증거로 나눈다.

## 구현 순서

| 단계 | 결과물 | 통과 증거 |
| --- | --- | --- |
| P2-0 · 실행 경계 | 불투명 Preview 출처, CSP·sandbox·메시지 계약, 위협 모델, 실패 코드 | 교차 출처·권한·메시지 계약 검사. 앱 저장 데이터와 관리자 API 접근 불가 |
| P2-1 · 한 예제 수직 절편 | 예제 상세 → Practice URL → HTML/CSS/JS 편집 → Run → 실제 Preview | 데스크톱·모바일 Playwright에서 코드 변경이 실행 화면에 반영 |
| P2-2 · 안전한 자동 실행 | 입력 지연, 새 iframe 교체, Console, 시간 초과, 연속 환경 실패 시 수동 전환 | 오래된 실행 결과 폐기·오류 격리·복구 검사 |
| P2-3 · 브라우저 초안 | IndexedDB 저장, 새로고침 복원, 최근 연습, Kit 버전 유지, 마지막 정상 코드·초기화 | 실행 전 저장·재시작 복원·저장 실패·복구 검사 |
| P2-4 · 출처와 내보내기 | 원본 참고 Embed, 빈 코드 연습, CodePen prefill, 출처·라이선스 고지 | 원본 코드 미복사·외부 전송은 클릭 후에만 수행·팝업 실패 복구 검사 |
| P2-5 · 콘텐츠와 공개 | 검증된 Practice Kit 10개, 공개 진입점, 운영 점검·롤백 | Kit별 Practice Gate, 공개 URL smoke, Phase 2 수용 체크리스트 |

P2-1은 빈 기본 코드의 로컬 실행 흐름부터 검증하고 자체 제작 Kit fixture를 이어서 추가한다. D-047에 따라 Kit 없는 원본 Pen에도 빈 코드 연습을 제공하되 `practice-ready`로 표시하지 않는다. P2-5에서 10개 Kit을 채우되 수량을 위해 권리·실행 검사를 우회하지 않는다. Preview 운영은 무료 범위를 우선하고 실제 사용량과 한도를 확인한 뒤 확장한다.

### 2026-10-29 구현 상태

| 단계 | 현재 상태 | 남은 게이트 |
| --- | --- | --- |
| P2-0 | `srcdoc` 불투명 출처, CSP, 실행 ID 메시지, API iframe 탐색 403, 상위 이동·폼·팝업·파일 다운로드 차단을 Chromium·WebKit·Linux Firefox에서 검증 | 긴 실행의 실제 제한 검증 |
| P2-1 | 빈 코드 초안에서 편집·Run·Preview, 데스크톱 폭 조절과 모바일 탭 구현. 자체 제작 Kit 10건의 로컬 실행, Dark·reduced motion 검증. Kit API 장애 시 오류 안내와 같은 예제의 빈 코드 연습 복구. Practice 홈에서 Kit 목록·썸네일·직접 시작 제공. 320px 너비에서 편집기·Run·Preview 가로 잘림 없음 확인 | 전체 키보드·실제 브라우저 확대 점검 |
| P2-2 | 입력 지연 자동 실행, iframe 교체, Console 상한, heartbeat·시간 초과 구현. 연속 환경 실패 3회 중지·정상 실행 복구와 50개/500자 Console 제한을 Chromium에서 검증 | 오래된 실행 로그와 코드 오류의 브라우저 회귀 검사 |
| P2-3 | IndexedDB 초안, 이름·새로고침 복원, 최근 목록, 초기화 전 복구 스냅샷과 손상·저장 실패 상태를 Chromium에서 검증. 화면 설정 localStorage가 막혀도 초안 편집·실행 유지. 같은 예제 재진입 때 기존 초안 이어가기/새 초안 생성 선택. Kit 시작 코드와 버전 ID를 초안에 고정 | 실제 용량 한계와 Kit 변경 후 기존 초안 보호의 전체 브라우저 검증 |
| P2-4 | 원본 참고 Embed를 별도 클릭 때 로드하고 닫으면 제거, 빈 코드 진입, CodePen POST prefill, 수동 코드 복사 제공 | CodePen 실제 수신·팝업 실패 UX 및 권리 고지 점검 |
| P2-5 | D1 0014 migration, 공개 읽기 API, 자체 제작 Kit 10건과 GSAP/ScrollTrigger 고정 실행 정책. Chromium 50개, WebKit 연습 31개, Linux Firefox 연습 34개 통과. Preview D1 백업·migration·Kit 10건 적용, Worker 배포와 공개 API·브라우저 smoke 및 Kit 중지·복구 리허설 완료 | 사람의 Kit별 시각·권리 검수, 화면 확대·CodePen 실제 수신·저장 용량 검증과 Production 출시 증거 |

첫 구현 증거는 `evidence/PHASE2_PRACTICE_SLICE_2026-10-27.md`에, GSAP 실행 환경 증거는 `evidence/PHASE2_GSAP_KIT_2026-10-29.md`에, Kit 묶음은 `evidence/PHASE2_GSAP_KITS_BATCH_2026-10-29.md`와 `evidence/PHASE2_TEN_KITS_2026-10-29.md`에 기록한다. 배포 순서와 중지·복구는 `PHASE2_OPERATIONS.md`를 따른다. 위 구현 상태는 Phase 2 완료 판정이 아니다.

## 구현 전 확정할 계약

1. Preview 출처와 로컬 개발 대응, iframe sandbox·CSP·허용 라이브러리 및 버전.
2. CodePackageVersion과 PracticeKit의 D1 migration, 공개 읽기 API, 버전 고정·권리 메타데이터.
3. IndexedDB 저장 형식과 migration, 저장 용량 초과·비공개 모드·초안 손상 복구.
4. 실행 메시지의 타입, 실행 ID, 타임아웃과 로그 상한.
5. CodePen prefill 변환 규칙과 라이선스 고지, 실패 시 사용자 코드 보존.

계약이 생길 때 `API_CONTRACT.md`, `D1_SCHEMA.md`, `CONTENT_SCHEMA.md`, `DATA_MODEL.md`, `QUALITY_GATES.md` 및 별도 Phase 2 위협 모델을 갱신한다. 기존 Phase 1 공개 Pen Embed의 권한을 자체 코드 실행 환경에 복사하지 않는다.

## Phase 2 수용 기준

- [ ] `P2-ENTRY-01` 예제 상세·나중에 연습·Practice 홈에서 독립 URL의 작업 공간에 들어가고 새로고침 후에도 돌아온다.
- [ ] `P2-ENTRY-02` Kit 없는 원본 Pen은 빈 기본 코드로 시작하며 원본은 출처가 표시된 실제 Embed로만 참고한다.
- [ ] `P2-CODE-01` HTML·CSS·JS 수정, 자동 실행 끄기, Run, 초기화와 전체 화면이 동작한다.
- [ ] `P2-CODE-02` 코드 오류·환경 오류·시간 초과가 구분되고 Console·복구 경로를 제공한다.
- [ ] `P2-SAVE-01` 실행 전에 코드가 브라우저에 저장되고 새로고침·재방문 후 복원된다.
- [ ] `P2-SAVE-02` 저장 실패와 Kit 버전 변경 시 사용자 코드를 조용히 잃거나 덮어쓰지 않는다.
- [ ] `P2-EXPORT-01` 사용자가 클릭할 때만 현재 코드를 CodePen으로 내보내며 실패해도 초안을 유지한다.
- [ ] `P2-SEC-01` 자체 코드가 앱과 다른 출처의 최소 권한 iframe에서 실행되고 관리자 API·쿠키·앱 저장 데이터에 접근할 수 없다.
- [ ] `P2-SEC-02` 오래된 실행 메시지, 과도한 로그, 응답 없는 실행을 제한하고 Preview를 재생성할 수 있다.
- [ ] `P2-UX-01` 데스크톱 분할·모바일 탭·키보드 조작·Light/Dark·reduced motion을 검증한다.
- [ ] `P2-CONTENT-01` 권리·출처·실행·복구·내보내기가 확인된 Practice Ready Kit 10개가 있다.
- [ ] `P2-OPS-01` 배포 smoke, 오류 관찰, 중지·롤백 절차가 문서화되고 미구현 Phase 3 미션은 보이지 않는다.

## 검증 방법

- 계약·단위 검사: CodePackage/Kit schema, 저장 migration, 메시지 무시, 실행 상태 전이, CodePen payload.
- Playwright: 진입·수정·실행·새로고침·복구·모바일 탭·키보드·외부 전송 제어.
- 보안 검사: 직접 API 접근·쿠키/저장소 접근·상위 이동·팝업·폼·다운로드 차단과 CSP 확인.
- 운영 검사: Preview 출처 장애, CodePen 실패, 저장 공간 부족, 외부 라이브러리 장애를 각각 재현한다.

각 단계의 결정적 검사와 사람이 확인한 실행 화면은 `docs/evidence/`에 분리해 기록한다. 체크리스트에 표시만 하는 것으로 Phase 2를 완료로 판정하지 않는다.
