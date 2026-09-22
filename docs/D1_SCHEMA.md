# Phase 1 D1 스키마 설계

문서 상태: Draft v0.1
목적: Phase 1 API와 수집 파이프라인이 사용할 테이블, 키, 상태와 인덱스를 확정한다.

## 1. 공통 규칙

- 모든 ID는 애플리케이션이 생성한 ULID `TEXT`다.
- 시간은 UTC ISO 8601 `TEXT`다.
- boolean은 `INTEGER`의 `0`, `1`로 저장한다.
- JSON 열은 이름을 `_json`으로 끝내고 API 진입 시 스키마를 검증한다.
- 공개 이력과 출처 이력은 물리 삭제하지 않는다.
- migration은 `0001_<name>.sql`처럼 번호를 붙이고 적용 후 수정하지 않는다.
- production, preview와 local은 서로 다른 D1 데이터베이스를 사용한다.

## 2. 핵심 관계

```text
sources ─┬─ source_discoveries ─ discovery_sources
         └─ candidates ─┬─ candidate_tags
                        └─ animation_entries ─┬─ codepen_refs
                                              ├─ entry_tags ─ tags
                                              ├─ pattern_entries ─ patterns
                                              ├─ collection_entries ─ collections
                                              ├─ validation_runs
                                              └─ review_decisions

ingestion_runs ─ ingestion_items
submissions ─ sources
```

## 3. 출처와 발견 경로

### `sources`

실제 원본 또는 canonical 대상이다.

| 열                     | 형식 | 규칙                                  |
| ---------------------- | ---- | ------------------------------------- |
| `id`                   | TEXT | PK                                    |
| `type`                 | TEXT | `codepen`, `website`, `independent`   |
| `url`                  | TEXT | 최초 입력 URL                         |
| `canonical_url`        | TEXT | UNIQUE, nullable                      |
| `creator_name`         | TEXT | nullable                              |
| `license_code`         | TEXT | nullable                              |
| `license_evidence_url` | TEXT | nullable                              |
| `license_checked_at`   | TEXT | nullable                              |
| `availability`         | TEXT | `unknown`, `available`, `unavailable` |
| `first_seen_at`        | TEXT | 필수                                  |
| `last_checked_at`      | TEXT | nullable                              |
| `created_at`           | TEXT | 필수                                  |
| `updated_at`           | TEXT | 필수                                  |

### `discovery_sources`

WSSS 같은 디렉터리나 수집 진입점을 나타낸다.

| 열            | 형식    | 규칙                       |
| ------------- | ------- | -------------------------- |
| `id`          | TEXT    | PK                         |
| `key`         | TEXT    | UNIQUE, 예: `wsss`         |
| `name`        | TEXT    | 필수                       |
| `base_url`    | TEXT    | 필수                       |
| `active`      | INTEGER | 기본 1                     |
| `config_json` | TEXT    | 공개 범위, checkpoint 규칙 |

### `source_discoveries`

하나의 원본이 여러 경로에서 발견된 사실을 보존한다.

| 열                    | 형식 | 규칙                          |
| --------------------- | ---- | ----------------------------- |
| `source_id`           | TEXT | FK → sources                  |
| `discovery_source_id` | TEXT | FK → discovery_sources        |
| `discovered_url`      | TEXT | 게시물 또는 목록 URL          |
| `external_id`         | TEXT | 출처 내부의 안정 ID, nullable |
| `first_seen_at`       | TEXT | 필수                          |
| `last_seen_at`        | TEXT | 필수                          |

PK는 `(source_id, discovery_source_id, discovered_url)`로 둔다. `(discovery_source_id, external_id)`에는 UNIQUE 인덱스를 둔다.

## 4. 후보

### `candidates`

