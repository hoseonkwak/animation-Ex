# 남은 CodePen 후보 전량 공개 증거

확인일: 2026-10-27
요청: 현재 승인 대기인 수집 후보를 모두 사이트에 공개

## 적용 전 확인

- Production `review` 1,836건, `approved` 40건.
- 1,836건 모두 CodePen URL·작성자·라이선스와 근거가 있으며 기존 CodePenRef와 URL이 겹치지 않는다. 생성할 slug 충돌과 허용하지 않는 ID 문자도 0건이었다.
- 781건에는 확정 탐색 태그가 없고, 실행 확인 이력이 있는 후보는 1건뿐이었다. 이 일괄 공개는 실행 품질을 보증하지 않는다.
- 미검증 공개 상태 `runtime_verified=0`, 카드·상세 안내, 검색 색인 제외, 묶음 단위 감사 기록과 취소 SQL을 준비했다.
- 전체 Production DB export는 수행하지 않았다. 일괄 적용 범위만 중지하는 `db/ops/rollback_pending_unverified.sql`을 로컬 계약 테스트에서 검증했다.

## 로컬 검증

- 깨끗한 작업 트리에서 migration·seed 후 일괄 SQL을 실행하고 재실행해 중복 등록이 없는지 확인했다.
- 계약 테스트는 공개 상세 `runtimeVerified=false`, 정확한 전체 수, sitemap 제외, 취소 후 410 응답을 확인했다.
- 타입 검사, Production 빌드, lint, 포맷 검사를 통과했다.

## Production 적용 및 결과

- `0013_bulk_unverified_publication.sql` migration 적용.
- 실행 미확인 표시를 포함한 앱 배포 버전: `3edb1c2c-4890-4568-8bd8-3eae8fc26b27`.
- 일괄 실행 ID `bulk-2026-10-27`: 요청 1,836건, 게시 1,836건, 상태 `completed`. D1 실행 결과 8개 쿼리 성공.
- Production 집계: `review` 0건, `approved` 1,876건, `published`이면서 `runtime_verified=0`인 Entry 1,836건. 일괄 항목의 CodePenRef 연결 누락 0건, 미게시 항목 0건.
- 새 예제 상세 API `/api/v1/examples/bulk-candidate-admin-tutorial`은 `runtimeVerified=false`와 제작자 정보를 반환했다.
- 홈 전체 수 표시를 포함한 앱 배포 버전: `a9663fa7-49e3-41c7-b349-d15cd530fab9`. 공개 Discovery API `totalCount=1876`, 예제 목록 24건과 다음 cursor, 첫 페이지 미검증 표시를 확인했다.

## 후속 운영

미검증 CodePen은 원본이 변경되었거나 실행되지 않을 수 있다. 공개 후 문제가 발견되면 관리자 공개 중지를 사용하고, 묶음 전체의 문제라면 검증된 `rollback_pending_unverified.sql`을 실행한다. 이후 새로 수집되는 후보는 기존 D-049의 자동 검사 정책을 따른다.
