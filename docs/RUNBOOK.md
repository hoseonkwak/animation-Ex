# Phase 1 운영 Runbook

문서 상태: Active v0.1
목적: preview와 production을 혼동하지 않고 배포·중지·복구한다.

## 환경

| 환경       | Worker                       | D1                           | 검색 색인      | 수집 기본값 |
| ---------- | ---------------------------- | ---------------------------- | -------------- | ----------- |
| local      | `kwak-motion-lab`            | `kwak-motion-lab-local`      | 해당 없음      | 허용        |
| preview    | `kwak-motion-lab-preview`    | `kwak-motion-lab-preview`    | 전체 차단      | 중지        |
| production | `kwak-motion-lab-production` | `kwak-motion-lab-production` | 공개 경로 허용 | 허용        |

Wrangler binding은 상속되지 않으므로 `wrangler.jsonc`에서 각 환경의 `DB`를 명시한다. 환경별 계약 검사가 세 데이터베이스 이름의 중복을 거절한다.

## 최초 준비

로컬에서는 `apps/lab/.dev.vars.example`을 `.dev.vars`로 복사한다. preview와 production 빌드는 빈 환경 전용 `.dev.vars.preview`, `.dev.vars.production`을 사용해 로컬 값을 읽지 않는다. 이 파일들은 Git에서 제외한다. 실제 preview와 production 값은 저장소에 넣지 않고 Cloudflare secret으로 등록한다.

필수 값:

- `ADMIN_EMAIL`
- `INGESTION_KEY_ID`
- `INGESTION_HMAC_SECRET`
- `TURNSTILE_SECRET_KEY`

Cloudflare Access는 `/admin/*`와 `/api/v1/admin/*`에 소유자 이메일 하나만 허용한다. Worker도 Access 이메일과 `ADMIN_EMAIL`을 다시 비교한다.

## 배포 전 검증

```bash
npm run verify:deploy:preview --workspace @kwak-motion/lab
npm run verify:deploy:production --workspace @kwak-motion/lab
```

두 명령은 `CLOUDFLARE_ENV`를 빌드 전에 고정한 뒤 Wrangler dry-run을 실행한다. 출력의 Worker 이름, `APP_ENVIRONMENT`와 D1 이름이 대상 환경과 일치해야 한다.

## 배포

```bash
npm run deploy:preview --workspace @kwak-motion/lab
npm run deploy:production --workspace @kwak-motion/lab
```

preview 확인 전 production 배포를 실행하지 않는다. preview의 `/robots.txt`는 `Disallow: /`와 `X-Robots-Tag: noindex, nofollow`를 반환해야 한다.

## 무료 한도 보호

`daily_metrics`의 `cloudflare` 차원에 아래 키를 날짜별로 저장한다.

- `worker_requests`
- `d1_rows_read`
- `d1_rows_written`

무료 한도 대비 최대 비율이 70% 이상이면 `warning`, 90% 이상이면 `paused`다. `paused`에서는 새 ingestion batch를 `429 INGESTION_PAUSED_LIMIT`로 거절한다. 긴급 중지는 `INGESTION_PAUSED=true`로 강제한다. 기존 실행의 완료 요청은 허용해 상태와 checkpoint를 남긴다.

관리자는 `GET /api/v1/admin/operations`에서 현재 환경, 수집 강제 중지와 사용량 판정을 확인한다. Cloudflare 사용량 동기화가 실패하면 수치를 0으로 간주해 자동 재개하지 말고 `INGESTION_PAUSED=true`를 유지한다.

### Cloudflare 일일 사용량 동기화

`npm run sync:cloudflare-usage`는 지정한 UTC 날짜의 Worker 요청 수와 D1 읽기·쓰기 행 수를 GraphQL Analytics에서 조회하고 `/api/v1/ingestion/usage`에 제출한다. `USAGE_DATE`를 생략하면 현재 UTC 날짜를 사용한다.

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_WORKER_SCRIPT_NAME`
- `CLOUDFLARE_ANALYTICS_API_TOKEN`: 계정 Analytics 읽기 권한만 부여한 토큰
- `INGESTION_API_URL`
- `INGESTION_KEY_ID`
- `INGESTION_HMAC_SECRET`

GitHub Actions의 `Cloudflare daily usage` workflow는 같은 값을 repository secrets에서 읽으며 초기에는 수동 실행한다. 최초 원격 동기화에서 관리자 운영 화면의 날짜와 수치를 확인한 뒤 하루 1회 예약 실행을 활성화한다.

## 장애 대응

1. 공개 조회가 정상인지 `/api/v1/health`로 확인한다.
2. 수집 장애이면 먼저 `INGESTION_PAUSED=true`로 새 batch를 막는다.
3. 관리자 ingestion run과 개별 실패 코드를 확인한다.
4. 마지막 성공 checkpoint에서 수동 workflow를 재실행한다.
5. 공개 콘텐츠 오류이면 해당 Entry를 unpublish하고 원인을 기록한다.

## 백업과 복구

production 변경 전 `wrangler d1 export kwak-motion-lab-production --remote --output <경로>`로 SQL export를 만든다. 복구 연습은 production에 직접 import하지 않고 새 local D1에 export를 적용한 뒤 핵심 테이블 수와 공개 예제 조회를 확인한다.

로컬 리허설은 다음 명령으로 재현한다.

```bash
npm run db:setup:local
npm run db:rehearse:restore
```

리허설은 로컬 D1을 SQL로 export하고 운영체제 임시 폴더의 새로운 D1에 export를 적용한다. 공개 Entry 15개 이상, Source 15개 이상과 Tag 존재를 확인한 뒤 export SHA-256과 복구 집계를 JSON으로 출력하고 임시 파일을 삭제한다.

D1 Time Travel 복구는 현재 상태를 덮어쓰므로 장애 원인과 복구 시점을 확정한 뒤에만 실행한다. 복구 전 현재 bookmark 또는 export를 먼저 남긴다.

## 오류 로그

예상한 입력·인증 오류는 기존 API 오류 코드로 응답한다. 처리하지 못한 예외는 `request_error` JSON 객체로 기록하고 사용자에게는 `500 INTERNAL_ERROR`를 반환한다.

로그 필드:

- `requestId`
- HTTP method와 path
- 실행 환경
- 오류 이름과 메시지

요청 본문, Access token, cookie, 사용자 이메일과 IP는 로그에 넣지 않는다. 사용자에게 반환한 request ID로 Workers Logs에서 같은 오류를 찾는다.
