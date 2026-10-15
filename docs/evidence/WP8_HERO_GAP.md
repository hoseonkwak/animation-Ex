# WP8 Hero 20개 목표 부족분 분석

검증일: 2026-10-15
환경: Production D1 `kwak-motion-lab-production`
범위: 공개 Hero 수와 관리자 검수 대기 후보 풀의 읽기 전용 집계

## 결론

- 목표는 공개 Hero 20개 이상이다.
- 현재 `section:hero`가 확정된 공개 Entry는 1개다.
- 목표까지 19개가 부족하다.
- 검수 대기 후보 중 Hero 관련 신호가 있는 항목은 중복 제거 후 44개다.
- 후보 풀은 수량상 목표를 채울 수 있다. 44개 중 19개, 약 43.2%가 품질 게이트를 통과하면 된다.
- 추가 수집보다 현재 44개를 먼저 검수한다. 검수 결과 유효 후보가 19개보다 적을 때만 Hero 전용 출처 수집을 추가한다.

## 현재 공개 Hero

| Entry             | 제목            | 난이도   | 원본                 |
| ----------------- | --------------- | -------- | -------------------- |
| `entry-legacy-08` | `scrollSmother` | advanced | `hoseonkwak/QwbVorG` |

현재 공개 수는 1개이며 부족분은 19개다.

## 검수 대기 후보 풀

| 신호                             | 후보 수 | 해석                                       |
| -------------------------------- | ------: | ------------------------------------------ |
| `section:hero` 제안 태그         |      33 | 모두 `inferred`, confidence `0.7`, 미확정  |
| 제목에 `hero` 또는 `히어로` 포함 |       4 | `COMICS HEROES`처럼 의미가 다른 오탐 가능  |
| WSSS `UI/Intro UI`               |      15 | 첫 화면 후보지만 완결된 Hero인지 확인 필요 |
| 위 조건의 합집합                 |      44 | 중복 제거된 실제 검수 풀                   |

제안 태그 33건의 출처 카테고리 분포는 다음과 같다.

| WSSS 카테고리       | 후보 수 |
| ------------------- | ------: |
| Particles/Particles |       9 |
| Text/Text           |       6 |
| UI/Intro UI         |       4 |
| Animation/Animation |       3 |
| Slider/Image Slider |       3 |
| Animation/Loading   |       2 |
| UI/Layout UI        |       2 |
| Animation/GSAP      |       1 |
| Mouse/Mouse Effect  |       1 |
| Parallax/Scroll     |       1 |
| UI/Dashboard UI     |       1 |

## 우선 검수 순서

1. 제목과 태그가 모두 Hero를 가리키는 후보
   - `Illustration parallax on hero section`
   - `Kalli Hero`
   - `Triangle Grid Scifi Hero`
2. 완결된 첫 화면 가능성이 높은 Intro·Landing 후보
   - `intro grid section`
   - `Animated Landing Page Design TweenMax`
   - `Page intro animation`
   - `Landing page with swiper`
   - `GSAP Homepage Demo 1`
3. Slider, Text, Parallax, Layout 계열의 `section:hero` 제안 후보
4. Particles와 Loading 후보는 배경 효과만 있는지 확인한 뒤 Hero 여부를 결정

`COMICS HEROES IN POLYGONS`는 제목의 Hero가 웹 섹션이 아닌 캐릭터를 뜻하므로 제목 키워드만으로 확정하지 않는다. `Magnetic Button`, `Crowd Simulator`처럼 Intro UI에 들어 있지만 Hero 전체 구성이 아닐 수 있는 사례도 같은 방식으로 제외한다.

## Hero 판정 기준

다음 조건을 모두 만족한 후보만 `section:hero`로 확정한다.

1. 첫 화면에서 제목, 메시지 또는 주요 시각 요소가 하나의 구성을 이룬다.
2. 배경 효과나 단일 버튼만 있는 조각이 아니라 Hero 영역으로 재사용할 수 있다.
3. 실제 CodePen Result가 오류 없이 실행되고 주요 애니메이션이 보인다.
4. 모바일이나 좁은 viewport에서 핵심 콘텐츠를 확인할 수 있다.
5. 제작자, 원본 URL과 라이선스 정보가 있다.
6. 공개 제목, 한국어 요약, 난이도, 상호작용 안내와 축별 태그가 완성됐다.

## 실행 계획

1. 우선 후보 24건을 실제 Preview로 검수한다.
2. 통과 후보에 `section:hero`를 확정하고 메타데이터를 보완한다.
3. 부족하면 나머지 후보까지 검수 범위를 넓힌다.
4. 44건을 모두 검수한 뒤에도 공개 가능한 후보가 19개 미만일 때만 Hero 전용 수집을 추가한다.
5. 승인 후 `/sections/hero`와 Explore 필터에서 20개 이상 노출되는지 확인한다.

실제 승인과 태그 확정은 연결이 완료된 GitHub OAuth owner 관리자 경로에서 수행한다. 후보 상태와 태그는 관리자 API를 통해 변경하고 Production D1을 직접 수정하지 않는다.
