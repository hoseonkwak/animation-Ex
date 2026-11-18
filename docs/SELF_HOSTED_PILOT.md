# 자체 실행 파일럿

기준일은 2026-11-18이다. D-075의 20~30개 선행 검증 범위에서 기존 24개 선정 방식과 공개 Raw 파일을 자동 확보하는 방식을 분리해 기록한다.

## 자동 확보 검증 결과

- 사용자가 개별 Export를 하지 않도록 CodePen의 공식 공개 Raw File URL을 사용한다. 원본 HTML과 같은 Pen의 컴파일된 CSS·JS·참조 파일을 자동 확보하고 파일별 SHA-256, 제작자·출처·라이선스 발견 정보를 보관한다. 원본 파일은 Git 무시 폴더에 저장하고 검증 결과만 버전 관리한다.
- 코드 확보 증거는 `evidence/SELF_HOSTED_RAW_PILOT_2026-11-18.json`이다. 후보 37개 중 원본 확보 22개, 확보 실패 15개다. `evidence/SELF_HOSTED_RAW_RESULT_2026-11-18.json`의 원본 파일 자체 실행 재검사는 **22개 모두 통과**했다.
- 이전 실패 5개는 GPU를 사용하는 Chromium 검증, 누락된 폰트 출처 반영, 중첩 변경 이력 텍스트 확보로 해결했다. 텍스트 변경 이력은 `text/plain`과 `nosniff`로만 제공하며 불투명 출처의 중첩 프레임에서 볼 수 있게 한다.
- 실제 배포 패키지·격리 헤더·반응형·원본 비교 증거는 `evidence/SELF_HOSTED_RELEASE_2026-11-18.json`이다. **22개 중 12개**가 모든 검사를 통과해 목록 모달·상세의 자체 실행에 연결된다. 나머지 10개는 움직임 시점에 따른 픽셀 차이가 커 `review-required`이며 CodePen을 유지한다. 전체 확대 조건은 아직 충족하지 않았다.
- Raw 원본은 읽기 가능하지만 직접 렌더링이 제한된다. 최초 비교 불가는 이력으로 유지하고, 현재 비교 원본은 공식 Embed에서 확인한 `https://<Pen UUID>.codepen.dev/` 실제 실행 화면이다. 데스크톱 1280×800·모바일 390×844에서 오류·리소스·화면 밖 넘침을 검사하고 픽셀 차이 5% 이하를 요구한다. 원본이 명시적으로 clip/hidden 처리한 넘침은 일반 페이지의 가로 스크롤과 구분하며 원본 비교도 통과해야 한다. 토글·라디오·호버 예제는 해당 입력을 실행해 확인한다.
- 403·429가 발생한 Pen 출처는 실패로 보관하고 해당 출처를 자동 재시도하지 않는다. 공개 Raw 파일을 확보할 수 없는 기존 형식 예제를 성공으로 집계하지 않는다.

저장소 루트에서 Node.js 24.12 이상으로 실행한다.

```powershell
node apps/lab/scripts/raw-pilot.mjs acquire
node apps/lab/scripts/raw-pilot.mjs verify
```

