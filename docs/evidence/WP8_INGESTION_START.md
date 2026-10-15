# WP8 WSSS 실수집 및 핵심 카테고리 backfill

검증일: 2026-09-23, 2026-09-29, 2026-10-06, 2026-10-07, 2026-10-14
출처: WSSS의 `Animation/GSAP`, `Parallax/Scroll`, `Slider/Image Slider`, `Mouse/Mouse Effect`, `Animation/Animation`, `Animation/Loading`, `Image/*`, `Button/*`, `Menu/*`, `Text/*`, `UI/*`, `Particles/*`
환경: Production D1 `kwak-motion-lab-production`

## 실행 전 검증

- 최초 실행 당시 `tests/ingestion` 2개 파일, 19개 검사 통과. 팀 CodePen URL과 checkpoint 회귀 검사 추가 후 24개 검사 통과
- 저장된 fixture에서 후보 3개와 실패 0개 추출
- 현재 WSSS robots 정책과 GSAP 게시물 1건의 읽기 전용 preflight 통과

## 실수집 결과

| 실행 ID                       | 카테고리             | 수락 | 중복 | API 실패 | 파싱 실패 |
| ----------------------------- | -------------------- | ---: | ---: | -------: | --------: |
| `wsss-1790124114630-82324d6c` | GSAP                 |   10 |    0 |        0 |         0 |
| `wsss-1790124213427-392fc59b` | GSAP                 |    5 |    0 |        0 |         0 |
| `wsss-1790142260530-cf8a2960` | Parallax/Scroll      |   20 |    0 |        0 |         0 |
| `wsss-1790142343641-2ba9b324` | Slider/Image Slider  |   20 |    0 |        0 |         0 |
| `wsss-1790143114579-854f5754` | Parallax/Scroll      |   28 |    2 |        0 |         0 |
| `wsss-1790143296710-e8d9411d` | Parallax/Scroll      |   48 |    1 |        0 |         2 |
| `wsss-1790143426421-a59a0bf2` | Parallax/Scroll      |    7 |    0 |        0 |         2 |
| `wsss-1790143527508-a8c541fb` | Parallax/Scroll      |    0 |    0 |        2 |         0 |
| `wsss-1790143794851-52562872` | Parallax/Scroll      |    1 |    1 |        0 |         0 |
| `wsss-1790143981021-62a736dc` | Slider/Image Slider  |   29 |    2 |        0 |         0 |
| `wsss-1790144171780-893e9817` | Slider/Image Slider  |   48 |    7 |        0 |         0 |
| `wsss-1790144325706-c71a1088` | Slider/Image Slider  |   34 |    5 |        0 |         0 |
| `wsss-1790149348708-ae60be69` | Mouse/Mouse Effect   |   50 |    0 |        0 |         0 |
| `wsss-1790149536294-35e674d2` | Mouse/Mouse Effect   |   55 |    0 |        0 |         0 |
| `wsss-1790149625096-a8746d72` | Mouse/Mouse Effect   |   19 |    0 |        0 |         0 |
| `wsss-1790150160974-77e299a7` | Animation/Animation  |   54 |    0 |        0 |         0 |
| `wsss-1790150344999-7adf25b4` | Animation/Animation  |   49 |    1 |        0 |         0 |
| `wsss-1790150524474-736fdcc9` | Animation/Animation  |   53 |    0 |        0 |         0 |
| `wsss-1790150613644-3f940737` | Animation/Animation  |   21 |    0 |        0 |         0 |
| `wsss-1790172754395-6d7f5664` | Animation/Loading    |   50 |    0 |        0 |         0 |
| `wsss-1790172903607-3b403c98` | Animation/Loading    |   40 |    0 |        0 |         0 |
| `wsss-1790173440481-547899c3` | Image/Hover Effect   |   58 |    5 |        0 |         0 |
| `wsss-1790173641538-7949b9f3` | Image/Image Effect   |   46 |    5 |        0 |         0 |
| `wsss-1790173873305-66f7d4b3` | Image/Background     |   64 |    1 |        0 |         0 |
| `wsss-1790636582797-9bffa6bd` | Button/Button Input  |   40 |    0 |        0 |         0 |
| `wsss-1790636666175-e7077647` | Button/Button Search |   13 |    1 |        0 |         0 |
| `wsss-1790636758530-49062c1d` | Button/Button SNS    |   19 |    0 |        0 |         0 |
| `wsss-1790637118198-2705bb34` | Button/Button        |   97 |    3 |        0 |         0 |
| `wsss-1790637517627-17517708` | Button/Button        |   96 |    5 |        0 |         0 |
| `wsss-1790643318612-b5e1da03` | Button/Button        |   33 |    0 |        0 |         0 |
| `wsss-1791297928356-56096243` | Menu/Accordian Menu  |   12 |    1 |        0 |         0 |
| `wsss-1791297958718-c7004d80` | Menu/Tab Menu        |    7 |    1 |        0 |         0 |
| `wsss-1791298009968-984f073e` | Menu/Hamberger Menu  |   15 |    1 |        0 |         0 |
| `wsss-1791298072067-049040ad` | Menu/Side Menu       |   19 |    1 |        0 |         0 |
| `wsss-1791298112992-3428f686` | Menu/Mobile Menu     |   10 |    1 |        0 |         0 |
| `wsss-1791298183729-24a15c9b` | Menu/Overlay Menu    |   18 |    3 |        0 |         0 |
| `wsss-1791298425969-a885ac56` | Menu/Menu            |   74 |    4 |        0 |         0 |
| `wsss-1791298713397-3275952c` | Text/Font            |    9 |    0 |        0 |         0 |
| `wsss-1791299374784-7284c218` | Text/Text            |  195 |    7 |        1 |         1 |
| `wsss-1791299670716-c1b2765f` | Text/Text            |   63 |    3 |        0 |         1 |
| `wsss-1791965040269-f4a09d57` | UI/Layout UI         |   31 |    1 |        0 |         0 |
| `wsss-1791965087756-6ca4d658` | UI/Dashboard UI      |   12 |    0 |        0 |         0 |
| `wsss-1791965142626-fcb4864d` | UI/Intro UI          |   15 |    2 |        0 |         0 |
| `wsss-1791965194610-8acc75c8` | UI/Mobile UI         |   16 |    0 |        0 |         0 |
| `wsss-1791965260326-17f6b9ee` | UI/Card UI           |   18 |    2 |        0 |         0 |
| `wsss-1791965286364-9fc8788e` | UI/Login UI          |    5 |    1 |        0 |         0 |
| `wsss-1791965328727-2b80c395` | UI/Code UI           |   11 |    1 |        0 |         0 |
| `wsss-1791965335431-1d55859b` | UI/Table UI          |    1 |    0 |        0 |         0 |
| `wsss-1791965392714-88c8d9e2` | UI/Modal UI          |   16 |    0 |        0 |         0 |
| `wsss-1791965414509-1acedaac` | UI/ETC UI            |    5 |    0 |        0 |         0 |
| `wsss-1791965432024-04d5b504` | UI/Form UI           |    5 |    0 |        0 |         0 |
| `wsss-1791988687847-41f28497` | Particles/Particles  |   82 |    1 |        0 |         0 |
| `wsss-1791988902506-985283e4` | Particles/Canvas     |   56 |    1 |        0 |         0 |
| `wsss-1791989109096-b94a69f0` | Particles/Three.js   |   58 |    1 |        0 |         0 |

