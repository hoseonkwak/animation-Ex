# Phase 2 Practice 운영 점검과 중지 절차

상태: Preview에서 Kit 10건과 중지·복구를 검증했다. Production의 Practice Kit은 아직 배포하지 않았다.

## 공개 순서

1. `PHASE2_EXECUTION_PLAN.md`의 P2-CONTENT·SEC·UX 조건과 Kit별 `QUALITY_GATES.md`를 확인한다. 결정적 검사 결과와 사람의 권리·화면 검수 기록을 분리한다.
2. Production D1 백업을 만들고 복구 리허설을 확인한다. `npm run verify:deploy:preview`와 Preview 배포 후 Kit API·작업 공간을 점검한다.
3. Preview에서 새 초안, 기존 초안 이어가기, 새 Kit 버전 시작, 저장 실패, CodePen 내보내기, 10개 실행 화면을 확인한다.
4. `npm run verify:deploy:production`을 통과한 뒤 Worker를 배포하고, 승인된 Kit 버전만 Production D1에 입력한다. `db:seed:production`에는 Practice Kit fixture가 포함되지 않으므로 별도 적용 기록이 필요하다.
5. 공개 API에서 10개 Kit의 버전·권리 메타데이터와 실제 실행을 확인하고 `PHASE2_EXECUTION_PLAN.md`에 증거를 남긴다. 원본 Pen의 빈 코드 연습도 점검한다.

## 관찰

- 공개 읽기 API `/api/v1/examples/:slug/practice-kit`의 200·404·5xx 비율과 요청 ID를 확인한다. 코드 본문, 브라우저 초안, Console 출력은 운영 로그로 수집하지 않는다.
- Preview의 CSP 위반, 실행 중단·시간 초과와 CodePen 전송 실패를 재현 가능한 URL·브라우저·Kit 버전으로 기록한다. 사용자 작성 코드는 문제 제보에 자동 첨부하지 않는다.
- 기본 브라우저 검사는 Chromium이며, `KWAK_CROSS_BROWSER=1`을 켜면 Firefox·WebKit 연습 시나리오를 실행한다. 브라우저 실행 환경 오류와 제품 실패를 구분해 남긴다.

## CodePen 실제 수신 확인

1. 일반 브라우저에서 Preview의 `/practice`를 열어 새 연습을 시작하고 HTML에 `<main>CodePen prefill check</main>`를 입력한다.
2. `CodePen으로 보내기`를 한 번 누른다. 새 창이 막히면 화면의 복사 안내를 확인하고 브라우저의 팝업 차단 상태를 점검한다.
3. CodePen이 추가 확인 화면을 요구하면 사람이 직접 완료한다. 열린 편집기의 HTML에 위 샘플 문구가 있고 CSS·JS도 현재 연습 코드와 같은지 확인한다. Pen을 저장하거나 공개할 필요는 없다.
4. 결과 화면, 브라우저, 확인 시각을 `docs/evidence/`에 기록한다. 자동화가 CodePen의 확인 화면이나 403에 막혔다면 수신 성공으로 표시하지 않는다.

## 중지와 복구

- 특정 Kit에 권리·실행·보안 문제가 생기면 해당 `practice_kits.status`를 `paused`로 변경한다. 공개 API는 중지된 Kit을 반환하지 않는다. 해당 Entry의 빈 코드 연습은 계속 제공한다.
- 이미 브라우저에 저장된 초안은 서버에서 수정·삭제하지 않는다. 기존 초안의 Kit 버전 ID, 시작 코드, 사용자 코드를 유지한다. 새 Kit으로 시작하려면 사용자가 별도 초안을 만든다.
- Worker 문제가 전체 Practice에 영향을 주면 직전 정상 Worker 버전으로 롤백하고 `/practice`, `/practice/new`, 예제 상세와 공개 API를 다시 점검한다. D1의 코드 버전 본문은 불변이므로 덮어쓰지 않고, 수정은 새 버전과 Kit 포인터 교체로 처리한다.
- 중지·롤백 전후의 Kit ID, 버전, 시각, 증상, 확인 결과를 `docs/evidence/`에 기록한다. Phase 2 완료 표시는 운영 smoke와 복구 증거가 갖춰진 뒤에만 한다.
