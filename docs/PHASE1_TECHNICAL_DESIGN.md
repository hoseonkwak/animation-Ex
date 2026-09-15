# Phase 1 무료 운영 기술 설계

문서 상태: Draft v0.1
기준일: 2026-09-15
범위: Executable Library를 월 고정비 없이 운영하기 위한 초기 기술 구성

## 1. 결정 요약

Phase 1은 다음 구성으로 시작한다.

| 영역 | 선택 | 역할 |
|---|---|---|
| 사용자 및 관리자 웹 | Vue 3 + TypeScript + Vite | 공개 탐색 화면과 관리자 검수 화면 |
| 배포 및 API | Cloudflare Workers + Static Assets | Vue 파일 배포, 공개 조회 API, 관리자 쓰기 API |
| 데이터베이스 | Cloudflare D1 | 콘텐츠, 태그, 출처, 승인 및 수집 이력 |
| 예약 수집 | GitHub Actions | WSSS 목록 순회, 정규화, 중복 검사와 후보 등록 |
| 원본 실행 | CodePen Embed | Phase 1 공개 Preview |
| 개인 데이터 | IndexedDB, localStorage | 북마크, 나중에 연습, 테마 |
| 관리자 인증 | Cloudflare Access + 이메일 허용 목록 | 소유자 한 명의 관리자 경로와 API 보호 |
| 익명 제보 보호 | Cloudflare Turnstile | URL 제보 자동화 남용 방지 |
| 오류 및 운영 지표 | 구조화 로그 + 관리자 집계 화면 | 유료 관측 도구 없이 초기 운영 상태 확인 |

사용자 계정, AI API, 별도 검색 서비스, 객체 스토리지와 작업 큐는 Phase 1에 도입하지 않는다.

## 2. 선택 이유

### 하나의 배포 단위

Worker가 Vue 정적 파일과 API를 함께 제공한다. 프런트엔드와 API의 도메인이 같아 CORS와 배포 구성이 단순하고, D1을 Worker binding으로 직접 사용할 수 있다.

```text
Browser
  └─ Cloudflare Worker
       ├─ Vue static assets
       ├─ /api/public/*
       ├─ /admin/*
       ├─ /api/admin/*
       └─ D1 binding

GitHub Actions
  └─ /api/ingestion/*
       └─ D1 candidate records
```

### 긴 수집 작업의 분리

무료 Worker는 요청당 CPU 시간이 짧다. 여러 페이지를 순회하고 HTML을 분석하는 WSSS 수집은 GitHub Actions에서 실행한다. Worker는 작은 조회와 검증된 후보의 저장만 담당한다.

### 실행 화면의 원칙 유지

Phase 1의 공개 콘텐츠는 원본 CodePen Embed로 실행한다. 썸네일, 녹화 영상 또는 GIF를 실행 화면 대신 사용하지 않는다. 자체 코드 실행 환경은 격리 출처와 보안 정책이 필요한 Phase 2에서 구축한다.

## 3. 애플리케이션 경계

### 공개 경로

- `/`: Home
- `/explore`: 검색과 필터
- `/sections/:slug`: Hero 등 Section 허브
- `/examples/:slug`: 상세와 실행 Preview
- `/saved`: 브라우저에 저장한 예제
- `/submit`: 로그인 없는 URL 제보

공개 API는 `published` 상태의 콘텐츠만 반환한다. 목록 응답에는 카드에 필요한 필드만 포함하며 본문과 운영 이력은 상세 요청으로 분리한다.

### 관리자 경로

- `/admin/candidates`: 승인 대기 목록
- `/admin/candidates/:id`: 후보 검수와 수정
- `/admin/sources`: 수집 출처와 실행 이력
- `/admin/failures`: 실패 원인과 재시도 대상

Cloudflare Access에서 소유자 이메일만 허용한다. Worker는 Access를 통과했다는 사실만 믿지 않고 전달된 신원과 환경 변수의 관리자 이메일을 다시 비교한다. 모든 쓰기 API는 같은 검사를 사용한다.

### 수집 경로

GitHub Actions는 예약 실행과 수동 실행을 모두 지원한다.

```text
fetch source index
→ extract canonical CodePen URLs
→ normalize metadata
→ create deterministic fingerprint
→ submit in small batches
→ store per-item result
```

수집 API는 전용 비밀값으로 서명한 요청만 받고, 본문 크기와 한 번에 처리할 후보 수를 제한한다. 같은 입력을 반복 전송해도 같은 후보로 합쳐져야 한다. 사용자 URL 제보는 Turnstile 토큰을 서버에서 검증한 뒤 저장한다.

## 4. 저장 구조

D1에는 Phase 1에 필요한 텍스트와 관계 데이터만 둔다.

- `contents`: 제목, 설명, slug, 난이도, 공개 상태
- `sources`: 발견 URL, canonical URL, 출처 종류와 작성자
- `codepen_refs`: Pen ID, embed URL과 실행 상태
- `tags`, `content_tags`: 분류 체계
- `candidates`: 추출 결과와 검수 상태
- `reviews`: 승인, 거절, 수정 이력
- `ingestion_runs`, `ingestion_items`: 수집 실행과 개별 결과
- `submissions`: 익명 URL 제보와 처리 상태

CodePen HTML을 복사해 저장하지 않는다. 일반 웹 기반의 자체 CodePackage 저장은 Phase 2 스키마 migration으로 추가한다.

## 5. 검색 설계

Phase 1은 외부 검색 엔진 없이 D1 쿼리로 처리한다.

