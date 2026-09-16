# Phase 1 API 계약

문서 상태: Draft v0.1
기준 경로: `/api/v1`
목적: Vue 화면, 관리자 검수, GitHub Actions 수집기가 같은 요청과 응답 규칙을 사용하게 한다.

## 1. 공통 규칙

- 요청과 응답은 UTF-8 JSON을 사용한다.
- 시간은 UTC ISO 8601 문자열로 주고받는다.
- ID는 서버가 생성하는 ULID 문자열을 사용한다.
- 공개 API는 `published` 상태만 반환한다.
- 알 수 없는 필드, 필터와 정렬 값은 조용히 무시하지 않고 `400`으로 응답한다.
- 응답 필드 이름은 `camelCase`, 데이터베이스 열 이름은 `snake_case`를 사용한다.

성공 응답:

```json
{
  "data": {},
  "meta": {
    "requestId": "01K..."
  }
}
```

오류 응답:

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "지원하지 않는 필터입니다.",
    "fields": { "axis": "unknown" },
    "requestId": "01K..."
  }
}
```

## 2. 공개 API

### `GET /examples`

공개 예제 목록을 조회한다.

| 매개변수     | 형식                             | 기본값   |
| ------------ | -------------------------------- | -------- |
| `q`          | 2~80자 문자열                    | 없음     |
| `technology` | 쉼표로 구분한 tag key            | 없음     |
| `trigger`    | 쉼표로 구분한 tag key            | 없음     |
| `motion`     | 쉼표로 구분한 tag key            | 없음     |
| `section`    | 쉼표로 구분한 tag key            | 없음     |
| `technique`  | 쉼표로 구분한 tag key            | 없음     |
| `difficulty` | `beginner,intermediate,advanced` | 없음     |
| `origin`     | `original-pen,lab-created`       | 없음     |
| `featured`   | `true,false`                     | 없음     |
| `sort`       | `latest,featured,difficulty`     | `latest` |
| `limit`      | 1~24                             | 24       |
| `cursor`     | 이전 응답의 opaque cursor        | 없음     |

같은 축의 값은 OR, 서로 다른 축은 AND로 결합한다. 예를 들어 `technology=gsap,css&trigger=scroll`은 GSAP 또는 CSS이면서 Scroll인 예제를 찾는다.

목록 항목에는 카드에 필요한 값만 포함한다.

```json
{
  "data": {
    "items": [
      {
        "id": "01K...",
        "slug": "scroll-image-reveal",
        "title": "스크롤 이미지 리빌",
        "summary": "스크롤에 따라 이미지가 펼쳐지는 예제",
        "origin": "original-pen",
        "difficulty": "intermediate",
        "featured": false,
        "preview": {
          "kind": "codepen",
          "penId": "abc123",
          "embedUrl": "https://codepen.io/example/embed/abc123"
        },
        "tags": {
          "technology": ["gsap"],
          "trigger": ["scroll"],
          "motion": ["reveal"]
        },
        "publishedAt": "2026-09-15T00:00:00.000Z"
      }
    ],
    "nextCursor": null
  },
  "meta": { "requestId": "01K..." }
}
```

Cursor에는 정렬 기준 값과 ID만 넣고 버전을 포함한다. 서버는 잘못된 cursor를 `INVALID_CURSOR`로 거절한다.

### `GET /examples/:slug`

상세 화면에 필요한 설명, 전체 태그, 출처 표시와 실행 정보를 반환한다.

`preview.kind`는 다음 중 하나다.

- `codepen`: 검증된 원본 Pen 임베드
- `internal`: 서비스 내부 CodePackage의 격리 Preview

Phase 1 공개 데이터에는 `codepen`만 사용한다. 공개 CodePackage 원문은 Phase 2 API에서 별도로 설계한다.

### `GET /tags`

활성 태그와 공개 콘텐츠 수를 축별로 반환한다. 응답은 캐시한다.

### `GET /collections`

공개 컬렉션의 slug, 제목, 설명과 대표 예제를 반환한다.

### `GET /collections/:slug/examples`

컬렉션 예제를 `GET /examples`와 같은 카드 형식으로 반환한다.

### `GET /patterns`

활성 Pattern의 제목, 요약, 대표 예제와 포함된 공개 예제 수를 반환한다.

### `GET /patterns/:slug/examples`

Pattern에 속한 공개 예제를 카드 형식으로 반환한다.

### `POST /submissions`

로그인 없이 애니메이션 URL을 제보한다.

```json
{
  "url": "https://codepen.io/example/pen/abc123",
  "note": "Hero 영역의 텍스트 효과",
  "turnstileToken": "..."
}
```

규칙:

- URL은 `http` 또는 `https`만 허용한다.
- `note`는 선택이며 300자 이하로 제한한다.
- 요청 본문은 8KB 이하로 제한한다.
- Turnstile 토큰을 서버에서 검증한다.
- canonical URL이 같은 기존 Source 또는 Submission이 있으면 새 행을 만들지 않는다.
- 중복이어도 원본 존재 여부를 노출하지 않고 동일한 `202 Accepted`를 반환한다.

## 3. 관리자 API

모든 `/admin/*` API는 Cloudflare Access 신원과 서버의 `ADMIN_EMAIL` 허용 목록을 함께 확인한다. 쿠키가 포함된 같은 origin JSON 요청만 허용하고 `Origin`을 검사한다.

### `GET /admin/candidates`

상태, 출처 타입, 실패 코드와 생성일로 후보를 조회한다. 기본 페이지 크기는 50, 최대 100이다.

### `GET /admin/candidates/:id`

Source, 발견 경로, 추출 메타데이터, 중복 후보, 마지막 검증과 검수 이력을 반환한다.

### `PATCH /admin/candidates/:id`

제목, 작성자, 라이선스, 우선순위와 태그 후보를 수정한다. 낙관적 잠금을 위해 현재 `version`을 반드시 보낸다. 버전이 다르면 `409 VERSION_CONFLICT`를 반환한다.

### `POST /admin/candidates/:id/preview-checks`

관리자가 실제 CodePen embed를 확인한 결과를 저장한다. `result`, `penKey`, `viewport`, 선택적인 실패 코드를 받는다. 서버는 현재 후보의 `penKey`와 일치할 때만 유효한 검사로 기록한다.

### `POST /admin/candidates/:id/approve`

다음을 하나의 원자적 작업으로 수행한다.

1. Candidate가 `review` 상태이며 최신 버전인지 확인
2. 현재 Pen 식별값과 일치하는 최근 Preview 통과 기록 및 필수 출처 정보 확인
3. slug 중복 확인
4. AnimationEntry 생성
5. 확정 TagAssignment 생성
6. ReviewDecision 생성
7. Candidate를 `approved`로 변경

중간 단계가 실패하면 전체 변경을 취소한다. 같은 idempotency key로 재호출해도 Entry가 하나만 생겨야 한다.

### `POST /admin/candidates/:id/reject`

`reasonCode`와 `note`를 필수로 저장한다. 거절된 Candidate와 Source 이력은 삭제하지 않는다.

### `POST /admin/candidates/:id/merge`

병합 대상 Candidate ID와 근거를 저장한다. canonical Source는 하나만 유지하고 발견 경로는 모두 보존한다.

### `PATCH /admin/examples/:id`

제목, 요약, 난이도, featured와 확정 태그를 변경한다. slug 변경은 별도 명시하지 않으면 허용하지 않는다.

### `POST /admin/examples/:id/unpublish`

공개 중지 이유를 기록하고 상태를 `unpublished`로 바꾼다. 기존 URL은 `404` 대신 공개 중지 안내가 가능한 `410 Gone`을 반환한다.

### `GET /admin/ingestion-runs`

실행별 발견, 신규, 중복, 실패, 승인 대기 수와 마지막 checkpoint를 반환한다.

## 4. 수집 API

### `POST /ingestion/batches`

GitHub Actions 수집기가 후보를 최대 50개씩 전달한다.

필수 헤더:

- `X-Ingestion-Key-Id`
- `X-Ingestion-Timestamp`
- `X-Ingestion-Request-Id`
- `X-Ingestion-Signature`

서명 대상은 `method`, `path`, `timestamp`, `request ID`, `SHA-256(body)`를 줄바꿈으로 연결한 문자열이다. Worker는 Web Crypto HMAC-SHA256으로 검증한다. 허용 시간 차이는 5분이며 request ID를 저장해 재전송 공격을 막는다. 본문은 최대 256 KiB, 한 batch는 1~50개다.

요청 본문에는 `runId`, `trigger`, `checkpointBefore`, `items`를 전달한다. `items`는 정규화한 CodePen 원본, WSSS 발견 경로와 추천 태그만 포함한다.

각 항목은 독립 결과를 받는다.

```json
{
  "data": {
    "accepted": 32,
    "duplicates": 15,
    "failed": 3,
    "items": [
      {
        "externalId": "wsss:1234",
        "result": "accepted",
        "candidateId": "01K..."
      }
    ]
  }
}
```

일부 항목이 실패해도 성공 항목을 다시 보낼 필요가 없게 결과를 분리한다. `externalId`와 canonical URL은 멱등 키로 사용한다.

### `POST /ingestion/runs/:id/complete`

checkpoint와 실행 집계를 기록한다. 일부 실패가 있으면 실행 상태는 `partial`, 전체 실패는 `failed`로 저장한다.

## 5. 상태 코드

| HTTP | 사용 상황                              |
| ---: | -------------------------------------- |
|  200 | 조회 및 동기 변경 성공                 |
|  201 | 관리자에 의한 새 리소스 생성           |
|  202 | 익명 제보 접수                         |
|  400 | 요청 형식, 필터 또는 cursor 오류       |
|  401 | 인증 정보 없음 또는 수집 서명 오류     |
|  403 | 인증됐지만 관리자 허용 목록 불일치     |
|  404 | 공개되지 않았거나 존재하지 않는 리소스 |
|  409 | 버전, slug, idempotency 충돌           |
|  410 | 공개 중지된 기존 공개 URL              |
|  413 | 본문 또는 batch 크기 초과              |
|  429 | 속도 또는 무료 사용량 보호 제한        |
|  500 | 예상하지 못한 서버 오류                |
|  503 | 무료 한도 보호로 쓰기 기능 일시 중지   |

## 6. 캐시와 개인정보

- 공개 목록과 상세는 `ETag`와 짧은 `Cache-Control`을 사용한다.
- 관리자와 수집 응답은 `no-store`다.
- 승인, 수정과 공개 중지는 관련 공개 캐시 버전을 증가시킨다.
- IP 원문, Access 토큰과 Turnstile 토큰을 저장하지 않는다.
- 검색어 집계 전 URL, 이메일 형태와 80자 이후 내용을 제거한다.
- 오류 로그에는 요청 본문과 인증 헤더를 넣지 않는다.

## 7. 계약 검증

구현 시 다음 fixture 기반 계약 검사를 추가한다.

- 정상/잘못된 필터 조합
- 공개되지 않은 Entry 누출 방지
- cursor 정렬 안정성
- 승인 작업 원자성과 멱등성
- Candidate version 충돌
- 수집 HMAC, 만료 timestamp와 request ID 재사용
- Turnstile 성공과 실패
- 응답에 내부 provenance와 운영 메모가 포함되지 않는지 검사
