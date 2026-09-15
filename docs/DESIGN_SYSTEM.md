# Kwak Motion Lab 디자인 시스템

문서 상태: Draft v0.1
범위: Phase 1 공개 화면과 관리자 화면의 공통 시각 기준

## 1. 디자인 방향

Kwak Motion Lab의 화면은 애니메이션 작품을 돋보이게 하는 밝은 전시 공간처럼 보인다.

- 정돈된 편집 디자인
- 따뜻한 밝은 배경과 선명한 텍스트
- Indigo 포인트
- 넓은 여백과 얇은 경계
- UI 자체의 움직임은 짧고 절제
- 각 Preview 안에서는 예제 고유의 색과 움직임을 허용

핵심 인상은 `정확함`, `탐색`, `실험`이다.

## 2. 색상 토큰

### Light 기본 테마

| 토큰 | 값 | 용도 |
|---|---|---|
| `color-bg` | `#F6F5F1` | 페이지 배경 |
| `color-surface` | `#FFFFFF` | 카드, 패널 |
| `color-surface-muted` | `#EFEEE9` | 보조 영역, skeleton |
| `color-text` | `#181817` | 기본 텍스트 |
| `color-text-muted` | `#666560` | 보조 텍스트 |
| `color-border` | `#DAD8D1` | 기본 경계 |
| `color-border-strong` | `#AAA79D` | 선택, 구분 강조 |
| `color-brand` | `#4F46E5` | 주요 행동, 링크, focus |
| `color-brand-hover` | `#4338CA` | hover, active |
| `color-brand-soft` | `#ECEBFF` | 선택 chip 배경 |
| `color-success` | `#18794E` | 성공 |
| `color-warning` | `#9A5B00` | 경고 |
| `color-danger` | `#B42318` | 오류, 공개 중지 |

### Dark 선택 테마

| 토큰 | 값 |
|---|---|
| `color-bg` | `#11110F` |
| `color-surface` | `#1B1B18` |
| `color-surface-muted` | `#252520` |
| `color-text` | `#F4F3EF` |
| `color-text-muted` | `#B7B5AD` |
| `color-border` | `#3A3933` |
| `color-border-strong` | `#67655C` |
| `color-brand` | `#8B83FF` |
| `color-brand-hover` | `#A7A1FF` |
| `color-brand-soft` | `#292650` |

상태색은 배경색과 아이콘·텍스트를 함께 사용한다. 색만으로 성공, 경고와 실패를 구분하지 않는다.

## 3. 타이포그래피

### 글꼴

```text
Sans: Pretendard Variable, Pretendard, system-ui, sans-serif
Mono: JetBrains Mono, Consolas, monospace
```

- Pretendard는 자체 호스팅하고 라이선스 파일을 함께 둔다.
- 로드 실패 시 시스템 글꼴로 자연스럽게 대체한다.
- Mono는 코드와 기술 식별자에만 사용한다.

### 크기

| 토큰 | Desktop | Mobile | 굵기/행간 |
|---|---:|---:|---|
| `display-xl` | 72px | 42px | 700 / 1.05 |
| `heading-1` | 48px | 34px | 700 / 1.12 |
| `heading-2` | 34px | 28px | 700 / 1.2 |
| `heading-3` | 24px | 21px | 650 / 1.3 |
| `body-lg` | 18px | 17px | 400 / 1.65 |
| `body` | 16px | 16px | 400 / 1.6 |
| `body-sm` | 14px | 14px | 400 / 1.5 |
| `label` | 13px | 13px | 600 / 1.4 |
| `caption` | 12px | 12px | 500 / 1.4 |

Hero 제목은 한 줄 12~16자 정도로 끊는다. 본문 한 줄은 최대 68자로 제한한다.

## 4. 간격과 크기

4px 배수를 사용한다.

```text
space-1  4px
space-2  8px
space-3  12px
space-4  16px
space-5  20px
space-6  24px
space-8  32px
space-10 40px
space-12 48px
space-16 64px
space-20 80px
space-24 96px
```

- 공개 페이지 최대 폭: 1440px
- 읽기 본문 최대 폭: 720px
- Header 높이: Desktop 72px, Mobile 60px
- 기본 버튼 높이: 44px
- 주요 검색 입력 높이: 60px
- 최소 터치 영역: 44×44px

## 5. 그리드와 반응형

| 이름 | 범위 | 열과 여백 |
|---|---|---|
| Mobile | 0~639px | 4열, 좌우 16px |
| Large Mobile | 640~767px | 6열, 좌우 24px |
| Tablet | 768~1023px | 8열, 좌우 32px |
| Desktop | 1024~1439px | 12열, 좌우 40px |
| Wide | 1440px 이상 | 최대 1440px, 좌우 48px |

Explore 카드 열:

- 1440px 이상: 4열
- 1024~1439px: 3열
- 640~1023px: 2열
- 639px 이하: 1열

카드 간격은 Desktop 20px, Mobile 16px다.

## 6. 형태와 깊이

- 카드 radius: 12px
- 입력과 버튼 radius: 8px
- chip radius: 999px
- Preview radius: 카드 안쪽 8px
- 기본 표면은 그림자 없이 1px border 사용
- 떠 있는 메뉴만 `0 12px 36px rgba(20, 20, 16, 0.12)` 사용
- hover에서 카드를 과도하게 띄우지 않고 border와 2px 이하 이동만 사용

## 7. 모션 토큰

