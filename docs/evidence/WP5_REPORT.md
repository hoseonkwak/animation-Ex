# WP5 WSSS 수집 구현 결과

작성일: 2026-09-16

상태: 완료

## 구현 결과

- WSSS 카테고리 목록과 게시물의 최소 HTML fixture를 추가했다.
- 목록, 페이지네이션, 게시물과 다중 CodePen 링크 parser를 구현했다.
- CodePen URL을 canonical Pen URL로 정규화하고 WSSS 발견 경로와 분리했다.
- WSSS 카테고리의 확정 기술 태그와 제목 기반 제안 태그를 생성한다.
- 이미 처리한 external ID를 건너뛰고 API 저장이 확인된 항목까지만 checkpoint를 전진한다.
- 403·429 즉시 중단, timeout·5xx 제한 재시도, robots 검사와 허용 URL 정책을 적용했다.
- ZIP, 이미지, 첨부 파일과 CodePen 페이지는 수집 요청 대상에서 차단한다.
- 최대 50개 후보를 받는 HMAC-SHA256 batch API와 완료 API를 구현했다.
- 요청 시간 5분 제한, 256 KiB 본문 제한과 request ID 재사용 방지를 적용했다.
- owner가 실행 결과와 마지막 checkpoint를 조회하는 관리자 API를 연결했다.
- 수동 GitHub Actions workflow와 반복 절차 Skill을 추가했다.

## 검증 증거

- fixture parser, 다중 Pen, 구조 변경 감지, URL 정규화와 태그 제안 검사
- 같은 입력을 세 번 제출한 뒤 Candidate 수가 늘지 않는 검사
- 일부 성공 후 checkpoint에서 나머지를 재개하는 검사
- 403·429 무재시도와 5xx 최대 2회 재시도 검사
- ZIP, 이미지와 CodePen 페이지 요청 수 0 검사
- 잘못된 HMAC, 만료 timestamp와 request ID 재사용 거절 검사
- batch 일부 실패의 항목별 결과와 실행 집계 검사
- 현재 WSSS GSAP 카테고리의 게시물 1건 읽기 전용 preflight 통과
- 전체 Vitest 9개 파일, 41개 검사 통과
- production build 및 Playwright E2E 8개 통과

preflight에서 게시물 `1603`의 WSSS 제목, `Animation/GSAP` 카테고리, CodePen 제작자 `Tom Miller`와 canonical Pen URL을 추출했다. 서버 제출은 수행하지 않았다. E2E는 실행 전 검수 fixture의 이전 ValidationRun만 제거해 반복 실행 시에도 같은 초기 상태를 보장한다.

## 운영 상태

`WSSS ingestion` workflow는 수동 실행만 제공한다. production API 주소와 HMAC 비밀값이 아직 설정되지 않아 실제 후보 제출은 실행하지 않았다. 하루 1회 schedule은 수동 실행에서 구조 변경, 속도 제한과 checkpoint 복구를 확인한 뒤 활성화한다.

## 다음 단계

WP6에서 연습 공간의 요구 범위와 데이터 계약을 확정하고 공개 상세에서 연습 시작까지 연결한다.
