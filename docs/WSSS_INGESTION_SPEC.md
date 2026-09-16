# WSSS 수집 파이프라인 명세

문서 상태: Draft v0.1
기준일: 2026-09-15
대상 출처: [WSSS](https://wsss.tistory.com/)

## 1. 확인한 구조

WSSS는 카테고리 목록, 페이지네이션과 개별 게시물로 구성된다. 개별 게시물에는 WSSS 제목·카테고리·작성일과 원본 CodePen 링크·Pen 제목·작성자가 표시된다.

현재 화면에 표시된 대표 규모:

| 분류               | 표시 개수 |
| ------------------ | --------: |
| CSS Reference 전체 |     2,083 |
| Animation          |       349 |
| GSAP               |        15 |
| Slider             |       138 |
| Mouse              |       118 |
| Parallax / Scroll  |       107 |
| Button             |       305 |
| Menu               |       161 |
| Text               |       274 |
| UI                 |       142 |

개수는 수집 범위를 가늠하는 참고값이며 실행할 때 다시 기록한다.

## 2. 수집 원칙

- WSSS를 원본 코드 저장소가 아니라 CodePen 발견 경로로 사용한다.
- 공개 대상의 canonical source는 원본 CodePen이다.
- WSSS 게시물의 ZIP, 이미지와 첨부 파일을 다운로드하지 않는다.
- CodePen 페이지의 HTML이나 코드를 자동 크롤링하지 않는다.
- CodePen은 공식 embed로 관리자 브라우저에서 실행하고 확인한다.
- 자동 요청 전에 robots 정책을 확인하고 허용 범위만 수집한다.
- 동시 요청은 1개로 제한하고 출처에 부담을 주지 않는 간격을 둔다.
- 403, 429 또는 반복되는 5xx가 발생하면 해당 실행을 중지한다.

CodePen 공식 문서 기준 공개 Pen은 MIT 라이선스다. 승인 시 Pen이 공개 상태임을 확인하고 제작자, canonical URL, `MIT`, 근거 URL과 확인 시각을 저장한다. 비공개 또는 접근 불가 Pen은 공개하지 않는다.

## 3. 초기 대상 카테고리

다음 순서로 backfill한다.

1. `Animation/GSAP`
2. `Parallax/Scroll`
3. `Slider/Image Slider`
4. `Mouse/Mouse Effect`
5. `Animation/Animation`
6. `Animation/Loading`
7. `Image/*`
8. `Button/*`
9. `Menu/*`
10. `Text/*`
11. `UI/*`
12. `Particles/*`

우선순위는 초기 핵심인 GSAP, Scroll, Slider와 Hero로 발전시킬 가능성이 높은 예제를 먼저 검수하기 위한 것이다. 나머지 항목도 버리지 않고 Candidate로 확보한다.

## 4. 실행 모드

### 최초 Backfill

- 카테고리별 1페이지부터 마지막 페이지까지 순회한다.
- 목록에서 WSSS 게시물 ID와 URL을 먼저 확보한다.
- 아직 처리하지 않은 게시물 상세만 요청한다.
- 실행당 최대 상세 페이지는 200개다.
- 요청 간격은 기본 2초에 0~2초의 임의 지연을 더한다.
- category, page와 마지막 처리 게시물 ID를 checkpoint로 남긴다.
- 페이지 이동으로 같은 글을 다시 만나도 게시물 ID와 CodePen canonical URL로 합친다.

### 매일 증분 수집

- 대상 카테고리의 1페이지부터 확인한다.
- 연속 30개 게시물 ID가 모두 기존 항목이면 해당 카테고리를 멈춘다.
- 새 게시물 상세만 요청한다.
- 정각을 피한 하루 1회 예약과 수동 실행을 지원한다.

### 월간 재확인

- WSSS 카테고리 목록의 구조가 달라졌는지 fixture 검사한다.
- 이미 공개된 Pen은 서버에서 다시 크롤링하지 않는다.
- 관리자 화면에서 오래 확인되지 않은 Preview를 재검수 대상으로 보여준다.

## 5. 단계별 처리

```text
Preflight
→ List discovery
→ Article extraction
→ CodePen URL normalization
→ Deduplication
→ Tag suggestions
→ Batch submission
→ Candidate review
```

### Preflight

- robots 정책 확인
- 대상 카테고리 접근 확인
- 이전 checkpoint 로드
- 무료 사용량 중지선 확인
- parser fixture 검사

fixture가 실패하면 실제 수집을 시작하지 않는다.

### List discovery

목록에서 다음 값을 추출한다.

- WSSS 게시물 ID
- 게시물 URL
- WSSS 제목
- 카테고리 경로
- 목록 페이지 번호

메뉴, `UP NEXT`, 광고와 페이지네이션 링크는 후보에서 제외한다.

### Article extraction

개별 게시물에서 다음 값을 추출한다.

- WSSS 제목과 게시물 ID
- 카테고리
- 게시일
- CodePen URL
- Pen 제목
- CodePen creator 이름과 slug

한 게시물에 Pen이 여러 개 있으면 Pen마다 Candidate를 만들고 같은 WSSS 발견 경로를 연결한다. CodePen 링크가 없으면 공개 후보를 만들지 않고 `CODEPEN_LINK_MISSING`을 기록한다.

### URL 정규화

다음 형태를 canonical URL로 통일한다.

```text
https://codepen.io/{creator}/pen/{penId}
```

- scheme과 host를 소문자로 처리한다.
- query, fragment와 embed 표시 옵션을 제거한다.
- creator slug와 Pen ID의 원래 대소문자는 보존한다.
- `pen_key={creator}/{penId}`를 중복 키로 사용한다.
- 허용하지 않은 host가 섞이면 실패 처리한다.

### 중복 검사

다음 순서로 찾는다.

1. `pen_key`
2. canonical CodePen URL
3. WSSS 게시물 ID + Pen 순번
4. creator + Pen 제목 유사 후보

1~2가 같으면 자동으로 같은 Source에 발견 경로만 추가한다. 4만 일치하면 자동 병합하지 않고 `possible duplicate` 큐로 보낸다.

## 6. 태그 제안

카테고리 기반의 결정 가능한 정보만 자동 확정한다.

| WSSS 경로             | 내부 태그             | 처리 |
| --------------------- | --------------------- | ---- |
| `Animation/GSAP`      | Technology: `gsap`    | 확정 |
| `Animation/CSS3`      | Technology: `css`     | 확정 |
| `Animation/SVG`       | Technology: `svg`     | 확정 |
| `Animation/Loading`   | Section: `loading`    | 확정 |
| `Slider/Image Slider` | Section: `slider`     | 확정 |
| `Parallax/Scroll`     | Trigger: `scroll`     | 확정 |
| `Button/*`            | Section: `button`     | 확정 |
| `Menu/*`              | Section: `navigation` | 확정 |
| `Text/*`              | Section: `text`       | 확정 |
| `UI/Card UI`          | Section: `card`       | 확정 |

Mouse, Particles, Image와 일반 UI는 범위가 넓어 category 값을 그대로 확정하지 않고 제안으로만 둔다. 제목 키워드에서 찾은 `hover`, `drag`, `hero`, `reveal`, `marquee` 등도 관리자 확인 전에는 확정하지 않는다.

난이도는 WSSS 정보만으로 결정하지 않고 기본값 없이 관리자에게 남긴다.

## 7. 후보 출력 계약

```json
{
  "externalId": "wsss:1603:0",
  "discoveredVia": {
    "key": "wsss",
    "url": "https://wsss.tistory.com/1603",
    "category": "Animation/GSAP"
  },
  "source": {
    "type": "codepen",
    "url": "https://codepen.io/creativeocean/pen/...",
    "canonicalUrl": "https://codepen.io/creativeocean/pen/...",
    "creatorName": "Tom Miller",
    "creatorSlug": "creativeocean",
    "title": "GSAP Homepage Demo 1"
  },
  "suggestedTitleKo": "GSAP 홈페이지 메인 애니메이션",
  "tags": [
    {
      "axis": "technology",
      "key": "gsap",
      "source": "imported",
      "confidence": 1,
      "confirmed": true
    }
  ]
}
```

원문 HTML, 광고 문구, 첨부 파일 URL과 불필요한 WSSS 페이지 내용을 API로 전달하지 않는다.

## 8. 실패 코드

| 코드                        | 처리                                     |
| --------------------------- | ---------------------------------------- |
| `ROBOTS_DISALLOWED`         | 전체 실행 중지                           |
| `SOURCE_RATE_LIMITED`       | 전체 실행 중지, 자동 즉시 재시도 금지    |
| `CATEGORY_UNAVAILABLE`      | 카테고리 실패, 다른 카테고리 계속        |
| `LIST_STRUCTURE_CHANGED`    | fixture 실패 후 전체 실행 중지           |
| `ARTICLE_UNAVAILABLE`       | 항목 실패, 다음 실행에서 재시도          |
| `ARTICLE_STRUCTURE_CHANGED` | 항목 실패 누적, 임계치 초과 시 전체 중지 |
| `CODEPEN_LINK_MISSING`      | 관리자 확인 큐 또는 제외                 |
| `CODEPEN_URL_INVALID`       | 항목 실패                                |
| `CREATOR_MISSING`           | `needs-edit` 후보                        |
| `DUPLICATE_EXACT`           | 기존 Source에 발견 경로 추가             |
| `DUPLICATE_POSSIBLE`        | 관리자 중복 큐                           |
| `API_AUTH_FAILED`           | 전체 실행 중지                           |
| `FREE_LIMIT_PAUSED`         | checkpoint 저장 후 정상 중지             |

같은 parser 오류가 한 실행에서 5개 또는 처리 항목의 10%를 넘으면 구조 변경으로 판단하고 중지한다.

## 9. 재시도

- 네트워크 timeout과 5xx: 5초, 20초 후 최대 2회
- 403, 429: 같은 실행에서 재시도하지 않음
- 파싱 실패: 자동 재시도하지 않음
- Worker batch API 5xx: 같은 request ID로 최대 2회
- 인증 실패: 비밀값 확인 전 재실행 금지

checkpoint는 API 저장이 확인된 항목까지만 전진한다.

## 9.1 구현 및 운영 명령

```bash
npm run test:ingestion
npm run ingest:wsss:fixture
npm run ingest:wsss:preflight
npm run ingest:wsss:live -- --max-articles 50 --max-pages 1
```

`preflight`는 fixture 검사를 먼저 수행한 뒤 현재 WSSS HTML을 한 건 읽고 결과만 출력한다. 후보 등록이나 checkpoint 완료 API는 호출하지 않는다. live 실행과 수동 GitHub Actions workflow는 HMAC 환경 변수 세 개가 있을 때만 제출한다. 하루 1회 schedule은 수동 실행이 안정화된 뒤 별도 변경으로 활성화한다.

## 10. Fixture

최소 fixture 세트를 저장한다.

| 종류            | 대표 URL                                                         | 검증 항목                        |
| --------------- | ---------------------------------------------------------------- | -------------------------------- |
| 카테고리 목록   | `https://wsss.tistory.com/category/Animation/GSAP`               | 게시물 링크, 제목, pagination    |
| 페이지 2        | `https://wsss.tistory.com/category/Slider/Image%20Slider?page=2` | page 이동과 중복 제거            |
| 단일 Pen 게시물 | `https://wsss.tistory.com/1603`                                  | Pen URL, 제목, creator, 카테고리 |
| 최근 게시물     | `https://wsss.tistory.com/2112`                                  | 최신 markup 호환성               |

fixture HTML은 테스트에 필요한 최소 구조만 보관한다. 원문 전체와 이미지·첨부 파일은 저장하지 않는다.

## 11. 수집 완료 기준

- 같은 입력을 세 번 실행해도 Candidate 수가 증가하지 않는다.
- WSSS URL과 CodePen canonical URL이 분리 저장된다.
- 한 게시물의 여러 Pen을 잃지 않는다.
- parser 구조 변경이 조용히 빈 성공으로 기록되지 않는다.
- 성공 항목과 실패 항목을 개별 재현할 수 있다.
- 중지 후 checkpoint에서 수동 재개할 수 있다.
- CodePen을 자동 크롤링하지 않아도 관리자 Preview 검수까지 이어진다.

## 12. 참고 자료

- [WSSS 홈과 카테고리](https://wsss.tistory.com/)
- [WSSS GSAP 카테고리](https://wsss.tistory.com/category/Animation/GSAP)
- [CodePen Pen 문서](https://blog.codepen.io/docs/pens/)
- [CodePen 이용약관](https://blog.codepen.io/legal/terms-of-service/)
