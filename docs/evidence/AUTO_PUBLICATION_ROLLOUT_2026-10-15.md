# 자동 공개 작은 묶음 배포·검증

검증일: 2026-10-15 (한국 시간)

## Production 적용

- D1 SQL export를 `apps/lab/.wrangler/auto-publication-before-2026-10-15.sql`에 저장한 뒤 `0012_auto_publication.sql`을 Preview와 Production에 적용했다. 이 파일은 Git 추적 대상이 아니며 복구 전용이다.
- Preview 앱 Worker 버전 `ef85ffdb-22ad-40f5-a50c-da36390f1d96`, Production 앱 Worker 버전 `2d622758-0786-4d47-8152-dff6edf71721`을 배포했다.
- Production 예약 Worker `kwak-motion-lab-auto-publication` 버전 `67fbe704-4910-4e7e-afd4-ab161453c8e0`을 배포했다. Cron은 UTC 02:17, 한국 시간 11:17이다. 공개 HTTP 주소는 없다.
- Production 공개 health는 HTTP 200, 인증 없는 자동 공개 관리자 API는 401이었다. 실제 GitHub owner 세션의 관리자 화면에서 `자동 공개`와 `예약 검사 재개` 버튼이 나타나는 것을 확인했다.
- D1에서 예약 검사 스위치를 `paused=0`으로 설정했다. 이 시점의 `auto_publication_batches`와 `auto_publication_runs`는 모두 0행이다. 표본 승인 전 자동 게시도 0건이다.

## 브라우저 검사 교정 표본

이미 정상 동작이 알려진 양성 대조군이 통과한 원격 Browser Run 세션에서 `Animation/GSAP` 수집 후보 4개를 읽기 전용으로 검사했다. 각 후보의 Embed와 내부 Result가 200, 충분한 DOM, 초기·후기 두 구간의 화면 변화, 페이지 오류 0이었다.

| CodePen                  | Result 요소 | 본문 길이 | 두 구간 변화 | 페이지 오류 |
| ------------------------ | ----------: | --------: | ------------ | ----------: |
| `georgedoescode/qBqLrGG` |          22 |     3,199 | 둘 다 있음   |           0 |
| `Sicontis/oNbgjda`       |         107 |    42,882 | 둘 다 있음   |           0 |
| `petebarr/JjPKrqg`       |          35 |     6,140 | 둘 다 있음   |           0 |
| `petebarr/dyyLEwB`       |          40 |     4,120 | 둘 다 있음   |           0 |

이는 검사기가 실제 움직임을 관측했다는 근거이며, 네 예제의 내용·사용성 품질을 사람이 승인했다는 뜻은 아니다. 스크롤·호버·클릭형과 애매한 결과는 자동 통과시키지 않는다.

## 격리 로컬 D1 리허설

`tools/browser-run-probe/auto-wrangler.local.jsonc`의 별도 D1에서 전체 migration 12개를 적용하고 `fixtures/local-release.sql`로 표본 승인 상태와 후보 2개를 준비했다.

1. 로컬 예약 호출 1회: 두 후보가 `animation_entries.status=published`, 묶음이 `published`, `auto_publication_items`의 Entry ID가 모두 기록됐다.
2. 같은 예약 호출 재실행: 공개 수 2건 유지, 추가 실행 기록은 `no-batch`로 남았다.
3. 실제 `rollbackAutoPublicationBatch` 함수 호출: D1 스위치 `paused=1`, 두 Entry 모두 `unpublished`, 묶음 `rolled-back`, 공개 중지 ReviewDecision 2건이 확인됐다.

검증 명령은 `tools/browser-run-probe/README.md`와 각 로컬 설정·fixture를 따른다. 이 리허설은 실제 Production 표본과 게시를 대체하지 않는다.

## 남은 관측

- Production 예약 실행이 첫 표본 묶음을 만드는지 확인한다. 실패 시 `auto_publication_runs.failure_code`를 근거로 수정한다.
- 소유자가 표본의 실제 Result와 문구를 확인하고 승인한다. 이후 예약 실행이 나머지를 자동 게시하는지, 공개 예제의 첫 로드와 출처가 정상인지 확인한다.
- 실제 묶음 취소를 운영에서 재검증하고, 불일치율·무료 사용량을 축적한다.
- 수동 예약 호출을 한 번에 두 경로로 시험하려던 작업은 자동 승인 검토가 중복 Production 쓰기 위험으로 거부했다. 단일 문서 경로도 원격 프록시에서 404여서 Production 예약 실행을 앞당기지 못했다. 첫 자동 예약을 기다린다.

## 상태 기록 보완 및 재배포

- 예약 Worker `151599d0-f1f9-4271-aa16-ef3a38398fa4`, Production 앱 Worker `42b408ed-891c-4086-9473-9b1c81615fdd`로 갱신했다. 표본 거절·후보 변경·공개 완료·중간 실패 때 실행 기록과 항목 상태를 함께 갱신하고, 중간 공개 실패 시 예약 검사를 중지한다.
- 새 격리 로컬 D1에서 전체 migration과 fixture를 다시 적용했다. 예약 이벤트 후 실행 `published/published_count=2`, 묶음 `published`, 항목 게시 2건이 일치했다. 실제 취소 API 호출 후 실행 `blocked/published_count=0/failure_code=MANUAL_ROLLBACK`, 묶음 `rolled-back`, 취소 항목 2건, 실제 게시 0건이 일치했다.
- 전체 Vitest 97건, 검사기 Node 테스트 7건, 앱·Worker 타입 검사, Production 빌드, 예약 Worker dry-run과 `git diff --check`를 통과했다. 로컬 `npm ci`가 잠긴 패키지 파일로 실패해 앱 의존성은 동일 버전의 로컬 pnpm 설치를 이용했다.
- Production 앱 health는 HTTP 200이다. 운영 D1은 `paused=0`, 실행 0건, 묶음 0건, 자동 게시 0건이다. 첫 예약 실행은 2026-10-16 11:17 한국 시간이며, 같은 대화에서 매일 11:40에 상태를 확인하는 후속 작업을 등록했다. 실제 운영 자동 게시 성공 여부는 첫 표본 승인과 다음 예약 실행 후 판정한다.
