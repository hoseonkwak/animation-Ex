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

로컬에서는 `apps/lab/.dev.vars.example`을 `.dev.vars`로 복사한다. preview와 production 빌드는 환경 전용 `.dev.vars.preview`, `.dev.vars.production`을 사용해 로컬 값을 읽지 않는다. 이 파일들은 Git에서 제외한다. 실제 preview와 production 비밀 값은 저장소에 넣지 않고 Cloudflare secret으로 등록한다.

브라우저에 노출되는 Turnstile site key는 비밀이 아니므로 `apps/lab/.env.preview`와 `apps/lab/.env.production`의 `VITE_TURNSTILE_SITE_KEY`로 관리한다. 환경 배포 스크립트는 Vite `--mode`를 대상 환경과 일치시켜 다른 환경의 site key가 섞이지 않게 한다.

필수 값:

- `ADMIN_EMAIL`
- `INGESTION_KEY_ID`
- `INGESTION_HMAC_SECRET`
- `TURNSTILE_SECRET_KEY`

Cloudflare Access는 `/admin/*`와 `/api/v1/admin/*`에 소유자 이메일 하나만 허용한다. Worker도 Access 이메일과 `ADMIN_EMAIL`을 다시 비교한다.

Turnstile 위젯은 환경별 공개 도메인만 허용하는 `managed` 모드로 만든다. 생성 결과의 site key는 해당 `.env.<환경>`에 기록하고 secret은 터미널 기록이나 Git에 남기지 않은 채 바로 Worker secret으로 등록한다.

```bash
wrangler turnstile widget list
wrangler secret put TURNSTILE_SECRET_KEY --env preview
```

현재 Preview 위젯은 `kwak-motion-lab-preview.kwak-motion-lab.workers.dev`만 허용한다. `/submit`에서 Cloudflare 사람 확인 위젯이 표시되고 토큰 검증 후 제보 버튼이 활성화되는지 배포 직후 확인한다.

Preview D1을 처음 만들거나 빈 데이터베이스를 다시 구성할 때 다음 명령을 실행한다. 이 명령은 `--env preview`와 `--remote`를 고정하며 production D1을 대상으로 하지 않는다.

```bash
npm run db:setup:preview
```

Production D1은 별도 ID를 사용하며 최초 배포 전에 아래 명령으로 구성한다.

```bash
npm run db:setup:production
```

## 배포 전 검증

```bash
npm run verify:deploy:preview --workspace @kwak-motion/lab
npm run verify:deploy:production --workspace @kwak-motion/lab
```

두 명령은 `CLOUDFLARE_ENV`와 Vite mode를 빌드 전에 대상 환경으로 고정한 뒤 Wrangler dry-run을 실행한다. 출력의 Worker 이름, `APP_ENVIRONMENT`와 D1 이름이 대상 환경과 일치해야 한다.

## 배포

```bash
npm run deploy:preview --workspace @kwak-motion/lab
npm run deploy:production --workspace @kwak-motion/lab
```

preview 확인 전 production 배포를 실행하지 않는다. preview의 `/robots.txt`는 `Disallow: /`와 `X-Robots-Tag: noindex, nofollow`를 반환해야 한다.

배포한 Preview는 아래 명령으로 Worker health, 공개 예제, 전체 noindex, 비로그인 홈과 비인증 관리자 API 차단을 확인한다. URL에는 인증 정보나 query를 넣지 않는다.

```bash
PREVIEW_BASE_URL=https://preview.example.com npm run smoke:preview
```

GitHub Actions의 `Preview smoke` workflow에서도 같은 검사를 수동 실행할 수 있다. 이 검사는 Worker의 관리자 차단을 확인하지만 Cloudflare Access의 이메일 허용 정책 자체는 Dashboard에서 별도로 확인한다.

현재 Preview URL은 `https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev`다. Zero Trust 무료 활성화가 결제 카드와 무료 한도 초과분 자동 청구 동의를 요구해 Access 연결은 보류했다. Access가 연결되기 전에는 원격 관리자 기능을 사용하지 않는다.

Production은 공개 색인 허용, `/admin/` 차단과 sitemap 연결을 별도 smoke로 검사한다.

```bash
PRODUCTION_BASE_URL=https://kwak-motion-lab-production.kwak-motion-lab.workers.dev npm run smoke:production
```

현재 Production URL은 `https://kwak-motion-lab-production.kwak-motion-lab.workers.dev`다. Production D1, Turnstile 위젯과 Worker secret은 Preview와 분리되어 있다. 원격 관리자 기능은 Access 보류 상태이므로 Production에서도 401로 차단된다.

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

Preview 최초 동기화는 2026-09-22에 완료했다. Wrangler OAuth는 로컬 검증에만 사용하고 GitHub Actions에는 저장하지 않는다. workflow 자동화 전 Analytics 읽기 전용 API token을 별도로 발급한다.

Production 최초 동기화도 2026-09-22 UTC 사용량으로 완료했다. Worker 요청 6, D1 읽기 1,284, 쓰기 1,134를 기록했고 무료 한도 판정은 `normal`이었다.

## 장애 대응

1. 공개 조회가 정상인지 `/api/v1/health`로 확인한다.
2. 수집 장애이면 먼저 `INGESTION_PAUSED=true`로 새 batch를 막는다.
3. 관리자 ingestion run과 개별 실패 코드를 확인한다.
4. 마지막 성공 checkpoint에서 수동 workflow를 재실행한다.
5. 공개 콘텐츠 오류이면 해당 Entry를 unpublish하고 원인을 기록한다.

### Worker 버전 롤백

데이터 migration이 원인이 아니고 Worker 코드나 정적 자산 배포가 원인일 때만 이전 Worker 버전으로 롤백한다. D1을 포함한 binding 자원은 Worker 롤백으로 되돌아가지 않는다.

```bash
wrangler deployments list --env preview
wrangler rollback <검증된-version-id> --env preview --message "rollback reason" --yes
PREVIEW_BASE_URL=https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev npm run smoke:preview
```

2026-09-22 Preview에서 `96ef0bdd`를 이전 검증 버전 `3e0b8209`로 롤백해 smoke 5개를 통과한 뒤 `96ef0bdd`를 다시 활성화하고 같은 smoke를 통과했다.

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
