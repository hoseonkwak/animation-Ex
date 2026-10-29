# Phase 2 자체 코드 Preview 위협 모델

문서 상태: 구현 중 v0.1
범위: 사용자가 편집한 HTML·CSS·JavaScript의 브라우저 실행

## 신뢰 경계

편집기의 코드는 신뢰하지 않는다. Phase 1의 외부 CodePen iframe과 별개로, Phase 2는 `srcdoc` iframe에 `sandbox="allow-scripts"`만 부여해 **불투명 출처**에서 실행한다. 부모 앱의 DOM, 쿠키, localStorage, IndexedDB와 인증 API에 직접 접근할 수 없다. 사용자의 코드는 브라우저 안에서 iframe으로 전달하며 Worker나 D1에 저장하지 않는다.

별도 호스트를 운영하지 않는 것은 초기 무료 운영을 위한 구현 선택이다. 불투명 출처 격리와 리소스 정책을 브라우저 검사로 검증하기 전에는 공개 경로에 연결하지 않는다.

## 실행 정책

- iframe: `allow-scripts`만 허용. `allow-same-origin`, 폼, 팝업, 다운로드, 상위 페이지 이동 권한은 주지 않는다.
- CSP: 기본 리소스, 네트워크 연결, 폰트, 미디어, 자식 frame과 폼 전송을 막는다. CSS와 스크립트의 inline 실행, data/blob 이미지만 허용한다.
- HTML·CSS·JS를 문서 문자열에 그대로 끼워 넣지 않고 JSON의 `<`를 이스케이프해 부트스트랩에 전달한다. HTML은 DOM에 삽입하고 CSS·JS는 각 요소의 `textContent`로 적용한다.
- 부모는 iframe의 현재 `contentWindow`, 실행 ID와 허용된 메시지 타입을 모두 검사한다. 메시지는 Preview UI의 로그·상태에만 사용하고 권한 있는 부모 동작을 수행하지 않는다.
- CSP의 `connect-src`는 `fetch`를 막지만 스크립트가 iframe 자신의 주소로 이동시키는 GET 요청까지 막지는 못한다. Worker는 `Sec-Fetch-Dest: iframe/frame`인 `/api/v1/*` 탐색을 403으로 거절하고 frame 표시도 금지한다. API가 요청을 받지 않는다고 주장하지 않으며, 인증된 데이터가 frame에 표시되지 않는지를 검사한다.
- iframe을 새 실행마다 교체하고 오래된 메시지를 버린다. 로그 길이와 표시 수를 제한하고 응답이 없으면 iframe을 폐기한다.

## 남는 위험과 출시 게이트

- 사용자 코드의 무한 루프나 브라우저 자체 결함을 정적으로 완전히 차단할 수 없다. heartbeat와 시간 초과는 복구 장치이며 CPU 사용 상한을 보증하지 않는다.
- HTML 속성 기반 스크립트와 사용자 JS는 sandbox 안에서 실행될 수 있다. 외부 네트워크·이동 차단은 브라우저의 실제 동작으로 확인한다.
- `srcdoc`의 상대 URL 해석, 자체 frame 이동, 브라우저별 CSP 지원을 Playwright로 검사한다. iframe 탐색이 API 응답이나 인증 데이터를 표시할 수 있으면 P2-SEC 게이트를 실패로 두고 공개하지 않는다. 일반 외부 사이트로의 자체 이동도 일어날 수 있으므로 `no-referrer`를 유지하고 이 한계를 사용자 코드 실행의 잔여 위험으로 기록한다.
- 자체 제작 GSAP Kit은 `gsap@3.15.0`만 허용한다. 설치된 파일을 앱 번들에 포함해 Preview 문서에 주입하므로 Preview가 외부 CDN을 요청하지 않는다. API 정책 값과 초안 저장값은 허용 목록으로 검증한다. 초기 빈 연습에는 라이브러리를 주입하지 않는다.
