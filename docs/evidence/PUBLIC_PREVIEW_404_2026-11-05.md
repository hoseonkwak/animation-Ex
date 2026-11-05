# 공개 Preview 404 대응 (2026-11-05)

- 대상: `GSAP ScrollTrigger 튜토리얼`, `/examples/bulk-candidate-admin-tutorial`
- 확인: 운영 관리자 iframe과 [CodePen 원본](https://codepen.io/GreenSock/pen/LYpgKPe)이 모두 CodePen 404를 표시했다. 이는 수집 요청만의 403 차단과 달리 브라우저에서도 확인된 원본 404다.
- 조치: 관리자에서 `Preview 오류 기록`을 남기고 `원본 접근 불가` 사유와 원본·Embed 404 근거를 입력해 공개를 중지했다.
- 결과: 관리자 공개 CodePen 수가 1,876건에서 1,875건으로 감소했다. 기존 상세 URL은 `410 · UNAVAILABLE` 화면을 표시한다. 후보 38건의 상태에는 영향이 없다.
- 후속: 공개된 CodePen의 미점검 항목을 표본 점검할 때 원본 404와 임베드 실패를 구분해 기록한다. 이번 조치만으로 다른 공개 예제의 실행 상태를 보증하지 않는다.