GSAP 두 번째 실행과 두 카테고리의 후속 실행은 각 로컬 checkpoint에서 재개했다. Scroll과 Slider의 최초 20건은 모두 첫 페이지에 있었다. 두 카테고리는 robots 및 게시물 1건의 읽기 전용 preflight를 통과한 뒤 실행했다.

Scroll의 게시물 `1052`, `797`은 CodePen 팀 계정 URL을 기존 파서가 인식하지 못해 일시적으로 실패했다. 파서와 수집 API가 `codepen.io/team/.../pen/...` 경로를 처리하도록 고치고 Preview·Production 배포와 smoke test를 통과한 뒤 재수집했다. 두 게시물은 같은 Pen을 참조하므로 수락 1건과 중복 1건으로 끝났다. 관리자 Preview URL 생성도 팀 계정 경로를 지원하도록 수정해 재배포했다. 배치 간 완료 게시물 목록이 사라지는 checkpoint 오류도 수정하고 회귀 검사에 추가했다.

읽기 전용 재검증에서 Scroll 107개 게시물, Slider 138개 게시물의 미처리 후보와 파싱 실패가 모두 0건이었다. Production D1 조회 결과 이번 WSSS 수집 후보는 GSAP 15건, Scroll 104건, Slider 131건으로 총 250건이다. 전체 `review` 후보는 기존 1건을 포함해 251건이며 기존 승인 후보 15건과 공개 Entry는 변하지 않았다. 수집 검사 24개, 계약 검사 30개, 포맷·타입·린트 검사와 Preview·Production smoke test를 통과했다. 이번 수집으로 공개된 콘텐츠는 없다.

