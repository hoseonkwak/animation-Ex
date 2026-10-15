# Phase 1 현재 상태 감사

검증일: 2026-10-15
대상: `codex/liquid-redesign`, Preview·Production Worker, GitHub OAuth, 공개 CodePen Preview와 WP8 후보 큐

## 결론

- 이번 GitHub OAuth 구현에서 공개 차단 수준의 코드·보안 결함은 발견되지 않았다.
- Preview와 Production은 서로 다른 OAuth App, Client Secret과 세션 비밀값을 사용한다.
- 실제 owner 로그인, Candidate Inbox 로딩과 환경별 원격 smoke가 통과했다.
- Production의 검수 대기 후보는 1,861개이며, 새 WSSS 후보는 아직 공개되지 않았다.
- 기존 공개 Entry는 15개다. Hero 목표는 20개 중 1개 공개로 19개가 부족하다.
- 가장 오래된 관리자 튜토리얼 후보의 CodePen 404는 새 OAuth나 수집 코드가 만든 문제가 아니다. 2025년 기존 정적 페이지에서 가져온 외부 Pen 주소가 현재 CodePen에서 존재하지 않는 상태다.

## 자동 검증

| 검사 | 결과 |
| --- | --- |
| 포맷 | 통과 |
| TypeScript | 통과 |
| ESLint | 통과 |
| Vitest | 15 files, 78 tests 통과 |
| Production build | Node 24.19.0, Worker·client 성공 |
| Playwright E2E | 16 tests 통과 |
| Preview 원격 smoke | 5개 통과 |
| Production 원격 smoke | 5개 통과 |
| OAuth 실제 로그인 | Preview·Production owner 로그인과 Inbox 로딩 통과 |
| 비밀값 번들 검사 | `.dev.vars.production` 값의 server·client bundle 포함 0건 |

## 404 원인

문제 후보:

```text
candidate-admin-tutorial
https://codepen.io/GreenSock/pen/LYpgKPe
```

확인 결과:

1. 주소는 기존 정적 파일 `pages/animation/gsap/toturial-1.html`에 2025-06-19부터 있었다.
2. WP4가 자동 공개하지 않고 관리자 검수 후보로만 옮겼다.
3. 현재 일반 브라우저의 Pen과 embed 화면은 CodePen 자체 404를 표시한다.
4. `cdpn.io/GreenSock/fullembedgrid/LYpgKPe`도 HTTP 404다.
5. 현재 검색 결과에서 같은 Pen ID나 대체된 공식 주소를 확인하지 못했다.

따라서 확인 가능한 직접 원인은 외부 Pen의 현재 접근 불가다. 최초 주소 오타인지 이후 삭제·비공개 전환인지는 현재 자료만으로 확정할 수 없다. 이 후보는 공개 Entry가 아니므로 공개 사용자에게 노출되지 않는다. 관리자 화면에서 `Preview 실패`를 기록하고 `source-unavailable` 사유로 거절하는 것이 다음 조치다.

## 확인된 제한과 남은 위험

### 콘텐츠 검수 병목

- 후보 1,861개가 모두 `review`이며 실제 Preview, 메타데이터와 라이선스 확인이 필요하다.
- WP8 표본 5개는 Preview가 실행되지만 한국어 요약, slug, 난이도, 상호작용 안내와 축별 태그 보완이 남았다.
- Hero 후보 풀은 44개지만 공개 가능한 19개를 아직 확정하지 않았다.

### Phase 1 미완료 항목

- 무거운 예제의 별도 Run 정책
- Reference 일괄 승인
- 공개 중지의 관리자 UI
- 일괄 승인이 개별 Preview 확인을 우회하지 않는 계약
- 공개 Preview 오류 모니터링 화면
- 예약 수집 중단 후 수동 복구 증거

### 운영 검증

- 다른 GitHub 계정의 원격 차단은 계약 테스트로 확인했지만 실제 두 번째 계정 검증은 하지 않았다.
- Cloudflare Analytics 읽기 전용 token과 일일 예약 workflow는 아직 활성화하지 않았다.
- Preview와 Production에 이전 `ADMIN_EMAIL` secret이 남아 있다. 새 코드는 이 값을 읽지 않으므로 동작 영향은 없지만, 운영 설정 정리 때 삭제할 수 있다.

### CodePen 재검증 제약

기존 공개 15개를 Headless Playwright로 재검증하면 CodePen의 Cloudflare 봇 검증이 HTTP 403을 반환한다. 이는 Pen 404와 다른 자동화 환경 차단이다. 기존 15개 검증 증거는 덮어쓰지 않았고, 대표 공개 Pen `LEVeYQO`는 일반 인앱 브라우저에서 Result iframe과 Rerun 버튼이 정상 로드됐다. 향후 정기 검사는 브라우저 검증 차단과 실제 Pen 실패를 별도 상태로 기록해야 한다.

## 다음 순서

1. `candidate-admin-tutorial`을 Preview 실패·출처 이용 불가로 처리한다.
2. WP8 정상 표본 5개의 메타데이터를 보완하고 개별 ValidationRun을 저장한다.
3. 표본 승인 후 공개 Explore와 상세 화면을 재검증한다.
4. Hero 우선 후보를 검수해 공개 수를 20개까지 늘린다.
5. 남은 Phase 1 관리자·운영 항목을 구현하고 완료 증거를 연결한다.
