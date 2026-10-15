# CodePen 원격 실행 검사 파일럿

로컬·GitHub Actions의 Playwright에서 CodePen 403이 발생할 때, Cloudflare Browser Run의 **실제 브라우저**에서 Result iframe을 검사한다. `worker.mjs`는 읽기 전용 개발용 검사기이며 D1, 후보 상태, 승인과 공개를 변경하지 않는다. `auto-worker.mjs`는 별도 예약 Worker로, D1 중지 스위치와 소유자 표본 검수를 거쳐 작은 묶음만 공개한다. 두 경로를 혼동하지 않는다.

## 실행

Node.js 24.12 이상에서 별도 터미널 두 개를 사용한다.

```powershell
cd tools/browser-run-probe
npm ci
npm test
npm run dev
```

```powershell
$probeBody = @{ candidates = @(@{ id = 'candidate-1'; canonicalUrl = 'https://codepen.io/Sicontis/pen/oNbgjda' }) } | ConvertTo-Json -Depth 3
Invoke-RestMethod -Uri 'http://127.0.0.1:8789/' -Method Post -ContentType 'application/json' -Body $probeBody | ConvertTo-Json -Depth 5
```

스크롤 또는 호버로 반응하는 후보에는 입력 종류를 명시한다. 클릭이나 폼 제출은 현재 지원하지 않는다.

```json
{
  "candidates": [
    {
      "id": "scroll-example",
      "canonicalUrl": "https://codepen.io/GreenSock/pen/xxXadQJ",
      "interaction": { "kind": "scroll" }
    },
    {
      "id": "hover-example",
      "canonicalUrl": "https://codepen.io/pleasedonotdisturb/pen/oNQLVXB",
      "interaction": { "kind": "hover", "selector": ".card" }
    }
  ]
}
```

요청당 후보는 최대 5개다. 매 요청은 이미 공개된 양성 대조군 `hoseonkwak/LEVeYQO`를 먼저 검사한다. 대조군의 Embed·Result가 200이고 본문이 비어 있지 않아야 후보를 검사한다. 대조군 애니메이션은 캡처 전에 끝날 수 있으므로 화면 변화는 필수 조건으로 삼지 않는다. 후보는 한 브라우저 세션에서 순서대로 검사한 뒤 세션을 닫는다.

`visual-change-observed`는 Result 문서 200, 빈 화면이 아닌 DOM, 자동 실행 중 화면 차이와 수집된 페이지 오류 없음이라는 **관측 신호**다. `interaction-change-observed`는 지정한 스크롤 또는 호버 후 시각·스타일 변화가 관측됐다는 뜻이다. 늦게 로드된 에셋도 픽셀 차이를 만들 수 있고, 클릭으로 시작하는 애니메이션은 아직 검사하지 않는다. `needs-review`와 `inconclusive`를 실패 Pen으로 간주하지 않는다. 어느 결과도 단독으로 승인·공개하지 않는다.

무료 Browser Run은 하루 10분, 브라우저 신규 생성은 20초당 1회, Quick Actions는 10초당 1회다. 429가 나오면 시간 제한인지 생성 속도 제한인지 구분하고 결과를 `probe-blocked`로 남긴다. 한 번에 전체 1,857건을 처리하는 용도가 아니다. [Cloudflare 한도](https://developers.cloudflare.com/browser-run/limits/), [요금](https://developers.cloudflare.com/browser-run/pricing/).

## 예약 자동 공개

`auto-wrangler.jsonc`는 Production D1과 Browser Run을 묶고, 한국 시간 매일 11:17에 실행한다. 공개 HTTP 주소는 없다. D1의 `auto_publication_control.paused=1`이 기본값이다. 관리자 `/admin/review`에서 예약 검사 재개·즉시 중지·표본 확인·묶음 취소를 수행한다. 소유자가 표본을 승인하기 전에는 자동 게시가 없다. 검사 실패와 보류 사유는 D1에 남는다.

```powershell
cd tools/browser-run-probe
npm ci
npm test
npm run verify:auto
npm run deploy:auto
```

앱의 `0012_auto_publication.sql` migration을 적용한 후 Worker를 배포한다. Production 스위치는 소유자 화면의 운영 영역에서 확인한다. 예약 실행을 수동으로 되풀이하면 무료 Browser Run 시간을 소비하고 D1에 중복 검사 시도를 남길 수 있다. `auto-wrangler.local.jsonc`와 `fixtures/local-release.sql`은 Production과 분리된 로컬 승인·되돌리기 리허설 전용이다.
