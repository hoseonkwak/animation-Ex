# Phase 1 공개 화면 명세

문서 상태: Draft v0.1
기준: Light 기본 테마, 로그인 없는 공개 서비스

## 1. Phase 1 경로

| 경로 | 화면 |
|---|---|
| `/` | Home |
| `/explore` | 전체 탐색 |
| `/sections` | 적용 영역 허브 |
| `/sections/:slug` | Hero 등 Section 상세 |
| `/examples/:slug` | 예제 상세 |
| `/saved` | 저장한 예제와 나중에 연습 |
| `/submit` | URL 제보 |
| `/about` | 서비스와 출처 정책 |

Phase 1 Header는 `HOME`, `EXPLORE`, `SECTIONS`, `ABOUT`과 검색, 저장, 테마 전환으로 구성한다. `PRACTICE`는 Phase 2, `LEARN`은 Phase 3에 실제 콘텐츠와 함께 추가한다.

## 2. 전역 Shell

### Desktop Header

```text
Kwak Motion Lab   Explore   Sections   About        Search   Saved   Theme
```

- 최대 1440px 안에서 정렬한다.
- 스크롤 시 높이를 바꾸지 않는 sticky header다.
- 배경에는 약한 blur보다 불투명 surface를 우선해 Preview와 섞이지 않게 한다.
- 검색 버튼은 `/explore`의 검색 입력으로 focus를 이동하거나 검색 overlay를 연다.

### Mobile Header

```text
Kwak Motion Lab                         Search  Menu
```

Menu drawer에 Explore, Sections, Saved, About과 Theme을 둔다. 현재 위치와 닫기 버튼을 명확히 표시한다.

### Footer

- 제품 설명 한 문장
- Explore, Sections, URL 제보, 출처 정책
- GitHub 링크는 저장소 공개가 확정된 뒤 추가
- 저작권과 외부 CodePen 라이선스 안내

## 3. Home

### 목적

처음 방문한 사용자가 10초 안에 사이트가 실행형 애니메이션 라이브러리임을 이해하고 탐색을 시작하게 한다.

### Desktop 구조

```text
┌ Header ───────────────────────────────────────────────┐
│ WEB MOTION REFERENCE                                  │
│ 좋은 움직임을 찾고,             Curated Live Preview │
│ 바로 실행해보세요.              실제 CodePen 실행     │
│ [애니메이션 둘러보기] [URL 제보]                      │
├ Search: "스크롤할 때 이미지가 펼쳐지는 효과" ───────┤
│ Featured Collections                                 │
│ Recently Added                                       │
│ Browse by Section                                    │
│ Popular Patterns                                     │
│ URL Submission CTA                                   │
└ Footer ───────────────────────────────────────────────┘
```

### Hero

- 텍스트와 Preview를 Desktop 5:7 비율로 배치한다.
- 대표 Preview는 하나만 자동 실행한다.
- 실패해도 제목, 검색과 CTA는 즉시 사용할 수 있다.
- 모바일에서는 텍스트 다음에 Preview를 배치한다.
- 추천 문구:
  - Eyebrow: `WEB MOTION REFERENCE`
  - 제목: `좋은 움직임을 찾고, 바로 실행해보세요.`
  - 설명: `웹 애니메이션을 기술과 적용 영역별로 찾고 실제 코드 실행 화면으로 확인하세요.`

### 주요 검색

- Hero 바로 아래 독립된 60px 검색 입력
- 추천 검색어 chip: `GSAP Hero`, `Scroll Reveal`, `Text Motion`, `Image Slider`
- 자연어를 입력해도 Phase 1에서는 일반 키워드로 검색한다.
- AI가 해석한 것처럼 표현하지 않는다.

### 콘텐츠 섹션

- Featured Collections: 3개의 넓은 컬렉션 카드
- Recently Added: 실행형 카드 4개, 더 보기
- Browse by Section: Hero, Navigation, Gallery, Slider, Card, Button, Text, Loading, Background
- Popular Patterns: 패턴 카드 4개
- Phase 1에는 Practice와 Tutorial 섹션을 표시하지 않는다.