| 열                  | 형식    | 규칙                  |
| ------------------- | ------- | --------------------- |
| `id`                | TEXT    | PK                    |
| `source_id`         | TEXT    | FK, UNIQUE            |
| `status`            | TEXT    | 아래 상태 집합        |
| `source_title`      | TEXT    | nullable              |
| `source_category`   | TEXT    | nullable              |
| `metadata_json`     | TEXT    | 추출 메타데이터       |
| `deduplication_key` | TEXT    | UNIQUE                |
| `confidence`        | REAL    | 0~1                   |
| `priority_score`    | REAL    | 0~100                 |
| `failure_code`      | TEXT    | nullable              |
| `failure_detail`    | TEXT    | nullable, 관리자 전용 |
| `retry_count`       | INTEGER | 기본 0                |
| `version`           | INTEGER | 기본 1, 낙관적 잠금   |
| `created_at`        | TEXT    | 필수                  |
| `updated_at`        | TEXT    | 필수                  |

Phase 1 상태:

```text
candidate → analyzing → review
review → approved | rejected | needs-edit | duplicate
any active state → source-unavailable | validation-failed
```

추출, 중복 검사와 분류의 세부 단계는 Candidate 상태를 계속 늘리지 않고 `ingestion_items` 결과와 실행 로그에 기록한다.

`approved`, `rejected`, `duplicate`는 종료 상태다. 재처리는 기존 이력을 유지한 채 명시적 관리자 작업으로 상태를 되돌린다.

### `candidate_tags`

- `candidate_id`, `tag_id` 복합 PK
- `source`: `imported`, `inferred`, `admin`
- `confidence`: 0~1
- `confirmed`: 0 또는 1

## 5. 공개 콘텐츠

### `animation_entries`

| 열                               | 형식    | 규칙                                   |
| -------------------------------- | ------- | -------------------------------------- |
| `id`                             | TEXT    | PK                                     |
| `candidate_id`                   | TEXT    | FK, UNIQUE, nullable                   |
| `source_id`                      | TEXT    | FK, nullable                           |
| `slug`                           | TEXT    | UNIQUE                                 |
| `title`                          | TEXT    | 필수                                   |
| `original_title`                 | TEXT    | nullable                               |
| `summary`                        | TEXT    | 필수                                   |
| `search_text`                    | TEXT    | 정규화한 한국어/영어 검색 문자열       |
| `content_origin`                 | TEXT    | `original-pen`, `lab-created`          |
| `preview_kind`                   | TEXT    | `codepen`, `internal`                  |
| `status`                         | TEXT    | `draft`, `published`, `unpublished`    |
| `difficulty`                     | TEXT    | `beginner`, `intermediate`, `advanced` |
| `featured`                       | INTEGER | 기본 0                                 |
| `active_code_package_version_id` | TEXT    | Phase 2까지 nullable                   |
| `published_at`                   | TEXT    | nullable                               |
| `created_at`                     | TEXT    | 필수                                   |
| `updated_at`                     | TEXT    | 필수                                   |

공개 조건은 다음과 같다.

- `preview_kind=codepen`이면 활성 `codepen_refs`가 정확히 하나 있어야 한다.
- `preview_kind=internal`이면 `active_code_package_version_id`가 있어야 한다.
- `published_at`은 `status=published`일 때만 존재한다.
- 공개 조건은 DB CHECK만으로 완전히 표현하지 않고 승인 service와 계약 검사에서 보장한다.

### `codepen_refs`

| 열                   | 형식    | 규칙                               |
| -------------------- | ------- | ---------------------------------- |
| `id`                 | TEXT    | PK                                 |
| `animation_entry_id` | TEXT    | FK, UNIQUE                         |
| `pen_key`            | TEXT    | `creator/pen-id`, UNIQUE           |
| `pen_id`             | TEXT    | 필수                               |
| `creator_slug`       | TEXT    | 필수                               |
| `canonical_url`      | TEXT    | UNIQUE                             |
| `embed_url`          | TEXT    | 필수, 서버가 canonical 값으로 생성 |
| `theme_id`           | TEXT    | 기본 `light`                       |
| `default_tab`        | TEXT    | 기본 `result`                      |
| `active`             | INTEGER | 기본 1                             |
| `last_verified_at`   | TEXT    | 필수                               |

클라이언트가 보낸 임의 embed URL을 그대로 저장하지 않는다. 검증한 creator와 Pen ID로 서버가 생성한다.