검증은 1280×800·390×844에서 `allow-scripts` 격리 프레임으로 실행한다. CodePen 실행 도메인 요청을 차단하고 실제 오류·캡처를 기록한다. 필요한 CodePen 정적 에셋은 별도 로컬 사본으로 제공하며 원본 파일은 보존한다. 이 도구는 운영 DB나 공개 예제를 수정하지 않는다. [공식 Raw File URL 문서](https://blog.codepen.io/docs/live-view/raw-file-urls/)가 접근 경로의 근거다. API v2는 본인 Pen만 대상으로 하므로 타 제작자 예제의 범용 확보 수단으로 사용하지 않는다.

## 최초 방식의 결과 (이력)

- 12개 카테고리에서 2개씩 24개를 선정했다. 목록과 제작자·출처 메타데이터는 `evidence/SELF_HOSTED_PILOT_2026-11-18.json`에 기록한다.
- CodePen robots 응답은 200이었다. 소유자 Pen의 공식 HTML 코드 URL은 403과 `cf-mitigated: challenge`를 반환했다. 추가 원본 요청은 중지했다.
- `evidence/SELF_HOSTED_PILOT_RESULT_2026-11-18.json`의 24개는 현재 `SOURCE_PACKAGE_MISSING`이다. 원본 코드 확보 0, 자체 실행 통과 0이며 전체 전환 조건을 충족하지 못했다.
- 이 결과는 코드 접근 경로의 실패다. 24개 예제의 실행 실패 또는 원본 삭제를 뜻하지 않는다.

## 코드 입력

정상적으로 확보한 CodePen Export의 컴파일된 HTML·CSS·JavaScript와 라이브러리·이미지 목록을 예제별 JSON에 넣는다. 공개 목록의 MIT 표시는 발견 정보다. 원본 Export의 실제 라이선스 문구와 제작자를 함께 확인한다.

파일 위치는 Git에서 제외되는 `apps/lab/.wrangler/self-hosted-pilot/packages/<slug>.json`이다.

```json
{
  "schemaVersion": 1,
  "slug": "파일럿 목록의 slug",
  "source": {
    "canonicalUrl": "파일럿 목록의 원본 CodePen URL",
    "creatorName": "파일럿 목록의 제작자",
    "licenseCode": "확인한 코드 라이선스",
    "licenseText": "원본 Export에 포함된 실제 라이선스 문구",
    "acquiredAt": "2026-11-18T00:00:00.000Z"
  },
  "code": {
    "html": "컴파일된 HTML",
    "css": "컴파일된 CSS",
    "javascript": "컴파일된 JavaScript"
  },
  "libraries": [],
  "resources": { "scripts": [], "styles": [], "images": [] }
}
```

GSAP·ScrollTrigger·ScrollSmoother는 현재 연습 환경과 같은 고정 버전을 지정할 수 있다. 다른 JS·CSS·이미지는 명시적 HTTPS 리소스 목록에 기록한다. CodePen 자체를 외부 실행 의존성으로 가진 패키지는 전환 대상에서 보류한다. 폰트, 모듈 import, API 통신 등 현재 지원하지 않는 의존성은 실제 실행에서 실패로 기록한다.

## 검증

Node.js 24.12 이상에서 저장소 루트를 기준으로 실행한다.

```powershell
node apps/lab/scripts/self-hosted-pilot.mjs select
node apps/lab/scripts/self-hosted-pilot.mjs verify apps/lab/.wrangler/self-hosted-pilot/packages
```

- `select`는 운영 공개 API만 읽는다.
- `verify`는 패키지 계약, 실제 격리 실행, ready·heartbeat, 실행·리소스 오류, 1280px·390px 가로 넘침을 검사한다. 각 크기의 캡처를 패키지 폴더의 `evidence`에 보관한다.
- 원본 CodePen·cdpn·codepen.dev로 향하는 요청은 차단하고 실패로 기록한다.
- 코드 해시는 패키지 JSON 바이트 기준 SHA-256이다. 오류·미확보·시각 비교 미완료가 있으면 종료 코드 2와 `readyForExpansion=false`를 기록한다.
- 실제 실행 통과는 원본 화면과의 일치를 의미하지 않는다. 시각 비교는 확인자·참고 URL·원본 캡처·캡처 해시·코드 해시에 묶인 `<slug>.comparison.json`으로 기록한다.

시각 비교 기록에는 `status=passed`, `packageSha256`, `referenceUrl`, `reviewer`, `notes`, `checkedAt`, 패키지 폴더 안의 `referenceScreenshot` 상대 경로와 `referenceScreenshotSha256`가 필요하다. 코드가 바뀌면 이전 비교 기록은 통과로 인정하지 않는다.

## 확대 조건

24개 모두 패키지·런타임·원본 시각 비교가 통과하면 검증기는 `readyForExpansion=true`를 기록한다. 그 증거를 확인한 뒤 공개 CodePackage 연결과 나머지 예제 변환을 진행한다. 이번 파일럿 도구는 운영 D1을 수정하거나 기존 공개 Entry를 전환하지 않는다.

참고 자료는 [CodePen Export](https://blog.codepen.io/documentation/exporting-pens/)와 [공식 코드 URL 확장자](https://blog.codepen.io/documentation/url-extensions/) 문서다.

## 공개 화면 연결·재현

원본 파일 자체 실행과 실제 배포 패키지 실행은 별도 검사다. 최종 배포 게이트는 `SELF_HOSTED_RELEASE_2026-11-18.json`의 **runtime/visual 모두 passed인 정확한 버전**이다. 버전과 파일 해시·제작자·원본·MIT 고지는 공개 스냅샷과 함께 보관한다. `.gitattributes`로 줄바꿈 자동 변환을 끄며 CI가 실제 배포 파일 해시를 다시 확인한다.

```powershell
node apps/lab/scripts/prepare-internal-preview.mjs serve
# 별도 터미널: 실제 패키지와 공식 실행 화면 비교
node apps/lab/scripts/verify-internal-preview.mjs
# 검증 완료 보고서에 있는 통과 버전만 public/runtime과 서버 목록에 반영
node apps/lab/scripts/prepare-internal-preview.mjs publish
```

서버 목록은 `apps/lab/server/internalPreviewCatalog.json`이며 런타임 경로는 `/runtime/<slug>/<version>/index.html`이다. 정적 파일 배포이므로 이번 연결에는 운영 D1 migration·Entry 재등록이 필요 없다. 원본 URL·공개 상태가 맞아야 제공하며 등록되지 않은 버전·파일은 404다. 미리보기·상세의 원본 CodePen 링크와 제작자 표시를 유지한다. 공용 라이브러리·폰트 CDN까지 전부 내부화한 오프라인 실행은 아니다.

로컬 기본 DB에도 공개 파일럿 예제를 넣으려면 다음 선택 명령을 사용한다. 이 seed는 운영용이 아니며 기존 로컬 행을 덮어쓰지 않는다.

```powershell
node apps/lab/scripts/prepare-internal-preview.mjs seed-local
cd apps/lab
npx wrangler d1 execute kwak-motion-lab-local --local --file .wrangler/internal-preview-seed-local.sql
```

브라우저 회귀는 `tests/e2e/internal-preview.spec.ts`, 공개 상태·sandbox·파일 허용 목록은 `tests/contracts/internalPreview.spec.ts`, 배포 해시는 `tests/operations/internalPreviewRelease.spec.ts`가 확인한다. 로컬 시각 증거는 `.wrangler/internal-preview/evidence`에 보관한다. 실패·미확보·비교 보류는 자동 공개 전환 대상에서 제외한다.

## 운영 배포 확인 (2026-11-18)

- 소스 커밋: `7c55cf1` (master와 codex/phase2-practice)
- [CI 및 Preview·Production 배포](https://github.com/hoseonkwak/animation-Ex/actions/runs/44264873311): 성공
- 운영 증거: `evidence/SELF_HOSTED_PRODUCTION_2026-11-18.json`
- 12개 공개 상세 API에서 내부 버전 선택, 실행 파일 64개의 SHA-256 및 썸네일 응답을 확인했다. 운영 D1의 공개 콘텐츠를 새로 등록하거나 수정하지 않았다.
- 실제 Production 페이지에서 데스크톱 12개·모바일 표본 3개를 확인했다. CodePen 실행 요청 0, 실행 오류 0, 부모 문서 접근 차단을 확인했다. 목록 모달의 토글 상호작용과 닫을 때 iframe 제거도 통과했다.
- 로컬 단위·계약·파일 무결성 검사 163개, Chromium 연습·관리자·자체 실행 회귀 50개가 통과했다. 원본과 시점 차이가 큰 파일럿 10개는 비교 보류이며 전체 확대 판정은 하지 않았다.