Mouse는 별도 robots·게시물 preflight와 수집 검사 24개를 통과한 뒤 4페이지의 게시물 118개를 세 배치로 처리했다. API 응답에서 Pen 후보 124건이 수락됐고 중복·API 실패·파싱 실패는 모두 0건이었다. checkpoint를 이용한 읽기 전용 재실행도 미처리 후보 0건, 실패 0건을 확인했다. Production D1 재조회에서도 Mouse 후보 124건, 전체 `review` 후보 375건, 기존 승인 후보 15건을 확인했다. 첫 Wrangler 읽기 요청은 Cloudflare API 인증 오류 `7403`으로 실패했으나 재시도에서 정상 조회됐다.

Animation/Animation의 첫 페이지 페이지네이션은 `1, 2, 3, 4, 6`만 표시해 기존 방식으로는 5페이지가 빠졌다. 표시된 마지막 페이지까지 중간 번호를 채워 순회하도록 parser를 수정하고 회귀 검사를 추가했다. 6페이지의 게시물 171개를 네 배치로 처리해 후보 177건을 수락하고 중복 1건을 확인했다. 재실행 검사에서 미처리·실패는 0건이었다. Production D1에서도 이 카테고리 후보 177건, 전체 `review` 후보 552건과 기존 승인 후보 15건을 확인했다.

Animation/Loading은 robots·게시물 preflight와 수집 검사 25개를 통과한 뒤 3페이지의 게시물 85개를 두 배치로 처리했다. Pen 후보 90건이 수락됐고 중복·API 실패·파싱 실패는 없었다. checkpoint를 사용한 읽기 전용 재실행에서 미처리 후보와 실패가 0건이었고, Production D1에서도 Loading 후보 90건, 전체 `review` 후보 642건과 기존 승인 후보 15건을 확인했다.