### `tags`

- `id` TEXT PK
- `axis` TEXT
- `key` TEXT
- `label_ko`, `label_en` TEXT
- `aliases_json` TEXT
- `active` INTEGER
- UNIQUE `(axis, key)`

허용 axis는 `technology`, `trigger`, `motion`, `section`, `technique`, `difficulty`, `mood`다.

### `entry_tags`

- `animation_entry_id`, `tag_id` 복합 PK
- `source`: `imported`, `inferred`, `admin`
- `confidence`: 0~1
- `confirmed`: 0 또는 1

## 6. 컬렉션

### `patterns`

- `id` TEXT PK
- `slug` TEXT UNIQUE
- `title`, `summary` TEXT
- `defining_traits_json` TEXT
- `featured`, `active` INTEGER
- `created_at`, `updated_at` TEXT

### `pattern_entries`

- `pattern_id`, `animation_entry_id` 복합 PK
- `position` INTEGER
- `added_at` TEXT

### `collections`

- `id` TEXT PK
- `slug` TEXT UNIQUE
- `title`, `description` TEXT
- `type`: `curated`, `dynamic`
- `filter_json` TEXT, dynamic일 때 필수
- `featured`, `active` INTEGER
- `created_at`, `updated_at` TEXT

### `collection_entries`

- `collection_id`, `animation_entry_id` 복합 PK
- `position` INTEGER
- `added_at` TEXT

curated 컬렉션만 이 테이블을 사용한다. dynamic 컬렉션은 `filter_json`을 공개 필터 계약으로 검증한 뒤 쿼리한다.

## 7. 검수와 수집 이력

### `validation_runs`

- `id` TEXT PK
- `target_type`: `candidate`, `entry`
- `target_id` TEXT
- `validator`: Phase 1은 `admin-codepen-embed`
- `validator_version` TEXT
- `subject_fingerprint` TEXT, Pen key와 embed 설정의 hash
- `result`: `pass`, `fail`, `warning`
- `viewport`: `desktop`, `tablet`, `mobile`
- `failure_codes_json`, `evidence_json` TEXT
- `checked_at`, `created_at` TEXT

이미지나 녹화 화면을 증거로 저장하지 않는다. 실행 방식, viewport, Pen 식별값과 결과만 보관한다. 승인 시 현재 Pen 설정의 fingerprint와 일치하는 `pass` 기록이 필요하다.

### `review_decisions`

- `id` TEXT PK
- `target_type`: `candidate`, `entry`
- `target_id` TEXT
- `decision`: `approve`, `reject`, `needs-edit`, `merge`, `unpublish`
- `reason_code`, `note`, `changes_json` TEXT
- `actor_email_hash` TEXT, nullable
- `created_at` TEXT

관리자가 한 명이어도 결정 이력은 남긴다. 이메일 원문 대신 고정 salt로 만든 hash를 저장한다.

### `ingestion_runs`

- `id` TEXT PK
- `discovery_source_id` TEXT FK
- `status`: `running`, `success`, `partial`, `failed`, `paused-limit`
- `trigger`: `schedule`, `manual`
- `checkpoint_before`, `checkpoint_after` TEXT
- `discovered_count`, `accepted_count`, `duplicate_count`, `failed_count` INTEGER
- `started_at`, `finished_at` TEXT
- `failure_code`, `failure_detail` TEXT

### `ingestion_items`

- `id` TEXT PK
- `ingestion_run_id` TEXT FK
- `external_id` TEXT
- `request_id` TEXT
- `source_url` TEXT
- `result`: `accepted`, `duplicate`, `failed`
- `candidate_id`, `failure_code` TEXT
- `created_at` TEXT
- UNIQUE `(ingestion_run_id, external_id)`
- UNIQUE `request_id`

### `ingestion_requests`

- `request_id` TEXT PK
- `key_id` TEXT
- `request_timestamp` TEXT
- `body_sha256` TEXT
- `created_at` TEXT

