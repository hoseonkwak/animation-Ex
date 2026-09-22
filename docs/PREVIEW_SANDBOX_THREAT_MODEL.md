# Preview sandbox 위협 모델

문서 상태: Active v0.1
범위: Phase 1의 외부 CodePen 실행 화면

## 보호 대상

- Kwak Motion Lab의 DOM, 저장 데이터와 관리자 화면
- 사용자의 현재 탭과 탐색 흐름
- Worker API의 인증 정보와 같은 출처 요청

## 신뢰 경계

CodePen iframe 안의 HTML, CSS와 JavaScript는 외부 콘텐츠다. 공개 전에 실제 실행을 검수해도 안전한 코드라고 신뢰하지 않는다. iframe과 애플리케이션 사이에는 브라우저 출처 경계와 `sandbox`를 유지한다.

## 허용 기능

모든 CodePen iframe은 다음 권한만 사용한다.

```text
allow-scripts allow-same-origin allow-forms allow-popups
```

- `allow-scripts`: 애니메이션 실행
- `allow-same-origin`: CodePen embed의 리소스와 런타임 호환
- `allow-forms`: 예제 내부의 폼 상호작용
- `allow-popups`: 예제에서 명시적으로 여는 외부 링크
- Fullscreen은 상세 화면의 사용자 동작에만 허용
- referrer policy는 `strict-origin-when-cross-origin`으로 고정

Top navigation, 다운로드, 클립보드, 카메라, 마이크와 위치 권한은 허용하지 않는다. 새 권한이 필요한 예제는 공개하지 않고 별도의 제품 결정과 회귀 검사를 먼저 추가한다.

## 실행 제한

- 목록은 썸네일로 시작하며 사용자가 누른 카드만 실행한다.
- 동시에 실행하는 iframe은 최대 두 개다.
- 화면 밖 iframe은 제거한다.
- 한 iframe의 오류는 해당 카드 안에서 처리한다.
- 관리자는 공개 전에 실제 iframe, viewport와 확인 시각을 기록한다.

## 남은 위험과 대응

- 외부 Pen은 검수 후에도 바뀔 수 있다. 공개 오류를 기록하고 관리자가 공개 중지할 수 있어야 한다.
- `allow-scripts`와 `allow-same-origin` 조합은 외부 출처가 유지되는 동안만 허용한다. 내부 CodePackage에는 동일한 구성을 재사용하지 않는다.
- CodePen 장애와 외부 추적은 완전히 제거할 수 없다. 실행 전 썸네일을 사용하고 referrer를 origin 수준으로 제한한다.

## 변경 검증

- `PreviewCard.spec.ts`에서 sandbox와 referrer policy를 검사한다.
- Playwright에서 클릭 전 iframe 0개, 클릭 후 선택한 iframe만 생성되는지 검사한다.
- sandbox 권한을 바꾸면 이 문서와 관련 테스트를 함께 갱신한다.
