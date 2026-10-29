# master 자동 배포 준비 증거 · 2026-10-29

## 확인한 상태

- GitHub Actions `CI`는 기존에 `master` push에서 검증만 실행했다. Preview·Production 배포 단계는 없었다.
- GitHub `production` 환경을 만들고 배포 가능 브랜치를 `master`로 제한했다. 공개 Turnstile site key 두 개는 저장소 Actions 일반 변수로 등록했다.
- Preview D1은 적용 대기 migration이 없었다.
- Production D1에는 `0014_practice_kits.sql`만 적용 대기였다. 적용 전에 Git 무시 경로 `apps/lab/.wrangler/backups/production-before-0014-2026-10-29.sql`에 전체 SQL 백업을 저장했다. 크기 6,869,395 bytes, SHA-256 `3610702A4B61D6644769AE0471C398CD258B29FBF066304DAB48CE364E74DFC9`.
- Production D1에 `0014_practice_kits.sql` 적용 후 대기 migration이 없고 `practice_kits`와 `code_package_versions`는 모두 0건임을 읽기 전용 조회로 확인했다. 소유자 검수 전 Kit seed는 수행하지 않았다.
- Preview와 Production의 `verify:deploy` dry-run에서 각 Worker 이름, D1 binding과 환경 변수를 확인했다.

## 남은 활성화 확인

- 계정 범위를 제한한 Cloudflare 배포 API token을 GitHub `production` 환경 secret에 등록한다.
- 새 CI workflow를 `master`에 반영한 뒤 `verify → Preview 배포 → Preview smoke → Production 배포 → Production smoke`의 실제 성공 기록을 확인한다.