서명이 유효한 수집 요청 ID와 본문 해시를 보관해 같은 요청의 재전송을 거절한다. 수집 본문과 HMAC 비밀값은 저장하지 않는다.

## 8. 익명 제보와 집계

### `submissions`

- `id` TEXT PK
- `submitted_url` TEXT
- `normalized_url_hash` TEXT UNIQUE
- `note` TEXT, 300자 이하
- `status`: `received`, `linked`, `rejected`
- `source_id` TEXT FK, nullable
- `created_at`, `updated_at` TEXT

IP, Turnstile 토큰과 브라우저 fingerprint는 저장하지 않는다.

### `daily_metrics`

- `metric_date` TEXT
- `metric_key` TEXT
- `dimension_key` TEXT
- `count` INTEGER
- PK `(metric_date, metric_key, dimension_key)`

개별 행동 행을 장기간 저장하지 않고 필요한 집계를 같은 UTC 날짜 버킷에 누적한다.

Cloudflare 운영 사용량은 `dimension_key = 'cloudflare'`로 저장하고 `worker_requests`, `d1_rows_read`, `d1_rows_written`을 `metric_key`로 사용한다. 동기화 값은 조회 시점의 절대값이므로 같은 날짜의 행을 upsert해 교체한다.

## 9. 필수 인덱스

```text
sources(canonical_url) UNIQUE
candidates(status, priority_score DESC, created_at)
candidates(deduplication_key) UNIQUE
animation_entries(slug) UNIQUE
animation_entries(status, published_at DESC, id)
animation_entries(status, featured DESC, published_at DESC, id)
animation_entries(difficulty, status, published_at DESC, id)
tags(axis, key) UNIQUE
entry_tags(tag_id, animation_entry_id)
pattern_entries(pattern_id, position, animation_entry_id)
codepen_refs(pen_key) UNIQUE
source_discoveries(discovery_source_id, external_id) UNIQUE
ingestion_runs(discovery_source_id, started_at DESC)
ingestion_requests(created_at)
review_decisions(target_type, target_id, created_at DESC)
validation_runs(target_type, target_id, checked_at DESC)
admin_idempotency_keys(operation, target_id)
```

검색은 초기에는 `search_text`의 제한된 LIKE 검색과 태그 인덱스를 사용한다. 콘텐츠 규모와 실제 쿼리 비용을 측정하기 전에는 별도 검색 엔진을 추가하지 않는다.

## 10. 승인 트랜잭션

Candidate 승인 시 D1 batch에서 다음 조건과 쓰기를 함께 수행한다.

```text
candidate version/status 확인
→ animation_entries INSERT
→ codepen_refs INSERT
→ entry_tags INSERT
→ review_decisions INSERT
→ candidates status/version UPDATE
```

영향받은 행 수가 예상과 다르거나 어느 UNIQUE 제약이 충돌하면 승인 전체를 실패시킨다. API는 원인을 `VERSION_CONFLICT`, `DUPLICATE_SOURCE`, `DUPLICATE_SLUG` 중 하나로 반환한다.

### `admin_idempotency_keys`

- `key` TEXT PK
- `operation` TEXT
- `target_id` TEXT
- `result_id` TEXT
- `created_at` TEXT

관리자 승인 재시도에서 같은 작업 결과를 반환하고 Entry 중복 생성을 막는다.

## 11. Migration 계획

```text
0001_core_sources.sql
0002_candidates.sql
0003_entries_and_tags.sql
0004_patterns_and_collections.sql
0005_validation_reviews_and_ingestion.sql
0006_submissions_and_metrics.sql
0007_seed_tags.sql
0008_seed_legacy_examples.sql
0009_admin_idempotency.sql
0010_ingestion_security.sql

별도 seed인 `db/seeds/wp6.sql`은 공개 Pattern, Collection과 Entry 연결을 멱등하게 구성한다.
```

각 migration에는 다음 증거가 필요하다.

- 빈 데이터베이스 적용 성공
- 모든 migration 재구성 성공
- 대표 fixture 삽입 성공
- 중복 키와 잘못된 상태 거절 확인
- 이전 migration 파일 checksum 유지
