# Phase 1 마감 검증 (2026-10-21)

## 공개 서비스와 자동 공개

- Production Worker `kwak-motion-lab-production` 버전 `154850f3-d88b-4105-9ad0-6ab3479d4d25`에 공개 예제 점검·중지와 WSSS 원격 checkpoint API를 배포했다.
- 배포 후 `npm run smoke:production`의 health, 공개 조회, robots/sitemap, 비로그인 홈, 관리자 비인증 차단 5개가 통과했다.
- D-043의 실제 자동 게시 증거는 [반복 승인 없는 자동 공개 기록](AUTO_PUBLICATION_HANDSFREE_2026-10-20.md)에 있다. 신규 GSAP 묶음 5건이 사전 표본 승인 없이 공개됐다.
- 운영 D1 읽기 전용 조회에서 공개 Entry 33건, 공개 Hero 태그 7건, 검수 후보 1,843건을 확인했다. Hero 20건은 초기 콘텐츠 목표이며 아직 13건이 부족하다. 미검증 후보를 목표 수량 때문에 공개하지 않는다.

## 검증 명령

| 검사 | 결과 |
| --- | --- |
| `npm run test:ingestion` | 29건 통과. 서명된 카테고리 checkpoint, 빈 신규 Pen 실행, 수집 집계를 포함한다. |
| `npm run test:contracts` | 40건 통과. 공개 오류 기록·개별 공개 중지와 410 응답을 포함한다. |
| `npm run test` | 99건 통과. |
| `npm run test:e2e` | Chromium 18건 통과. 공개 Preview 점검 UI, 탐색, 카드 실행을 포함한다. |
| `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` | 통과. |
| `npm run verify:deploy:production` | Production D1 binding과 배포 dry-run 확인. |
| `npm run ingest:wsss:preflight --workspace @kwak-motion/lab` | 실제 WSSS robots·GSAP 1건 파싱 통과. API 쓰기 없음. |
| [GitHub CI #8](https://github.com/hoseonkwak/animation-Ex/actions/runs/39539325540) | `f7c68a2`의 설치·타입·린트·테스트·빌드 통과. |

## 백업과 복구

- Production D1 SQL export를 로컬 무시 폴더 `apps/lab/.wrangler/backups/production-2026-10-21.sql`에 보관했다. 크기 3,898,599바이트, SHA-256 `7E02FA64ABFE271CED77185915F5D1990142E4793967297E0EEB8BB3E6D442D8`. 비밀이 포함될 수 있으므로 Git에 넣지 않는다.
- `npm run db:rehearse:restore`로 별도 local D1 복구를 확인했다. 공개 Entry 15건, Source 17건, Tag 44건이 복구됐다.
- 이어서 위 Production 백업 파일 자체를 별도 로컬 D1에 복원했다. SQL 9,674개 명령이 성공했고 공개 Entry 33건, 검수 후보 1,843건, 수집 실행 54건을 조회했다. 운영 D1에는 복원 명령을 실행하지 않았다.

## 남은 운영 확인

- GitHub Actions [수동 실행 #1](https://github.com/hoseonkwak/animation-Ex/actions/runs/39539396574)은 fixture 29건을 통과한 뒤 인증값이 없어 중단됐다. 이후 저장소 Actions Secrets에 `INGESTION_API_URL`, `INGESTION_KEY_ID`, `INGESTION_HMAC_SECRET` 세 이름을 등록했다. 값은 저장소나 증거 문서에 남기지 않았다.
- 인증값 등록 후 [수동 실행 #2](https://github.com/hoseonkwak/animation-Ex/actions/runs/39544825824)가 성공했다. `max_articles=1`, `max_pages=1`로 제한했고 fixture 검사와 Production API 제출 단계를 통과했다. 실행 ID `wsss-1792557335083-0cffbdfa`, 신규·중복·실패 0건, `lastPostId=1599`가 로그에 남았다. 로컬 `1603` 완료 checkpoint에서 다음 게시물 `1599`로 진행한 것이다. 이번 게시물에는 새 Pen이 없어 공개 후보를 추가하지 않았다.
- Production 서명 API를 읽기 전용으로 재조회한 결과 `Animation/GSAP`의 `lastPostId=1599`, 완료 게시물 수 2건, `1599` 포함으로 확인했다. 따라서 GitHub Actions 실행의 checkpoint가 운영 D1에 남았음을 확인했다. 다만 관리 API의 직접 D1 조회는 계정 권한 오류 `7403`으로 불가해, `ingestion_runs.trigger` 값은 직접 조회하지 못했다. 첫 실제 예약 실행의 `trigger=schedule`과 checkpoint 재개를 확인하기 전까지 `P1-OPS-08`은 미완료로 둔다.
- 같은 코드로 기존 Production HMAC을 로컬에서 사용해 1건 제한 수동 실행도 검증했다. 운영 D1 실행 `wsss-1792553920496-eadb93bb`은 `success`, `trigger=manual`, 신규·중복·실패 0건이며 `completedPostIds`에 `1603`을 기록했다.
- 운영 배포 후 GitHub owner 세션의 `/admin/review`에서 공개 예제 33건의 선택 목록, 실행 iframe, 오류 기록·공개 중지 버튼이 표시되는 것을 확인했다. 실제 운영 예제에 거짓 실패를 기록하거나 공개를 중지하지는 않았다. 계약·브라우저 검사는 로컬에서 통과했다.
- Hero 목표 20건, 월간 공개 Preview 재검사와 Analytics 일일 동기화는 운영 확장 작업으로 남는다. 추가 콘텐츠는 실제 실행과 태그 판정이 끝난 뒤 공개한다.