Image/*는 `Hover Effect`, `Image Effect`, `Background` 세 하위 카테고리를 각각 robots·게시물 preflight 후 독립 checkpoint로 처리했다. 게시물은 63+49+62=174개이며 Pen 발견 179건 중 새 후보 168건이 수락되고 11건은 중복으로 기록됐다. 세 checkpoint를 사용한 읽기 전용 재실행에서 모두 미처리 후보와 파싱 실패가 0건이었다. Production D1은 새 후보를 카테고리별 58·46·64건으로 확인했고, 전체 `review` 후보는 810건, 기존 승인 후보는 15건이다.

Button/*는 2026-09-29에 `Button Input`, `Button Search`, `Button SNS`, `Button` 네 하위 카테고리의 robots·게시물 preflight, 수집 검사 25개와 계약 검사 30개를 통과한 뒤 각각 독립 checkpoint로 처리했다. 게시물은 39+14+19+233=305개다. Pen 발견 307건 중 새 후보 298건이 수락되고 9건은 중복이었다. API 실패와 파싱 실패는 모두 0건이다. 네 checkpoint의 읽기 전용 재실행에서도 미처리 후보와 실패가 0건이었다. Production D1은 Button 후보를 카테고리별 40·13·19·226건으로 확인했고, 전체 `review` 후보는 1108건, 기존 승인 후보는 15건이다. 첫 Wrangler 조회는 Cloudflare API 인증 오류 `7403`으로 실패했으나 재시도에서 정상 조회됐다. 이번 수집으로 공개된 콘텐츠는 없다.

Menu/*는 2026-10-06에 `Accordian Menu`, `Tab Menu`, `Hamberger Menu`, `Side Menu`, `Mobile Menu`, `Overlay Menu`, `Menu` 일곱 하위 카테고리의 robots·게시물 preflight, 수집 검사 25개와 계약 검사 30개를 통과한 뒤 각각 독립 checkpoint로 처리했다. 게시물은 12+8+15+20+11+21+74=161개다. Pen 발견 167건 중 새 후보 155건이 수락되고 12건은 중복이었다. API 실패와 파싱 실패는 모두 0건이다. 일곱 checkpoint의 읽기 전용 재실행에서도 미처리 후보와 실패가 0건이었다. Production D1은 Menu 후보를 카테고리별 12·7·15·19·10·18·74건으로 확인했고, 전체 `review` 후보는 1263건, 기존 승인 후보는 15건이다. 첫 Wrangler 조회는 Cloudflare API 인증 오류 `7403`으로 실패했으나 재시도에서 정상 조회됐다. 이번 수집으로 공개된 콘텐츠는 없다.

Text/*는 2026-10-07에 `Font`, `Text` 두 하위 카테고리의 robots·게시물 preflight, 수집 검사 25개와 fixture를 통과한 뒤 각각 독립 checkpoint로 처리했다. 대상 게시물은 9+265=274개다. 게시물 `1651`은 재확인에서도 CodePen Pen 링크가 없어 `CODEPEN_LINK_MISSING`으로 명시적 제외했다. 나머지 게시물에서 Pen 277건을 확인해 새 후보 267건을 수락하고 10건은 중복으로 기록했다. 첫 Text 배치의 API 실패 1건은 다음 배치에서 다시 처리해 저장됐다. checkpoint 재실행 결과 Font는 미처리·실패 0건, Text는 새 후보 0건과 명시적 제외 1건이었다. Production D1은 Text 후보를 카테고리별 9·258건으로 확인했고, 전체 `review` 후보는 1530건, 기존 승인 후보는 15건이다. 이번 수집으로 공개된 콘텐츠는 없다.

UI/*는 2026-10-14에 `Layout UI`, `Dashboard UI`, `Intro UI`, `Mobile UI`, `Card UI`, `Login UI`, `Code UI`, `Table UI`, `Modal UI`, `ETC UI`, `Form UI` 열한 하위 카테고리의 robots·게시물 preflight, 수집 검사 25개와 fixture를 통과한 뒤 각각 독립 checkpoint로 처리했다. 게시물은 32+12+17+16+20+6+12+1+16+5+5=142개다. 새 후보 135건이 수락되고 7건은 중복이었다. API 실패와 파싱 실패는 모두 0건이다. 열한 checkpoint의 읽기 전용 재실행에서도 미처리 후보와 실패가 0건이었다. Production D1은 UI 후보를 카테고리별 31·12·15·16·18·5·11·1·16·5·5건으로 확인했고, 전체 `review` 후보는 1665건, 기존 승인 후보는 15건이다. 이번 수집으로 공개된 콘텐츠는 없다.

Particles/*는 2026-10-14에 `Particles`, `Canvas`, `Three.js` 세 하위 카테고리의 robots·게시물 preflight, 수집 검사 25개와 fixture를 통과한 뒤 각각 독립 checkpoint로 처리했다. 게시물은 74+57+59=190개이며 Pen 199건을 발견했다. 새 후보 196건이 수락되고 3건은 중복이었다. API 실패와 파싱 실패는 모두 0건이다. 세 checkpoint의 읽기 전용 재실행에서도 미처리 후보와 실패가 0건이었다. Production D1은 Particles 후보를 카테고리별 82·56·58건으로 확인했고, 전체 `review` 후보는 1861건, 기존 승인 후보는 15건이다. 첫 Wrangler 조회는 Cloudflare API 인증 오류 `7403`으로 실패했으나 재시도에서 정상 조회됐다. 이번 수집으로 공개된 콘텐츠는 없다.

명세에 정한 초기 대상 12개 카테고리의 backfill은 완료됐다. 각 카테고리의 checkpoint는 Git 제외 경로 `apps/lab/.wrangler/wsss-production-*-checkpoint.json`에 있다. 운영 후보 6건의 읽기 전용 검수 준비 결과는 [`WP8_REVIEW_READINESS.md`](WP8_REVIEW_READINESS.md)에 기록했다. Preview와 Production의 owner GitHub OAuth 연결도 완료됐다. 다음 WP8 작업은 메타데이터를 보완하고 Preview ValidationRun을 저장해 표본을 승인하는 것이다. GitHub Actions에서 안정적인 증분 수집을 예약하기 전에는 원격 checkpoint 지속 방식을 검증해야 한다.
