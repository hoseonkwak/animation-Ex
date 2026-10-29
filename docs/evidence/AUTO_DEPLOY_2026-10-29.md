# master 자동 배포 준비 증거 · 2026-10-29

## 확인한 상태

- GitHub Actions `CI`는 기존에 `master` push에서 검증만 실행했다. Preview·Production 배포 단계는 없었다.
- GitHub `production` 환경을 만들고 배포 가능 브랜치를 `master`로 제한했다. 공개 Turnstile site key 두 개는 저장소 Actions 일반 변수로 등록했다.
- Cloudflare 계정 전용 API token `kwak-motion-lab-github-deploy`를 `Workers Scripts Write` 단일 권한, 1년 만료로 만들고 GitHub `production` 환경의 `CLOUDFLARE_API_TOKEN` secret에 등록했다. 같은 환경에 계정 ID secret도 등록했다. 토큰 값은 증거 문서에 남기지 않는다.
- Preview D1은 적용 대기 migration이 없었다.
- Production D1에는 `0014_practice_kits.sql`만 적용 대기였다. 적용 전에 Git 무시 경로 `apps/lab/.wrangler/backups/production-before-0014-2026-10-29.sql`에 전체 SQL 백업을 저장했다. 크기 6,869,395 bytes, SHA-256 `3610702A4B61D6644769AE0471C398CD258B29FBF066304DAB48CE364E74DFC9`.
- Production D1에 `0014_practice_kits.sql` 적용 후 대기 migration이 없고 `practice_kits`와 `code_package_versions`는 모두 0건임을 읽기 전용 조회로 확인했다. 소유자 검수 전 Kit seed는 수행하지 않았다.
- Preview와 Production의 `verify:deploy` dry-run에서 각 Worker 이름, D1 binding과 환경 변수를 확인했다.
- 배포 전 기존 Preview·Production의 health, 공개 예제, robots, Home과 비인증 관리자 API smoke가 모두 통과했다.

## 첫 자동 배포 결과

- `bd41e2e`를 `master`에 push하자 [GitHub Actions CI #16](https://github.com/hoseonkwak/animation-Ex/actions/runs/40834451212)가 자동 시작됐다. `verify` 40초, `deploy-production` 56초 모두 성공했다.
- 배포 job에서 Preview dry-run·Worker 배포·smoke, Production dry-run·Worker 배포·smoke가 순서대로 통과했다.
- Cloudflare Production의 새 Worker 버전 `81a9af38-2064-44f4-b004-2f7d8f713225`가 2026-10-29 07:18:48 UTC에 100% 활성화됐다.
- 공개 Production `/practice`는 HTTP 200, 공개 Pen의 Kit API는 Kit이 없는 경우 HTTP 404를 반환했다. 이 결과는 Kit fixture를 공개하지 않은 현재 상태와 일치한다.
- 이후 변경도 같은 `master` push 경로로 배포한다. D1 migration과 Kit seed는 [운영 Runbook](../RUNBOOK.md#배포)의 별도 절차를 따른다.