- 제목, 설명과 검색용 정규화 문자열을 저장한다.
- Technology, Trigger, Motion, Section, Technique와 Difficulty는 관계 테이블과 인덱스로 필터링한다.
- 목록은 cursor pagination을 사용한다.
- 검색어 길이, 필터 수와 페이지 크기를 제한한다.
- 자주 사용하는 Home과 Section 응답은 짧게 캐시한다.

자연어 검색과 벡터 검색은 비용, 품질과 실제 사용량을 확인한 뒤 별도 결정한다.

## 6. 무료 한도 보호 규칙

Cloudflare의 2026-09-15 문서 기준으로 Workers Free는 하루 100,000 요청, D1은 하루 5백만 행 읽기와 10만 행 쓰기 한도를 제공한다. D1 무료 데이터베이스는 하나당 500MB, 계정 전체 5GB까지다. 이 값은 공급자가 바꿀 수 있으므로 배포 전에 공식 문서를 다시 확인한다.

다음 규칙을 기본값으로 둔다.

- 카드 목록의 페이지 크기는 24개 이하로 제한한다.
- 카드 Preview는 화면 진입 시 지연 로드하고 동시 실행 수를 제한한다.
- 태그와 Section 목록은 캐시하고 매 카드마다 별도 쿼리하지 않는다.
- 수집 후보는 작은 batch로 upsert하고 하루 최대 처리량을 설정한다.
- 동일 canonical URL과 fingerprint는 쓰기 전에 중복 제거한다.
- 익명 제보에는 속도 제한, URL 정규화와 중복 검사를 적용한다.
- 일일 요청, D1 읽기와 쓰기 사용량이 경고선에 도달하면 수집을 멈추고 공개 조회를 우선한다.
- 결제 수단이 필요한 유료 기능은 별도 결정 없이 활성화하지 않는다.

초기 경고선은 각 무료 한도의 70%, 중지선은 90%로 둔다. 실제 운영 데이터가 쌓이면 조정한다.

## 7. GitHub Actions 운영 조건

공개 저장소의 표준 GitHub-hosted runner는 무료로 사용할 수 있다. 비공개 저장소는 계정별 무료 실행 시간 한도 안에서만 무료다.

- 매일 1회, 정각을 피한 시간에 실행한다.
- `workflow_dispatch`로 수동 재실행할 수 있게 한다.
- 한 번에 모든 과거 페이지를 처리하지 않고 checkpoint 이후만 순회한다.
- 실패한 항목은 성공 항목과 분리해 artifact와 D1 실행 이력에 남긴다.
- 공개 저장소의 예약 workflow는 60일 동안 저장소 활동이 없으면 비활성화될 수 있으므로 관리자 화면에 마지막 성공 시간을 표시한다.
- 예약 실행이 멈춰도 수동 실행으로 복구 가능해야 한다.

저장소 공개 여부가 확정되기 전에는 실행 시간을 짧게 유지하고 수동 실행을 기본 복구 수단으로 둔다.

## 8. 배포 환경

| 환경 | 목적 | 데이터 |
|---|---|---|
| local | 개발과 fixture 검증 | 로컬 D1 |
| preview | 변경 검수 | 별도 preview D1 또는 읽기 전용 fixture |
| production | 공개 서비스 | production D1 |

Preview 배포는 검색엔진 색인을 막고 Access로 보호한다. Preview가 production D1에 쓰지 못하도록 binding을 분리한다.

초기 공개 주소는 무료 `workers.dev` 주소를 사용할 수 있다. 브랜드 도메인은 도메인 구매비가 생기므로 서비스 방향을 확인한 뒤 연결한다.

## 9. 백업과 이전 가능성

- D1 migration SQL을 Git에 저장하고 순서대로만 적용한다.
- 매주 핵심 테이블을 JSON 또는 SQL 형태로 내보내 로컬 백업한다.
- 출처 adapter와 분류 로직은 Cloudflare API에 직접 의존하지 않는 TypeScript 모듈로 작성한다.
- 프런트엔드는 API 계약만 사용하며 D1 스키마를 알지 못한다.
- 콘텐츠 ID, canonical URL과 slug는 공급자를 바꿔도 유지한다.

이 경계를 지키면 사용량이 커질 때 데이터베이스나 예약 실행 공급자만 교체할 수 있다.

## 10. 유료 전환 조건

다음 중 하나가 반복될 때만 유료 전환안을 검토한다.

- 무료 한도의 70%를 7일 이상 사용한다.
- 수집 대기열이 3일 이상 밀린다.
- 데이터 용량이 400MB를 넘는다.
- 캐시와 쿼리 개선 후에도 사용자 조회가 한도를 압박한다.
- 오류 원인을 무료 로그만으로 진단하기 어렵다.

전환 전에는 사용량 원인, 최적화 결과, 예상 월 비용과 되돌리는 방법을 결정 기록에 남긴다.

## 11. 구현 순서

1. Vue/Vite/TypeScript와 Worker 개발 환경 구성
2. D1 migration과 fixture 작성
3. 공개 조회 API와 Explore 화면
4. 기존 15개 예제 migration
5. CodePen Preview 지연 로딩
6. Access 기반 관리자 검수 화면과 쓰기 API
7. WSSS 수집 adapter와 GitHub Actions
8. 익명 URL 제보
9. 무료 한도 집계, 백업과 복구 검증

## 12. 구현 전 확인 항목

- 저장소를 공개로 운영할지 결정
- Cloudflare 계정과 `workers.dev` subdomain 준비
- 관리자 이메일 확정
- WSSS 최초 수집 범위와 실행 주기 확정
- GitHub Actions와 Cloudflare에 넣을 비밀값 목록 작성

## 13. 공식 참고 자료

- [Cloudflare Workers 한도](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers 요금](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 한도](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare Access와 Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [GitHub Actions 사용량과 과금](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [GitHub Actions 예약 실행](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
