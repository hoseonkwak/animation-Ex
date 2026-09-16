# WP4 관리자 검수 구현 결과

작성일: 2026-09-16  
상태: 완료

## 구현 결과

owner 한 명이 실제 CodePen 실행 화면을 확인하고 후보를 편집한 뒤 공개 여부를 결정하는 Candidate Inbox를 구현했다.

- `/admin/review`: 승인 대기·수정 필요·중복·Preview 실패 큐와 3열 검수 작업 공간
- Desktop, Tablet, Mobile viewport 전환이 가능한 실제 CodePen embed
- 공개 제목, 원본 제목, 요약, slug, 난이도, Featured, 출처, 라이선스와 태그 편집
- 현재 Pen key와 embed 설정 fingerprint를 포함한 `ValidationRun` 저장
- 승인, 수정 필요, 중복과 거절 결정 이력
- 승인 시 Entry, CodePenRef, 확정 태그, ReviewDecision과 Candidate 상태를 D1 batch로 저장
- 승인 멱등 키 저장과 같은 요청의 Entry 중복 방지
- 공개 중지와 기존 공개 API의 `410 Gone`

## 관리자 경계

- Cloudflare Access의 `Cf-Access-Authenticated-User-Email`과 `ADMIN_EMAIL`을 함께 확인한다.
- 로컬 호스트에서는 `LOCAL_ADMIN_SIMULATION=true`일 때만 `X-Local-Access-Email`을 받는다.
- 인증 정보가 없으면 401, 허용 이메일이 다르면 403을 반환한다.
- 관리자 변경 요청은 같은 origin만 허용한다.
- 검수자 이메일 원문 대신 SHA-256 hash만 결정·검증 증거에 저장한다.

## 데이터

- `0009_admin_idempotency.sql`: 승인 멱등 결과 저장
- `db/seeds/wp4.sql`: WP3에서 공개하지 않은 `GreenSock/LYpgKPe`를 검수 후보로 등록
- 공개 목록의 기존 15개와 관리자 후보 fixture를 분리해 이전 계약 검사를 유지

## 검증 증거

| 검사 | 결과 |
|---|---|
| TypeScript typecheck | 통과 |
| ESLint | 통과 |
| Vitest 단위·계약 | 7 files, 26 tests 통과 |
| 승인 강제 중간 실패 rollback | Entry 0, Candidate `review` 유지 |
| 같은 승인 멱등 키 재호출 | Entry와 approve decision 각각 1개 |
| Playwright | 8 tests 통과 |
| Production build | Node 24, client·Worker bundle 성공 |

Playwright는 공개 Explore 회귀와 Candidate Inbox 렌더링, 실제 CodePen embed URL, Preview 확인 전 승인 차단, 실행 확인 저장 후 승인 활성화, 인증 없는 API의 401을 검증했다.

## 다음 단계

WP5에서 WSSS fixture parser, CodePen URL 정규화, 중복 제거, checkpoint와 HMAC batch API를 구현한다. 이때 `.agents/skills/source-ingestion/SKILL.md`를 실제 반복 절차와 함께 생성한다.
