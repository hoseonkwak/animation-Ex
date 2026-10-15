# Cloudflare Browser Run 읽기 전용 실행 검사

- 검증일: 2026-10-15
- 환경: Cloudflare Workers Free, `wrangler dev --remote`, `@cloudflare/playwright` 1.3.6
- 쓰기: 없음. 후보·승인·공개 상태와 D1은 변경하지 않았다.

| 사례                                 | Embed | 내부 Result |        DOM | 두 관측 구간 화면 변화 | 판정                           |
| ------------------------------------ | ----: | ----------: | ---------: | ---------------------- | ------------------------------ |
| 양성 대조군 `hoseonkwak/LEVeYQO`     |   200 |         200 |   요소 4개 | 있음 / 있음            | 검사 환경 사용 가능            |
| 수집 후보 `Sicontis/oNbgjda`         |   200 |         200 | 요소 107개 | 있음 / 있음            | 화면 변화 관측, 공개 판정 아님 |
| 알려진 이용 불가 `GreenSock/LYpgKPe` |   404 |  요청 안 함 |  해당 없음 | 해당 없음              | `failed`, 공개 불가            |

## 동작 유형별 대조

관리자 Production 브라우저의 실제 Result 내용과 같은 URL을 Cloudflare Browser Run에서 읽기 전용으로 검사했다. 관리자 쪽에서는 `Move to Mars`가 첫 로드 때 비어 있다가 CodePen `Rerun` 후 내용이 표시됐다. 이는 원격 검사가 성공해도 사용자 브라우저 첫 로드의 안정성을 보장하지 않는다는 사례다.

| 후보                                      | 자동 화면 변화 | 지정 입력 후 변화                   | 관리자 Result      |
| ----------------------------------------- | -------------- | ----------------------------------- | ------------------ |
| `konstantindenerz/WNgEqbG` Retrowave      | 있음           | 해당 없음                           | 내용 로드          |
| `GreenSock/xxXadQJ` Smooth Scrolly Images | 없음           | 스크롤 이동, 인라인 스타일 8곳 변경 | 내용 로드          |
| `pleasedonotdisturb/oNQLVXB` Movie Poster | 없음           | `.card` 호버 후 화면 변경           | 내용 로드          |
| `jcoulterdesign/PXygYN` Move to Mars      | 있음           | 클릭은 미검사                       | Rerun 후 내용 로드 |

처음 두 입력형 후보는 자동 화면 변화 검사만으로는 `needs-review`였다. 입력을 지정하자 둘 다 `interaction-change-observed`로 바뀌었다. 이는 잘못된 실패 판정을 줄이는 근거지만, 관리자가 실제 움직임의 품질을 평가한 결과는 아니다. 자동 공개의 false positive·false negative 비율도 아직 계산할 수 없다.

동일 도구의 일부 시도에서는 대조군의 애니메이션이 끝난 뒤 화면을 찍어 변화가 보이지 않았고, 후보는 요청하지 않았다. 첫 프레임을 Result 로드 직후에 찍어도 재발했다. 따라서 대조군의 화면 변화는 게이트에서 제외하고 Embed·Result 200, 비어 있지 않은 본문과 페이지 오류 여부로 검사 환경을 판정한다. 화면 변화 자체는 각 후보의 관측 신호로만 남긴다. 이 사례는 검사 시점에 따른 false negative 가능성을 보여준다.

요청을 너무 촘촘히 보내면 429 `Rate limit exceeded`가 발생했다. 간격을 둔 재시도에서 성공했다. 무료 한도는 하루 브라우저 사용 10분과 브라우저 신규 생성 20초당 1회다. 따라서 여러 후보를 하나의 세션에서 순차 검사하고 세션을 즉시 닫는 방식이 필요하다. [Cloudflare Browser Run 한도](https://developers.cloudflare.com/browser-run/limits/).

화면 변화는 실제 픽셀 두 구간의 차이지만, 늦게 뜬 이미지나 로딩도 변화로 잡힐 수 있다. hover, click, scroll로 시작하는 예제는 자동 화면 변화가 없어도 정상일 수 있다. 관리자 실제 Preview 판정과 비교한 표본 결과가 쌓이기 전까지 이 도구의 결과로 후보를 자동 공개하지 않는다.
