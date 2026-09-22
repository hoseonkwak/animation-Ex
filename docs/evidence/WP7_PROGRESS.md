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

복구 리허설 명령:

```bash
npm run db:rehearse:restore
```

## 남은 작업

- 실제 Cloudflare Access와 owner 이메일 연결
- 실제 Cloudflare 계정으로 최초 일일 사용량 동기화 확인
- preview 배포 후 production D1 쓰기 차단 원격 확인
- production 배포, 대표 Preview smoke test와 rollback rehearsal
