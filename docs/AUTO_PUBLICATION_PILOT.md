# 자동 공개 파일럿과 활성화 기준

확인일: 2026-10-15
상태: Production 첫 표본 수동 공개 1건·자동 게시 0건 · 반복 승인 없는 방식으로 전환 검증 중

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
- Cloudflare Browser Run 원격 Playwright에서 양성 대조군과 후보 `Sicontis/oNbgjda`의 Embed·내부 Result 요청이 각각 200이었다. Result 본문이 비어 있지 않았고 두 구간의 화면 이미지가 달랐다. 알려진 이용 불가 Pen은 Embed 404로 `failed`가 됐다. 스크롤·호버형 정상 후보는 자동 대기만으로 화면 변화가 없었지만, 해당 입력을 재현하자 변화가 관측됐다. 이 경로는 `tools/browser-run-probe`로 재현할 수 있으며 결과는 [`evidence/BROWSER_RUN_PROBE_2026-10-15.md`](evidence/BROWSER_RUN_PROBE_2026-10-15.md)에 기록했다. 픽셀·스타일 차이가 실제 애니메이션 품질을 보증하지 않으므로 자동 공개는 계속 꺼둔다.
- 2026-10-15 추가 읽기 전용 집계에서 공개 메타데이터·난이도·확정 태그가 모두 이미 저장된 대기 후보는 1건이다. 구체적인 공개 제목과 확정 태그·제작자·라이선스를 가진 후보는 1,061건이다. 빈 요약·slug는 기존 결정적 제안 규칙으로 보완할 수 있지만, 제안 문구의 의미 품질은 표본에서 확인해야 한다. `CODE VIEW`는 Pen 제목이 아니라 보조 링크 텍스트였으며 파서가 이를 덮어쓴 문제를 수정했다.

## 구현된 작은 묶음 흐름

`tools/browser-run-probe/auto-worker.mjs`는 공개 HTTP 경로가 없는 예약 Worker다. UTC 02:17에 하루 한 번 실행하며 D1 스위치가 `paused=1`이면 브라우저를 시작하지 않는다. 같은 카테고리의 최대 8개 후보와 양성 대조군을 한 브라우저 세션에서 검사한다. Embed·내부 Result 200, 충분한 DOM, 두 관측 구간의 화면 변화, 페이지 오류 없음이 모두 맞아야 통과한다. `visual-change-observed` 이외의 상태는 자동 공개 대상이 아니다.

통과 후보 3개 이상을 묶고 1개를 표본으로 지정한다. 소유자가 관리자 화면에서 표본 Result를 직접 확인하고 `승인 및 공개`하면, 다음 예약 실행에서 나머지 후보의 상태·버전·검사 시각을 다시 확인하고 기존 승인 트랜잭션으로 공개한다. 72시간을 넘긴 실행 증거는 양성 대조군과 해당 후보를 다시 검사해 통과해야만 갱신한다. 표본 거절, 후보 변경 또는 재검사 실패 시 묶음을 보류한다. D1 중지 스위치는 실행 중에도 항목마다 다시 읽는다. `묶음 중지·취소`는 스위치를 잠그고 그 묶음의 자동 공개 항목을 `unpublished`로 바꾼다. 표본의 수동 공개는 유지한다.

설정과 결과는 `/api/v1/admin/auto-publication`에서 owner 세션으로만 볼 수 있다. 2026-10-15에 Preview·Production D1 migration, 앱과 예약 Worker 배포, 로컬 D1의 표본 승인→자동 공개 2건→재실행 중복 없음→묶음 취소 2건 리허설을 마쳤다. Production 스위치는 예약 검사를 허용한다. 첫 예약 실행은 한국 시간 2026-10-16 11:17에 8건 중 7건이 통과해 표본 1건과 자동 대기 6건을 만들었다. 2026-10-19 현재 소유자 표본 판정 전이며 자동 게시 0건이다. 실제 Production 자동 게시·취소 결과는 아직 관측하지 못했다. 실패·불확실·상호작용 전용 후보는 기존 수동 큐에 남긴다. 자세한 증거는 [`evidence/AUTO_PUBLICATION_ROLLOUT_2026-10-15.md`](evidence/AUTO_PUBLICATION_ROLLOUT_2026-10-15.md)에 있다.

## 2026-10-20 운영 방식 변경

D-043에 따라 묶음마다 표본 승인을 요구하지 않는다. 처음에는 교정 증거가 있는 `Animation/GSAP`만 대상으로 하루 최대 8건을 검사한다. 출처·중복·확정 태그·원본 제목과 최신 Browser Run의 엄격한 실행 증거가 모두 유효하면 같은 예약 실행에서 공개한다. 기존 대기 묶음도 다음 예약 실행에서 72시간이 지난 증거를 갱신한 뒤 같은 기준으로 처리한다. 2026-10-20에 기존 표본 1건은 소유자가 수동 공개했으며, 나머지 6건은 다음 예약 실행을 기다린다. 공개 후 소유자가 표본을 선택적으로 확인하고 문제가 있으면 즉시 중지·묶음 취소한다. 다른 카테고리로 확대하기 전에 불일치와 오류율을 분석한다. 이 문단은 코드 변경 목표이며, Production 배포와 실제 자동 게시가 확인되기 전까지 완료로 표시하지 않는다.

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
3. GSAP에 한해 소유자가 공개 후 표본을 선택적으로 확인한다. 표본에 중대한 오류가 있으면 즉시 중지하고 해당 묶음 전체를 취소한다.
4. URL·중복·작성자·라이선스·제목·요약·태그·실행 검사를 모두 통과한 묶음만 작은 상한으로 공개한다. 판단 불가와 검사 실패는 자동 공개하지 않는다.
5. 자동 공개 수, 표본 불일치율, 중지 조건과 공개 취소 결과를 운영 화면에서 확인할 수 있게 한다. 문제가 생기면 자동 공개를 즉시 중지하고 해당 공개분을 되돌린다.

로컬 12건과 GitHub-hosted runner 2건은 403으로 막혔지만, Cloudflare Browser Run에서 읽기 전용 실행 검사 경로를 확인했다. 자동·스크롤·호버·클릭형 표본을 비교해 입력 재현의 필요성도 확인했다. 다음에는 충분한 표본과 실제 관리자 판정을 비교해 불일치율을 측정하고, 첫 로드가 빈 Result인 사례를 별도로 기록한다. 무료 한도 안에서 작은 묶음만 검사하며, 화면 변화 신호만으로 2~5단계를 활성화하지 않는다. 내부 CodePackage를 직접 실행하고 검사하는 방식은 별도 제품 단계·비용·안전 경계를 검토한 뒤 후보가 될 수 있다.