## 4. Explore

### Desktop 구조

```text
Explore / 결과 수
[Search________________________________] [정렬]
[적용된 필터 chip................................]
┌ Filters 240px ┐ ┌ Preview card grid ───────────────┐
│ Technology    │ │ card  card  card  card (Wide)    │
│ Trigger       │ │ card  card  card  card           │
│ Motion        │ │ [다음 결과 불러오기]             │
│ Section       │ └───────────────────────────────────┘
│ Technique     │
│ Difficulty    │
└───────────────┘
```

- Wide에서는 sidebar + 4열, Desktop에서는 sidebar + 3열이다.
- 필터 sidebar는 Header 아래에서 sticky다.
- 결과 수와 적용 필터는 API 응답 후 갱신한다.
- 무한 자동 스크롤 대신 `다음 결과 불러오기`를 사용한다.
- 새 결과를 붙인 뒤 focus와 스크롤 위치를 유지한다.

### Mobile

- 검색, 결과 수, `필터`, 정렬, 적용 chip, 1열 카드 순서
- 필터는 bottom sheet 또는 full-height drawer
- 적용 버튼에 예상 결과 수를 표시
- URL query가 화면 상태의 원본이며 새로고침과 공유 시 복원

### 카드 실행 제한

- 화면에 가까운 카드만 로딩 후보가 된다.
- 동시에 실제 실행하는 Preview는 기본 2개로 제한한다.
- 사용자가 Run을 누른 카드를 우선한다.
- 화면 밖 iframe은 제거하고 다시 들어오면 재생성한다.
- WebGL, Three.js 등 무거운 예제는 항상 수동 Run으로 시작한다.

## 5. Sections

### Section 허브 `/sections`

- 제목과 한 문장 설명
- Section 카드 9개
- 각 카드에는 이름, 간단한 용도, 공개 예제 수와 대표 태그 표시
- Section 예제 수가 0이면 카드를 공개하지 않는다.

### Section 상세

```text
Section title / 설명 / 예제 수
Featured live example
관련 하위 태그
전체 실행형 카드 목록
관련 Pattern
```

Hero는 우선 허브로 관리하며 `Text Reveal`, `Image Reveal`, `Product`, `Portfolio`, `Scroll`, `Interactive` 하위 태그를 제공한다. 데이터가 없는 하위 태그는 숨긴다.

## 6. 예제 상세

### Desktop 구조

```text
Breadcrumb
제목 / 저장 / 나중에 연습
요약 / 태그 / 난이도
┌ Large Live Preview ──────────────────────────────────┐
│ Run · Reload · Full screen · Open CodePen            │
└───────────────────────────────────────────────────────┘
Overview
Interaction / 기술 / 구현 포인트
Source and license
Related examples / Pattern
```

### 정보 규칙

- 원본 제목과 공개 한국어 제목을 구분한다.
- `Created by`에는 CodePen 제작자를 표시한다.
- WSSS는 공개 출처가 아니라 내부 발견 경로이므로 기본 상세에 표시하지 않는다.
- 원본 Pen 링크와 MIT 라이선스 안내를 함께 제공한다.
- 코드 탭은 실제 코드를 확보하는 Phase 2 전까지 표시하지 않는다.
- 연습 기능이 없을 때 `자유 연습` 버튼을 표시하지 않는다. `연습 버전 요청`은 선택적으로 제공할 수 있다.

### Preview 제어

- Run 또는 Reload
- 전체 화면
- CodePen 새 창
- interaction 안내
- 실행 실패 시 다시 실행과 원본 열기

iframe 영역과 제어 버튼은 키보드 이동 순서가 명확해야 한다.

## 7. Saved

로그인 없이 브라우저 데이터를 사용한다.

탭:

- `저장한 예제`
- `나중에 연습`

각 탭은 저장 시각 최신순으로 보여준다. 공개 중지된 ID는 API 확인 후 목록에서 분리해 `현재 이용할 수 없음`으로 표시하고 제거할 수 있게 한다.

