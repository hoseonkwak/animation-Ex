# 반복 승인 없는 자동 공개 전환 검증

검증일: 2026-10-20 (한국 시간)

## 변경 의도

기존 방식은 3~8건 묶음마다 소유자가 표본을 클릭해야 다음 묶음으로 진행했다. D-043은 `Animation/GSAP`에서 엄격한 Browser Run 실행 증거와 출처·태그·중복·제목 조건을 충족하면 예약 실행에서 바로 공개한다. 표본 확인은 공개 후 선택 사항이며 즉시 중지와 묶음 전체 취소를 유지한다. 다른 카테고리는 아직 자동 공개하지 않는다.

## 격리 로컬 D1 검증

`tools/browser-run-probe`의 별도 로컬 D1에 12개 migration과 `local-release.sql`·`local-handsfree.sql`을 적용했다. 예약 이벤트를 한 번 호출했을 때 수동 승인 없이 표본 포함 3건이 `published`가 됐고 실행 기록의 `published_count=3`과 일치했다. 기존 `rollback-worker.ts`를 호출하자 표본 포함 3건의 Entry가 모두 `unpublished`, 묶음이 `rolled-back`, 운영 스위치가 중지됐다.

다른 격리 D1에서 같은 fixture에 `local-sample-edited.sql`을 추가했다. 생성 후 수정된 표본 1건은 `blocked`로 제외되고, 다른 후보가 표본으로 교체됐으며, 버전과 엄격한 실행 증거가 유효한 3건만 공개됐다.

Worker Node 테스트 10건, 앱 Vitest 97건, 타입 검사, 수정 앱 파일의 ESLint·Prettier, 운영 Worker dry-run과 앱 production dry-run이 통과했다. 저장소 전체 `format:check`와 `lint`는 기존 CRLF 파일 및 무시된 `.wrangler` 임시 파일까지 검사해 실패하므로 수정 파일을 대상으로 별도 확인했다.

## 운영 읽기 전용 확인

Production D1에 `awaiting-sample` 묶음 1개가 있다. 2026-10-20 16:09경 기존 표본은 소유자가 승인해 실제 Entry가 `published`로 바뀌었다. 자동 대기 후보 6건은 모두 `review`, 생성 당시 버전과 일치했고 최신 validator는 `browser-run-auto`의 `pass`였다. 저장된 Embed·Result 응답은 200, 두 구간의 변화는 참, 페이지 오류는 0이었다. 10월 16일의 실행 증거는 72시간을 넘었으므로 다음 예약 실행에서 양성 대조군과 후보를 재검사해야 한다. 그 전에는 자동 게시 성공으로 기록하지 않는다.

## 완료 기준

- Production 앱과 예약 Worker 배포를 확인한다.
- 다음 예약 실행에서 오래된 증거를 갱신한 뒤 대기 6건의 실제 자동 게시 또는 추적 가능한 보류 사유를 확인한다.
- 새 묶음이 추가 표본 승인 없이 공개되고, 공개된 CodePen Result와 출처가 정상인지 점검한다.

## Production 배포와 직후 확인

- Git `master`에 `ca885c0`과 `0d46b7d`를 푸시했다.
- 앱 Worker `kwak-motion-lab-production` 버전 `88e0f782-0d83-4c18-b848-1cc416457a7b`, 예약 Worker `kwak-motion-lab-auto-publication` 버전 `072be5f5-0565-46db-b429-0aa612eb0a61`로 배포했다. Cron은 UTC 02:17(한국 시간 11:17) 그대로다.
- Production smoke에서 health, 공개 조회, 검색엔진 설정, 비로그인 홈과 관리자 API의 비인증 차단이 모두 통과했다. 관리자 브라우저에서도 새 자동 공개 안내가 보이고, 예약 대기 6건이 기본 추천 검수에서 제외된 것을 확인했다.
- 배포 직후 운영 D1은 `paused=0`, 기존 실행 `staged`, 묶음 `awaiting-sample`, 자동 게시 0건이다. 다음 예약 실행은 2026-10-21 한국 시간 11:17이다. 반복 승인 없는 새 묶음의 실제 성공까지 기존 heartbeat로 매일 확인한다.

## 소유자 요청에 따른 즉시 실행 (2026-10-20 16:50 KST)

소유자가 다음 예약 시각을 기다리지 않고 지금 실행하도록 요청했다. 실행 전 Production D1에서 `paused=0`, 기존 묶음 `awaiting-sample`, 자동 게시 0건을 확인했다. 첫 원격 예약 테스트 호출은 `HTTP 200`이었지만 `scheduled()`가 긴 검사를 `context.waitUntil()`에 맡긴 뒤 반환하여 30초 후 남은 작업이 취소됐다. 이 호출은 새 검사 기록 1건만 남겼고 게시하지 않았다.

`scheduled()`가 `runAutomaticPublication(env)`를 직접 `await`하도록 수정하고 Worker 테스트 10건과 배포 dry-run을 통과시켰다. 수정 코드로 원격 예약 테스트를 **한 번 재실행**하자 약 94초 후 완료됐다. Production D1에서 묶음 `0caec4da-f00f-4757-b898-69933f593403`은 `published`, 실행 `5d486598-f581-4ee2-afa7-1d167a594d09`는 `published_count=6`, `failure_code=null`이며 자동 대상 6건 모두 Entry ID와 함께 `published`로 기록됐다. 운영 공개 API `/api/v1/examples?limit=24&sort=latest`의 최신 6건도 이 Entry ID와 일치한다. 상세 API의 예제 1건에서 CodePen Result 임베드와 제작자·원본 URL·라이선스 정보가 확인됐다.

예약 Worker 수정 버전 `827d33e7-c0f8-4c57-8f30-4090573fb0c8`을 Production에 배포했다. 기존 표본은 소유자가 승인한 사례이므로, **새 묶음이 승인 없이 처음부터 공개되는지**는 다음 예약 실행에서 별도로 확인한다.
