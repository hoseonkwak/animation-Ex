# Loading 자동 공개 확대 교정

확인일: 2026-10-27

## 원인: 대기 1,843건이 유지된 이유

- Production D1 읽기 전용 집계: 후보 1,876건 중 `review` 1,843건, `approved` 33건.
- 자동 공개 스위치 `paused=0`, Loading 대기 90건을 확인했다.
- GSAP 후보는 총 15건이며 승인 13건, 대기 2건이다. 기존 자동 Worker는 GSAP만 대상으로 하고 최소 묶음 3건을 요구했다.
- 2026-10-22~27 예약 실행은 모두 `no-batch` / `INSUFFICIENT_ELIGIBLE`이었다. 따라서 다른 카테고리의 대기 후보가 자동 처리되지 않았다.
- WSSS GSAP 원격 체크포인트의 완료 게시물은 15건이다. 2026-10-26 수집 예약 실행은 성공했으나 신규 후보 0건이었다.

## Loading 읽기 전용 교정

- 원격 Browser Run에서 Loading 후보 10건을 두 번에 나눠 검사했다. 양성 대조군을 먼저 확인했고, 10건 모두 Embed·Result HTTP 200, 두 관측 구간의 화면 변화, 페이지 오류 없음이었다. 이 검사는 D1을 변경하지 않았다.
- 브라우저에서 3건의 실제 화면을 살폈다. 원형 진행 표시와 회전 로더 2건은 분류에 맞았다. 회전 링크·버튼 1건은 실행 검사는 통과했으나 로더가 아니었다.
- 이 오분류를 막기 위해 원본 제목에 loader/loading/preloader/spinner/progress 표기가 있는 후보만 Loading 자동 공개 대상으로 삼는다. 해당 조건만으로 의미 품질을 완전히 보증하지는 않으므로 공개 후 표본과 중지·취소 경로를 유지한다.
- 브라우저 실행 무료 한도는 하루 10분이며, 한 실행의 후보 상한은 8건이다. [Cloudflare 한도](https://developers.cloudflare.com/browser-run/limits/).

## 구현 및 운영 확인

- GSAP에서 3건을 고르지 못하면 Loading을 선택하며 두 카테고리를 한 묶음에 섞지 않는다.
- 후보 선택 SQL은 두 카테고리로 제한한 뒤 100건 상한을 적용한다. 그 외 출처·라이선스·중복·태그·실행 증거 조건과 실패 기록·롤백 동작은 유지한다.
- 자동 정책 단위 검사 12건 통과, `wrangler deploy --dry-run` Worker 번들 검증 통과.
- Production Worker 버전 `d3db083f-7c15-4cb3-8116-76a566b01674` 배포. 기존 매일 11:17 KST 예약을 유지한다.
- 2026-10-27 UTC 04:32:49 수동 예약 실행 `57912c84-c094-4fb2-b738-25671b129a0b`: Loading 8건 검사, 7건 통과·게시, 1건 `AUTOMATIC_GATE_NOT_MET` 경고로 보류. 묶음 `cda547d7-c9ab-4257-90a8-29c0b42e3ab4`는 `published`다.
- Production D1의 후보 상태가 `review` 1,843→1,836건, `approved` 33→40건으로 바뀌었다. 게시된 7건 모두 `animation_entries.status='published'`이며 원본 제목에 로더 관련 단어가 있다.
- 새 게시물 `pen-jkantner-qwpyzlz-14ia8u6`의 공개 API `GET /api/v1/examples/{slug}` 응답은 HTTP 200이다.
- 다음 정기 예약은 별도 소유자 승인 없이 같은 조건으로 실행된다. 공개 후 표본의 의미 품질은 계속 확인해야 한다.
