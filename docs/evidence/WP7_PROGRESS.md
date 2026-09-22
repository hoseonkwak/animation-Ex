# WP7 배포와 운영 안전장치 진행 기록

상태: 진행 중
검증일: 2026-09-22

## 구현 완료

- local, preview와 production Worker/D1 binding 분리
- Cloudflare Vite 빌드 전에 대상 환경을 고정하는 배포 스크립트
- preview 전체 검색 색인 차단과 예약 수집 기본 중지
- 무료 한도 70% 경고 및 90% 신규 ingestion batch 중지
- 관리자 운영 상태 API와 화면 표시
- 외부 CodePen iframe sandbox 정책
- 처리하지 못한 Worker 오류의 request ID 기반 구조화 로그
- 로컬 D1 export를 임시 새 D1에 적용하는 복구 리허설
- Cloudflare GraphQL Analytics 응답 fixture와 합산 계약
- HMAC 인증 사용량 API와 `daily_metrics` 절대값 upsert
- 수동 `Cloudflare daily usage` workflow
- 공개 Preview와 관리자 경계를 확인하는 원격 smoke 명령과 수동 workflow
- APAC 원격 Preview D1 생성, migration 10개와 공개 seed 적용
- `kwak-motion-lab-preview` Worker 배포와 실제 HTTPS smoke 통과
- Cloudflare Analytics 실제 사용량을 Preview `daily_metrics`에 최초 동기화
- Preview 도메인 전용 무료 Turnstile managed 위젯과 Worker secret 연결
- Vite mode를 배포 환경과 일치시켜 환경별 Turnstile site key를 분리
- Preview를 이전 검증 버전으로 실제 롤백한 뒤 최신 버전으로 복원
- APAC 원격 Production D1 생성, migration 10개와 공개 seed 적용
- Production 전용 Turnstile 위젯, Worker secret과 Vite site key 연결
- `kwak-motion-lab-production` Worker 배포와 실제 HTTPS smoke 통과
- Production 홈의 카테고리 5개와 예제 카드 12개 브라우저 렌더링 확인
- Cloudflare Analytics 실제 사용량을 Production `daily_metrics`에 최초 동기화

## 검증 결과

| 검사                      | 결과                                            |
| ------------------------- | ----------------------------------------------- |
| 환경 분리 계약            | local, preview, production D1 이름 중복 0       |
| preview deploy dry-run    | `kwak-motion-lab-preview` binding 확인          |
| production deploy dry-run | `kwak-motion-lab-production` binding 확인       |
| 무료 한도 fixture         | 70% warning, 90% paused 통과                    |
| D1 복구 리허설            | 공개 Entry 15, Source 17, Tag 37 복구 확인      |
| 구조화 오류 로그          | request ID, method, path, 환경과 오류 정보 확인 |
| 사용량 GraphQL fixture    | Worker 요청과 D1 읽기·쓰기 합산 확인            |
| 사용량 API                | 70% warning, 90% paused 및 멱등 upsert 확인     |
| Preview smoke fixture     | 공개 조회, noindex, 비인증 관리자 차단 확인     |
| 원격 Preview D1           | Migration 10, 공개 Entry 15, Source 17, Tag 37  |
| 원격 Preview Worker       | Version `96ef0bdd`, 실제 smoke 5개 통과         |
| 브라우저 공개 화면        | 카테고리와 공개 예제 카드 렌더링 확인           |
| Preview URL 제보          | Turnstile 위젯 표시와 검증 후 버튼 활성화 확인  |
| Preview Worker secret     | `TURNSTILE_SECRET_KEY` 등록 확인                |
| Preview rollback          | `3e0b8209` smoke 통과 후 `96ef0bdd` 복원·재통과 |
| 원격 Production D1        | Migration 10, 공개 Entry 15, Source 17, Tag 37  |
| 원격 Production Worker    | Version `301c0f68`, 실제 smoke 5개 통과         |
| Production 브라우저 화면  | 카테고리 5개, 예제 카드 12개와 Turnstile 확인  |
| Production Worker secret  | 관리자·ingestion·Turnstile secret 4개 확인      |
| Preview 실제 일일 사용량  | 요청 11, D1 읽기 1,313, 쓰기 1,134, normal      |
| Production 실제 사용량    | 요청 6, D1 읽기 1,284, 쓰기 1,134, normal       |

복구 리허설 명령:

```bash
npm run db:rehearse:restore
```

## 남은 작업

- 결제 등록 없이 가능한 Cloudflare Access 연결 방법 재검토
- Analytics 읽기 전용 API token 생성 후 일일 workflow 활성화 검토