UI 모션은 Preview 작품과 경쟁하지 않아야 한다.

| 토큰 | 시간 | 용도 |
|---|---:|---|
| `motion-fast` | 120ms | 버튼, chip |
| `motion-base` | 200ms | 메뉴, hover |
| `motion-slow` | 320ms | drawer, 화면 내 패널 |

기본 easing:

```text
standard: cubic-bezier(0.2, 0, 0, 1)
enter:    cubic-bezier(0, 0, 0.2, 1)
exit:     cubic-bezier(0.4, 0, 1, 1)
```

- 페이지 전환을 위한 전체 화면 애니메이션은 사용하지 않는다.
- `prefers-reduced-motion`에서는 위치 이동을 제거하고 즉시 전환 또는 짧은 opacity 변화만 사용한다.
- Preview 애니메이션은 학습 대상이므로 자동 제거하지 않고 Run과 설명을 제공한다.

## 8. Focus와 상호작용 상태

- focus ring: `2px solid color-brand`, 바깥 offset 2px
- hover와 focus를 같은 상태로 간주하지 않는다.
- disabled는 opacity만 낮추지 않고 텍스트로 이유를 제공한다.
- 로딩 중 버튼은 기존 너비를 유지한다.
- destructive 행동은 danger 색과 구체적인 동사를 사용한다.

## 9. 핵심 컴포넌트

### Button

종류:

- Primary: 주요 행동 한 개
- Secondary: 일반 행동
- Ghost: 도구와 보조 행동
- Danger: 공개 중지와 거절

한 영역에 Primary 버튼은 하나만 둔다.

### Tag Chip

- 기본: 중립 배경과 축약 label
- 선택: brand-soft 배경, brand 텍스트, 제거 아이콘
- 원래 기술명은 `GSAP`, `Three.js`, `WebGL`처럼 표기한다.
- 축은 색이 아니라 앞쪽 label 또는 그룹 제목으로 구분한다.

### Search Field

- 검색 아이콘, 입력, 지우기 버튼
- Enter로 실행
- 자동완성은 태그와 최근 검색을 구분
- 로딩, 결과 없음과 오류 상태를 입력 아래 live region에 알림

### Preview Card

```text
┌─────────────────────────────┐
│ Live Preview 16:10          │
│ Run / Loading / Error       │
├─────────────────────────────┤
│ GSAP  Scroll     저장       │
│ 스크롤 이미지 리빌          │
│ by GreenSock · Intermediate │
└─────────────────────────────┘
```

- 카드 전체 비율은 고정하지 않고 Preview만 16:10으로 유지한다.
- iframe 위에는 필요한 경우 `Preview 사용하기` 안내를 표시한다.
- 카드 정보 영역과 Preview 상호작용 영역을 분리한다.
- 저장 버튼은 제목 링크와 별도 focus 대상이다.

Preview 상태:

1. `idle`: Run 버튼 또는 진입 대기
2. `loading`: 중립 skeleton과 상태 문구
3. `running`: 실제 CodePen iframe
4. `paused`: 화면 밖에서 제거된 상태
5. `error`: 다시 실행과 상세 열기

실행 대신 정적 이미지나 영상을 표시하는 상태는 없다.

### Empty State

- 무슨 결과가 없는지 제목으로 설명
- 현재 검색어와 필터 유지
- 가장 제한적인 조건 제거
- 인기 예제 또는 URL 제보 행동 제공

### Toast와 Dialog

- 저장 성공처럼 되돌릴 수 있는 행동은 toast
- 공개 중지처럼 영향이 큰 행동은 dialog
- toast는 5초 안에 닫히되 키보드 focus를 강제로 이동하지 않는다.

## 10. 아이콘과 이미지

- 20px 또는 24px 선형 아이콘을 사용한다.
- 아이콘 단독 버튼에는 접근 가능한 이름을 제공한다.
- 브랜드용 장식 이미지를 대량 사용하지 않는다.
- 콘텐츠 이미지는 Preview 안에서만 사용하고 사이트 카드 썸네일로 복제하지 않는다.
- 빈 상태와 안내에는 단순 CSS 도형 또는 자체 SVG를 사용한다.

## 11. 접근성 기준

- 일반 텍스트는 WCAG AA 4.5:1 이상을 목표로 한다.
- 큰 텍스트와 UI 경계도 최소 기준을 확인한다.
- 모든 입력에 영구 label을 제공한다.
- landmark, heading 순서와 skip link를 유지한다.
- iframe title에 예제명과 작성자를 포함한다.
- 키보드가 iframe에 갇히지 않게 앞뒤 안내와 탈출 경로를 제공한다.
- 자동 실행 콘텐츠에 pause 또는 제거 수단을 제공한다.

현재 토큰의 대표 조합은 WCAG 계산 기준으로 다음 명암비를 갖는다.

- Light 기본 텍스트/배경: 약 16.3:1
- Light 보조 텍스트/배경: 약 5.35:1
- White/Primary 버튼: 약 6.29:1
- Dark 기본 텍스트/배경: 약 17.0:1
- Dark 보조 텍스트/배경: 약 9.2:1

## 12. 문구 원칙

- 버튼은 `보기`, `실행`, `저장`, `제보`처럼 행동을 직접 쓴다.
- 기술 태그를 제외한 설명은 한국어를 기본으로 한다.
- 오류는 원인과 다음 행동을 함께 알려준다.
- `준비 중` 화면을 만들지 않고 아직 없는 기능의 진입점을 숨긴다.