최초 저장 시 한 번만 다음 문구를 보여준다.

> 이 목록은 현재 브라우저에 저장됩니다. 브라우저 데이터를 삭제하면 함께 사라질 수 있어요.

빈 상태는 Explore와 Section 바로가기를 제공한다.

## 8. URL 제보

### 구조

```text
좋은 애니메이션을 발견했나요?
URL [________________________________]
한 줄 설명 (선택) [__________________]
Turnstile
[제보하기]
```

- 어떤 URL이 좋은지 예시를 제공한다.
- 제보가 바로 공개되지 않고 검수된다는 점을 제출 전에 표시한다.
- 중복 여부를 공개하지 않고 동일한 접수 성공 화면을 보여준다.
- 성공 후 같은 주소를 다시 보내지 않도록 입력을 초기화하고 Home/Explore 행동을 제공한다.
- 오류 시 입력값을 유지한다.

## 9. About

- 제품 목적
- 모든 Preview가 실제 코드로 실행된다는 원칙
- CodePen 원작자와 라이선스 표시 정책
- 일반 웹 패턴의 자체 제작 정책
- 로그인 없는 브라우저 저장 안내
- URL 제보와 오류 신고 방법

법률 문서처럼 과도하게 길게 쓰지 않고 사용자가 출처와 데이터 처리를 이해할 정도로 설명한다.

## 10. 공통 상태

### 초기 로딩

- Header와 텍스트를 먼저 표시한다.
- 카드 자리는 고정 높이 skeleton으로 레이아웃 이동을 막는다.
- Preview iframe 로딩과 페이지 데이터 로딩을 분리한다.

### API 오류

- 이미 받은 콘텐츠는 유지한다.
- 영향을 받은 영역 안에 오류와 재시도 버튼을 표시한다.
- 전체 페이지 오류는 첫 데이터조차 불러오지 못했을 때만 사용한다.

### Preview 오류

- 카드 또는 상세 Preview 안에서만 처리한다.
- `다시 실행`, `CodePen에서 열기`, `오류 알리기`를 제공한다.
- 실행 화면 대신 이미지나 영상을 표시하지 않는다.

### 공개 중지

- 기존 상세 URL에는 410 안내
- 제목, 중지 안내와 Explore 이동만 제공
- 관련 목록과 검색 결과에서는 즉시 제거

## 11. SEO와 공유

- Home, Explore, Section, 공개 상세와 About만 index 허용
- 검색 query 조합 페이지는 canonical을 Explore 기본 URL로 설정
- 상세 title: `{예제 제목} | Kwak Motion Lab`
- 상세 description: 한국어 요약 80~150자
- Open Graph에는 정적 녹화 화면 대신 브랜드 카드와 예제 메타데이터를 사용한다.
- iframe 내용에 의존하지 않고 제목, 설명과 태그를 HTML에 제공한다.

## 12. 화면 제작 순서

1. 전역 Shell과 디자인 토큰
2. Preview Card의 모든 상태
3. Explore와 필터 반응형
4. 예제 상세
5. Home
6. Sections
7. Saved
8. URL 제보와 About

Preview Card와 Explore를 먼저 완성하면 데이터, 성능과 탐색 구조를 가장 빠르게 검증할 수 있다.

## 13. 화면 승인 기준

- Light가 시스템 설정과 무관하게 최초 기본값이다.
- 로그인 없이 모든 Phase 1 경로를 사용할 수 있다.
- 제공되지 않는 Practice와 Learn 진입점이 없다.
- 카드 Preview와 상세 이동 영역이 분리된다.
- 320px부터 1440px 이상까지 가로 스크롤이 생기지 않는다.
- 실제 Preview 2개 실행 중에도 검색과 필터가 반응한다.
- 키보드만으로 검색, 필터, Run, 상세 이동과 저장을 완료한다.
- reduced motion에서도 정보와 기능이 사라지지 않는다.
- Preview 실패가 다른 카드와 페이지를 중단시키지 않는다.
