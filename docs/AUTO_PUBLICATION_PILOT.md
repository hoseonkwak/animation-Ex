# 자동 공개 파일럿과 활성화 기준

확인일: 2026-10-15
상태: 검사 방식 검증 중 · Production 자동 공개 비활성

## 목표

소유자가 모든 후보를 하나씩 승인하지 않도록, 확실한 후보는 자동 검사와 표본 검수 뒤 제한적으로 공개한다. 실패·불확실 후보만 검수 화면에 남긴다. 공개된 화면은 여전히 실제 CodePen 코드로 실행해야 한다.

## 현재 측정값

- Production `review` 후보 1,857건, `approved` 후보 19건 (2026-10-15 읽기 전용 D1 집계).
- 대부분의 수집 후보는 `sources.availability = unknown`이다. 수집 시 저장된 `MIT`는 CodePen 공개 Pen의 일반 라이선스 정책을 가리키며, 개별 Pen의 현재 공개·실행 상태 확인을 대신하지 않는다.
- 무작위 공개 CodePen URL 12개를 Playwright의 headless Chromium으로 검사했을 때 12개 모두 embed 요청에서 HTTP 403이었다. 실패한 Pen 12개라는 뜻이 아니다. 이 실행 환경에서 CodePen이 자동 요청을 허용하지 않았으므로 판정은 모두 `inconclusive`다.
- 같은 로컬 환경에서 headed 브라우저 재검사를 시도했지만 브라우저 프로세스를 시작하지 못했다. 이 결과로 headed 환경의 접근 가능 여부를 판단하지 않는다.
- [GitHub Actions 실행 #1](https://github.com/hoseonkwak/animation-Ex/actions/runs/38676615600)에서도 이미 공개된 Pen 2개 모두 HTTP 403, `inconclusive`였다. 로컬과 GitHub-hosted runner 양쪽에서 자동 embed 검사가 차단된다. 이 workflow는 후보를 승인하거나 공개하지 않는다.
- 양성 대조군을 추가한 [GitHub Actions 실행 #2](https://github.com/hoseonkwak/animation-Ex/actions/runs/38684535775)는 절차 자체가 성공했지만, 대조군 검사 결과는 `inconclusive`였다. 후보의 실행 성공으로 해석하지 않는다.
- Production의 실제 관리자 브라우저에서는 서로 다른 후보 2건의 CodePen Result iframe이 열렸다. 반면 별도 자동화 브라우저에서는 알려진 공개 Pen도 403을 받았다. 환경에 따라 결과가 달라지므로 자동화 브라우저의 403을 후보 고장으로 판정할 수 없다. 비교 기록은 [`evidence/CODEPEN_RUNTIME_PATH_2026-10-15.md`](evidence/CODEPEN_RUNTIME_PATH_2026-10-15.md)에 있다.
- 이 결과로는 자동 공개의 실행 성공률이나 오류율을 계산할 수 없다. 자동 공개는 계속 꺼둔다.

## 검사 결과의 의미

`apps/lab/scripts/audit-codepen-candidates.mjs`는 공개 CodePen embed를 **읽기 전용**으로 검사한다. 후보·검수 기록·공개 상태는 수정하지 않는다. 이미 공개되고 정상 실행을 확인한 Pen을 `--control-url`로 먼저 검사한다. 이 양성 대조군조차 로드되지 않으면 그 실행 환경을 `probe-blocked`로 기록하고 나머지 후보는 요청하지 않은 채 모두 `inconclusive`로 남긴다.

| 결과           | 의미                                                       | 공개 허용                                |
| -------------- | ---------------------------------------------------------- | ---------------------------------------- |
| `loaded`       | HTTP 200, 결과 iframe과 내용 로드, 관측한 페이지 오류 없음 | 아니요. 실제 모션·상호작용·품질은 미검증 |
| `inconclusive` | 403, 타임아웃, 빈 결과 등으로 확인 불가                    | 아니요                                   |
| `failed`       | URL 형식 오류 또는 명확한 404/410                          | 아니요                                   |

입력은 `[{"id":"후보 ID","canonicalUrl":"https://codepen.io/작성자/pen/PenID"}]` JSON 배열이다. 한 번에 최대 50개만 실행한다. 결과 JSON에는 상태 코드와 iframe 로드 여부만 기록하며 비밀값과 페이지 본문은 저장하지 않는다.

```powershell
cd apps/lab
node scripts/audit-codepen-candidates.mjs --input .wrangler/후보.json --output .wrangler/결과.json --limit 20 --control-url https://codepen.io/hoseonkwak/pen/LEVeYQO
node --test scripts/audit-codepen-candidates.spec.mjs
```

2026-10-15 로컬 재검사에서 양성 대조군 `LEVeYQO`가 HTTP 403이었다. 보고서는 `environment: probe-blocked`와 후보별 `POSITIVE_CONTROL_NOT_LOADED`를 남겼다. 이 결과는 후보 2건의 실패 판정이 아니다.

## 자동 공개 활성화 순서

1. CodePen의 자동 요청 차단 여부를 다른 실행 환경에서도 확인한다. 검사기가 실제 실행과 상호작용을 관측하지 못하면 자동 공개로 연결하지 않는다.
2. 자동 검사와 관리자 화면의 실제 Preview 판정 사이 불일치 사례를 수집한다. 출처·카테고리별 표본, false positive, 실패 코드와 원인을 기록한다.
3. 소유자가 표본을 **공개 전에** 확인한다. 표본에 중대한 오류가 있으면 해당 묶음 전체를 보류한다.
4. URL·중복·작성자·라이선스·제목·요약·태그·실행 검사를 모두 통과한 묶음만 작은 상한으로 공개한다. 판단 불가와 검사 실패는 자동 공개하지 않는다.
5. 자동 공개 수, 표본 불일치율, 중지 조건과 공개 취소 결과를 운영 화면에서 확인할 수 있게 한다. 문제가 생기면 자동 공개를 즉시 중지하고 해당 공개분을 되돌린다.

현재 1단계에서 로컬 12건과 GitHub-hosted runner 2건의 403 차단을 확인했다. 403을 우회하거나 성공으로 간주하지 않는다. 다른 정상적인 실행 검사 경로가 검증되기 전에는 2~5단계를 활성화하지 않는다. 내부 CodePackage를 직접 실행하고 검사하는 방식은 별도 제품 단계·비용·안전 경계를 검토한 뒤 후보가 될 수 있다.
