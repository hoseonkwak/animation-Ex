# CodePen 실행 확인 경로 비교

검증일: 2026-10-15
범위: 읽기 전용 공개 Pen과 관리자 후보 표본. 승인, 공개, 후보 상태 변경 없음.

## 결과

| 경로                                                      | 표본                                                    | 관찰                                                                        | 해석                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Production 관리자 인앱 브라우저                           | `Sicontis/oNbgjda`, `MarioD/OKyVob`                     | 각 CodePen Embed와 `cdpn.io` Result iframe, Rerun 제어가 나타남             | 이 브라우저에서 실행 화면에 접근 가능. 자동 검사 경로의 성공을 뜻하지 않음 |
| 별도 Chrome DevTools 브라우저의 Production Explore        | 이미 공개된 `hoseonkwak/LEVeYQO`                        | Embed HTTP 200, Result 문서 HTTP 200                                        | 해당 요청 한 건의 로드 확인. 실제 모션의 품질 판정은 아님                  |
| 같은 Chrome DevTools 브라우저의 첫 페이지에 추가한 iframe | `Sicontis/oNbgjda`, 알려진 404 후보 `GreenSock/LYpgKPe` | Embed 요청 둘 다 HTTP 403                                                   | 정상 후보와 이용 불가 후보를 구분하지 못함                                 |
| 로컬 Playwright headless의 Production Explore 내 iframe   | 이미 공개된 `hoseonkwak/LEVeYQO`                        | Embed HTTP 403, Result iframe 없음                                          | 첫 페이지 출처를 Production으로 바꿔도 자동화 환경 차단은 남음             |
| 로컬 양성 대조군 검사                                     | 이미 공개된 `hoseonkwak/LEVeYQO`                        | HTTP 403, `probe-blocked`; 나머지 2건은 `inconclusive`로 기록하고 요청 생략 | 후보별 실패 판정이나 자동 공개 근거 없음                                   |

로컬 대조군의 기계 판독 결과는 [`CODEPEN_POSITIVE_CONTROL_2026-10-15.json`](CODEPEN_POSITIVE_CONTROL_2026-10-15.json)에 보존했다. 토큰이나 페이지 본문은 결과에 포함하지 않는다. 앞선 GitHub Actions 실행도 공개 Pen 2건 모두 403이었다.

## 공식 경로 검토

- CodePen의 [Embed 문서](https://blog.codepen.io/docs/embeds/)는 iframe 및 oEmbed를 지원한다. 이는 콘텐츠를 표시하는 방법이며 실행 성공을 판정하는 API는 아니다.
- [oEmbed 문서](https://blog.codepen.io/docs/api/oembed/)의 응답은 제목, 작성자와 embed HTML 같은 메타데이터다. Result iframe의 실제 움직임이나 JavaScript 오류를 검증하지 않는다. 이 환경에서 oEmbed 요청도 차단되어 대체 검사기로 채택하지 않았다.
- 2026-10-14 공개된 [CodePen API v2 문서](https://blog.codepen.io/docs/api/api-v2/)는 API 키 소유자의 Pen만 조회할 수 있고 다른 제작자의 공개 Pen은 조회할 수 없다고 명시한다. WSSS에서 수집한 타인 Pen의 실행 검사에 사용할 수 없다.

## 판정과 다음 조건

현재 CodePen 자동화 요청의 403은 서비스 접근 차단과 개별 Pen 문제를 분리하지 못한다. 사람의 브라우저에서 보이는 iframe, 자동화 브라우저의 HTTP 응답, oEmbed 메타데이터 중 어느 하나만으로 자동 공개하지 않는다.

제3자 공개 Pen의 실제 실행을 지속적으로 확인할 수 있는 허용된 경로가 확보되기 전에는 Production 자동 공개를 비활성으로 유지한다. 그 경로가 생기면 양성 대조군, 정상·실패 표본, 실제 모션과 상호작용 확인, 관리자 판정 비교를 먼저 통과해야 한다.
