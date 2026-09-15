# WP1 데이터와 API 수직 절편 결과

기록일: 2026-09-16
작업 브랜치: `codex/phase1-foundation`
상태: 완료

## 구현 결과

- `D1_SCHEMA.md`의 0001~0007 migration을 실제 SQL로 작성했다.
- GSAP, Trigger, Motion, Section, Technique, Difficulty와 Mood 초기 태그를 추가했다.
- 기존 저장소의 `hoseonkwak` CodePen 3개를 공개 fixture로 만들었다.
- 공개 상태 누출 검사용 draft fixture 1개를 추가했다.
- `GET /api/v1/examples` 목록 API와 `GET /api/v1/examples/:slug` 상세 API를 구현했다.
- 같은 태그 축은 OR, 서로 다른 축은 AND로 결합하는 repository 쿼리를 구현했다.
- 알 수 없는 필터, 잘못된 limit·정렬·cursor를 구조화된 400 응답으로 거절한다.
- Vue 홈 화면이 D1 API에서 예제 3개를 가져와 공식 CodePen iframe으로 실행한다.
- 로컬 D1 migration과 seed를 E2E 시작 전에 자동 적용한다.

## Migration checksum

| Migration | SHA-256 |
|---|---|
| `0001_core_sources.sql` | `239EE7AFAE32D99B8BB0F28C955C66DD1D3A15F6634B0D59606BEB2E322DBBFB` |
| `0002_candidates.sql` | `619190F4C0F060AD04AD47B4A8A64B3D67FA3B1055DE920FF51C68A4E270F822` |
| `0003_entries_and_tags.sql` | `62ABA385B153F1D39510FCB50757237C204F6D11018C9899777F0F3C6425E160` |
| `0004_patterns_and_collections.sql` | `B5037CAD63243B2748CC7044BAB7908B963948D5231F8FAD3055D62678B1B03B` |
| `0005_validation_reviews_and_ingestion.sql` | `ACB3902972A17F5F641AA66B4A21B3179093D24A8DBB455C38505E853F236B7A` |
| `0006_submissions_and_metrics.sql` | `3BFD07503B749D888A6E46FD326003373E7B92D3CAA298CE571A546BAAB04133` |
| `0007_seed_tags.sql` | `AD84761F55E696D4FD0E0EEB1D1D281B93854EEB22862868488AD5C8804DBCD3` |

적용한 migration 파일은 수정하지 않고 이후 변경은 새 번호로 추가한다.

## 검증 증거

| 검사 | 결과 |
|---|---|
| 빈 Node SQLite에 0001~0007 재구성 | 통과 |
| Wrangler local D1 migration 적용 | 통과 |
| Wrangler local D1 seed 적용 | 통과 |
| DB CHECK 제약의 잘못된 published 행 거절 | 통과 |
| API 계약 및 migration Vitest | 7건 통과 |
| 전체 Vitest | 3 files, 9 tests 통과 |
| Playwright | 3건 통과 |
| TypeScript | 통과 |
| ESLint | 통과 |
| Production build | 통과 |

실제 브라우저에서도 공개 카드 3개와 각 CodePen 공식 embed가 로드되는 것을 확인했다. CodePen의 HTML, CSS, JS, Result 탭과 Rerun 제어가 iframe 안에 나타났으며 이미지나 녹화 화면을 사용하지 않았다.

## 공개 데이터 보호

- 목록 SQL은 `animation_entries.status = 'published'`를 항상 포함한다.
- 상세 SQL도 slug와 `published` 상태를 함께 확인한다.
- draft fixture는 목록에 포함되지 않고 상세 요청은 404를 반환한다.
- 공개 응답에는 Candidate 실패 정보, deduplication key와 관리자 메모가 포함되지 않는다.
- DB 열 이름은 repository 안에서 API의 camelCase 타입으로 변환한다.

## 다음 단계

WP2에서 Preview 상태와 동시 실행 scheduler를 추가하고 검색, 다축 필터, cursor pagination, URL 복원과 반응형 동작을 완성한다.
