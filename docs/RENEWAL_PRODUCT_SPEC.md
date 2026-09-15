# Kwak Motion Lab 리뉴얼 제품 설계서

문서 상태: Draft v0.1
기준일: 2026-09-15
목적: 구현 전에 제품 구조, 콘텐츠 정책, 자동화 하네스와 검증 기준을 고정한다.

## 1. 제품 정의

Kwak Motion Lab은 웹 애니메이션 사례를 자동으로 발견하고, 실행 가능한 코드 예제로 정리하며, 사용자가 직접 코드를 수정하고 학습할 수 있게 하는 공개형 개인 도구다.

제품 목표의 우선순위는 다음과 같다.

1. 운영자가 매일 사용할 수 있는 개인 애니메이션 레퍼런스 도구
2. 누구나 로그인 없이 이용하는 한국어 웹 애니메이션 아카이브
3. 사용자가 충분히 모인 뒤 학습 콘텐츠와 프로젝트 패키지를 통한 수익화

핵심 사용자 가치는 다음 흐름을 한곳에서 제공하는 것이다.

```text
찾기 → 실제 코드로 실행 → 코드 확인 → 직접 수정 → 원리 학습 → CodePen 저장
```

## 2. 제품 원칙

1. 사용자에게 공개되는 모든 애니메이션은 실제 코드로 실행되어야 한다.
2. 이미지, GIF, 녹화 영상은 실행 화면의 대체재로 사용하지 않는다.
3. 콘텐츠 후보는 최대한 많이 확보하되 공개 콘텐츠는 실행과 출처 검증을 통과해야 한다.
4. 사용자 기능은 로그인 없이 제공한다.
5. 코드와 콘텐츠의 원본 데이터는 서비스 내부에서 관리한다.
6. CodePen은 원본 Pen 표시, 외부 편집, Fork, 저장과 공유에 사용한다.
7. 일반 웹 사례는 패턴을 분석하되 코드, 문구, 이미지와 SVG는 학습용 샘플로 새로 제작한다.
8. 사이트 UI의 움직임은 절제하고 예제 애니메이션에 시선을 집중시킨다.
9. 자동화 실패는 숨기지 않고 상태와 원인을 기록한다.
10. 사람의 수정과 거절 이유를 다음 자동화 개선에 사용할 수 있게 보관한다.

## 3. 대상 사용자

주 대상은 JavaScript 기본기를 가진 애니메이션 초급자부터 중급자다.

사용자가 해결하려는 일은 다음과 같다.

- 특정한 움직임이나 적용 영역에 맞는 사례 찾기
- 애니메이션을 실제로 실행해 보기
- 사용 기술과 난이도 파악하기
- 코드를 직접 수정하며 연습하기
- 구현 원리와 핵심 코드를 한국어로 학습하기
- 마음에 드는 사례를 저장하거나 나중에 연습하기

## 4. 공개 범위와 계정

### 공개 영역

- Home
- Explore
- Sections
- Collections
- Tutorials
- 콘텐츠 상세
- Practice
- About

### 비공개 영역

- 관리자 화면
- 수집 후보
- 생성 중 콘텐츠
- 검증 실패 기록
- 미승인 콘텐츠
- 내부 출처 및 분석 이력

### 사용자 계정

첫 버전에는 사용자 회원가입을 만들지 않는다.

- 북마크, 나중에 연습, 최근 연습과 작성 코드는 브라우저에 저장한다.
- 영구적인 외부 저장은 CodePen 내보내기로 지원한다.
- 관리자 인증만 제공한다.
- 결제, 클라우드 저장, 기기 간 동기화가 필요해질 때 선택적 회원 기능을 추가한다.

## 5. 정보 구조

```text
Home
├─ Interactive Hero
├─ Featured Collections
├─ Recently Added
├─ Practice Ready
├─ Popular Patterns
└─ Start Learning

Explore
├─ All
├─ Latest
├─ Popular
├─ Practice Ready
└─ Tutorial Available

Sections
├─ Hero
├─ Navigation
├─ Gallery
├─ Slider
├─ Card
├─ Button
├─ Text
├─ Footer
├─ Loading
└─ Background

Learn
├─ Tutorials
├─ Series
├─ Difficulty
└─ Technology

Practice
├─ Recent Practice
├─ Draft Code
└─ Completed Missions

About
└─ Product, content and source policy
```

기본 내비게이션 이름은 `HOME`, `EXPLORE`, `SECTIONS`, `LEARN`, `PRACTICE`, `ABOUT`으로 한다.

## 6. 콘텐츠 단위

하나의 공개 콘텐츠는 애니메이션이 포함된 완결된 섹션을 다룬다.

- Hero는 헤더와 첫 화면의 완결된 인터랙션까지 포함할 수 있다.
- 스크롤 사례는 효과가 시작되고 끝나는 구간까지 포함한다.
- 사이트 전체를 복제하지 않는다.
- 원본과 동일한 문구, 이미지, SVG, 로고를 사용하지 않는다.
- 애니메이션 패턴과 섹션 구성을 참고해 학습용 예제로 다시 제작한다.

콘텐츠는 다음 결과물을 가질 수 있다.

```text
Animation Entry
├─ Source Record
├─ Executable Code Package
├─ Practice Kit
└─ Tutorial
```

### Source Record

- 발견 URL
- 원본 또는 영감 출처 URL
- CodePen URL
- 원작자
- 발견 경로
- 수집 날짜
- 라이선스
- 내부 분석 메모

### Executable Code Package

- HTML
- CSS
- JavaScript
- 외부 라이브러리
- 자체 또는 허용된 에셋
- 기준 viewport
- 인터랙션 사용법
- 검증 결과
- 버전

### Practice Kit

- 자유 연습 시작 코드
- 단계별 미션 시작 코드
- 힌트
- 예상 상태
- 자동 완료 조건
- 해설 코드

### Tutorial

- 학습 목표
- 완성 결과
- 난이도와 예상 시간
- 사전 지식
- 단계별 설명
- 핵심 코드
- 흔한 오류
- 응용 과제
- 관련 예제

## 7. 콘텐츠 상태

```text
CANDIDATE
→ ANALYZING
→ GENERATING
→ VALIDATING
→ REVIEW
→ PUBLISHED
→ PRACTICE_READY
→ TUTORIAL
```

실패 상태는 다음과 같이 구분한다.

- ANALYSIS_FAILED
- GENERATION_FAILED
- VALIDATION_FAILED
- NEEDS_EDIT
- DUPLICATE
- REJECTED
- SOURCE_UNAVAILABLE

CodePen 원본이 있고 실행 가능한 경우 생성 단계를 생략하고 검증과 승인으로 이동할 수 있다. 일반 웹사이트에서 발견한 사례는 실행 가능한 코드 패키지가 만들어지기 전까지 공개하지 않는다.

## 8. 콘텐츠 유형과 출처 정책

### 기존 CodePen 콘텐츠

- 원본 Pen을 실행한다.
- 원작자와 원본 Pen 링크를 공개한다.
- 공개 Pen 코드를 가져오거나 상당 부분 수정하는 경우 MIT 고지를 유지한다.
- Practice Kit은 코드를 합법적으로 확보하고 내부 실행 형식으로 검증한 이후 제공한다.

### 일반 웹사이트 기반 콘텐츠

- 애니메이션 패턴과 섹션 구조를 분석한다.
- HTML, CSS와 JavaScript를 새로 작성한다.
- 샘플 이미지, 샘플 문구와 새 SVG를 사용한다.
- 원본 상호, 로고와 고유 에셋을 사용하지 않는다.
- 결과물은 `Created by Kwak Motion Lab`으로 공개한다.
- 영감 출처는 중복 방지와 감사 추적을 위해 내부에 보관한다.
- 매우 독창적인 시각 표현과 가깝다고 판정되면 자동 공개하지 않고 관리자 검토로 보낸다.

## 9. 분류 체계

태그는 하나의 목록으로 섞지 않고 축을 분리한다.

| 분류 축 | 예시 |
|---|---|
| Technology | GSAP, CSS, JavaScript, Three.js, WebGL |
| Trigger | Load, Scroll, Hover, Click, Drag |
| Motion | Slide, Fade, Scale, Rotate, Morph, Reveal |
| Section | Hero, Gallery, Card, Navigation, Button |
| Technique | Mask, Parallax, Pin, Scrub, Stagger |
| Difficulty | Beginner, Intermediate, Advanced |
| Mood | Minimal, Dynamic, Cinematic, Playful |

초기 코드 생성 지원 기술은 GSAP, CSS와 JavaScript로 제한한다. Three.js와 WebGL은 수집 및 원본 실행은 허용하되 자체 생성 지원은 이후 단계에서 추가한다.

## 10. 패턴과 컬렉션

유사 콘텐츠는 삭제하지 않고 공통 패턴 아래에 묶는다.

```text
Pattern: Image Reveal Hero
├─ Example A
├─ Example B
└─ Example C
```

컬렉션은 운영자가 직접 구성하거나 태그 조합으로 자동 생성할 수 있다.

초기 추천 컬렉션은 다음과 같다.

- Hero Animations
- Scroll Experiences
- Text Motion
- Mouse Interactions
- Practical UI Motion

Hero는 독립된 Section 허브로 제공한다.

## 11. 수집 출처

### 수집 진입점

1. 관리자의 URL 직접 등록
2. 지정 사이트 정기 순회
3. 일반 웹 자동 검색
4. 사용자의 로그인 없는 URL 제보

모든 진입점은 동일한 Candidate 파이프라인으로 들어간다.

### 초기 핵심 출처

- WSSS
- CodePen
- GSAP Showcase
- Awwwards
- Godly
- 개인 포트폴리오

### WSSS 전용 규칙

- 공개 대상 관련 카테고리와 페이지를 순회한다.
- WSSS 게시물과 실제 CodePen을 구분해 저장한다.
- CodePen 주소와 작성자를 추출한다.
- WSSS 카테고리를 내부 태그 체계로 변환한다.
- CodePen canonical URL을 우선 중복 키로 사용한다.
- 삭제된 Pen은 공개하지 않는다.
- `discoveredVia`에는 WSSS를, `canonicalSource`에는 원본 Pen을 기록한다.

초기 공개 대상 카테고리는 Animation, Image, Slider, Mouse, Particles, Parallax, Button, Menu, Text와 UI다. 다른 카테고리는 후보로 보관하되 기본 공개 범위에서 제외한다.

## 12. 수집 및 생성 우선순위

후보는 최대한 확보한다. 점수는 수집 여부가 아니라 코드 생성과 튜토리얼 제작 순서를 정한다.

초기 우선순위 요소는 다음과 같다.

| 요소 | 비중 |
|---|---:|
| Learning Value | 30% |
| Practical Value | 25% |
| Visual Quality | 20% |
| Recreation Feasibility | 15% |
| Trend | 10% |

사용자의 연습 요청과 튜토리얼 요청은 별도의 가산점으로 반영한다.

## 13. 사용자 화면

### Home

1. 실제 코드로 실행되는 Interactive Hero
2. 자연어 검색
3. Featured Collections
4. Recently Added
5. Practice Ready
6. Popular Patterns
7. Start Learning

### Explore

- 데스크톱 4열, 태블릿 2열, 모바일 1열
- Technology, Trigger, Motion, Section, Technique, Difficulty와 Status 필터
- 최신순, 추천순, 난이도순 정렬
- Grid와 Compact 보기
- 자연어와 키워드 검색
- AI가 자연어에서 해석한 필터를 사용자가 확인하고 수정

### 실행 카드

- 카드의 미리보기는 실제 코드로 실행한다.
- 화면에 보이는 카드만 실행한다.
- 동시 실행 수를 제한한다.
- 화면 밖 카드는 실행 환경을 중지하거나 제거한다.
- 무거운 예제는 사용자가 Run을 눌렀을 때 시작한다.
- 영상과 GIF는 사용하지 않는다.

### 상세

1. 제목, 태그, 난이도와 저장 버튼
2. 실제 코드 실행 화면
3. 재시작, 전체 화면과 새 창
4. Overview, Code, Learn, Related
5. 자유 연습, 단계별 학습과 CodePen 열기
6. 관련 패턴과 예제

## 14. Practice 경험

### 화면

- 데스크톱: 크기 조절 가능한 코드와 Preview 분할 화면
- 모바일: Code, Preview와 Mission 탭
- HTML, CSS와 JavaScript 탭
- Mission, Hint와 Console 패널

### 실행

- 입력이 멈춘 뒤 자동 실행한다.
- 사용자가 자동 실행을 끌 수 있다.
- Run으로 즉시 실행할 수 있다.
- 연속 실패 시 수동 실행 모드로 전환한다.
- 실행 전에 코드를 브라우저에 자동 저장한다.
- 오류 시 마지막 정상 상태로 복구할 수 있다.

### 자유 연습

- 완성 코드 수정
- 실시간 Preview
- 초기화
- 전체 화면
- 콘솔
- CodePen으로 보내기

### 단계별 미션

- 목표
- 시작 코드
- 예상 결과
- 단계별 힌트
- 자동 판정
- 직접 완료 표시
- 정답 비교
- 원본 상태 복원

## 15. 실행 보안

사용자 코드와 생성 코드는 본 서비스와 분리된 Preview 출처에서 실행한다.

- Preview에는 로그인 쿠키, API 키와 사용자 정보를 전달하지 않는다.
- sandbox iframe에서 필요한 스크립트 실행 권한만 허용한다.
- `allow-same-origin`, 팝업, 다운로드, 폼 전송과 상위 페이지 이동은 허용하지 않는다.
- CSP로 외부 스크립트, 이미지, 폰트와 네트워크 요청을 제한한다.
- 승인된 라이브러리 CDN만 허용한다.
- 반복문 실행 제한과 상태 heartbeat를 둔다.
- 응답이 없는 Preview는 폐기하고 새로 만든다.
- 로그, DOM 생성량과 재실행 횟수를 제한한다.

## 16. 미션 판정

자동 판정은 다음 방식을 조합한다.

- 정적 검사: 요소, 메서드와 속성 존재 여부
- 실행 검사: 오류 없이 완료되는지
- DOM 검사: 요소가 기대 상태로 변하는지
- 시각 검사: 주요 시점의 렌더 상태
- 사용자 확인: 자동 판정이 어려운 감성적 결과

각 미션은 판정 규칙, 실패 메시지와 힌트를 명시해야 한다.

## 17. 관리자

초기 관리자는 소유자 한 명이다. 다중 관리자와 역할 관리 기능은 만들지 않는다.

### 주요 화면

- Dashboard
- Candidate Inbox
- Reference Review
- Generation Queue
- Generated Example Review
- Validation Failures
- Published Content
- Source Registry
- Tags and Collections
- Request Queue
- Settings

### 주요 작업

- Reference 일괄 승인
- CodePen 실행 확인
- 제목, 작성자와 태그 수정
- 중복 병합
- 생성 우선순위 변경
- 코드 직접 수정
- 재생성 요청
- 재검증
- 승인, 거절과 공개 중지
- 실패 원인과 검수 의견 기록

## 18. 자동화 하네스

자동화는 하나의 자유로운 에이전트에게 전 과정을 맡기지 않고, 명확한 입력과 출력을 가진 단계로 구성한다.

```text
Discovery
→ Extraction
→ Deduplication
→ Classification
→ Code Generation
→ Static Validation
→ Runtime Validation
→ Human Review
→ Publishing
→ Monitoring
```

각 단계는 다음 항목을 기록한다.

- 입력 데이터와 버전
- 사용한 규칙과 모델 버전
- 출력 데이터
- 신뢰도
- 검증 결과
- 실패 원인
- 재시도 횟수
- 사람의 수정과 판단
- 다음 상태

단계 간 전달 데이터는 명시된 스키마를 통과해야 한다. 검증에 실패한 항목은 다음 단계로 이동하지 않는다.

## 19. 공개 검증 게이트

모든 공개 콘텐츠는 다음 조건을 충족해야 한다.

- 검증된 CodePen 참조 또는 실행 가능한 내부 코드 패키지가 존재함
- JavaScript 실행 오류가 없음
- 필수 외부 리소스가 로드됨
- 애니메이션 또는 인터랙션이 작동함
- 재시작 가능함
- 출처 및 제작 방식 데이터가 존재함
- 필수 태그가 존재함
- 중복 콘텐츠가 아님
- Preview sandbox에서 실행 가능함
- 화면 밖에서 실행을 중단할 수 있음

Practice Ready 상태에는 다음 조건이 추가된다.

- 편집 가능한 시작 코드 존재
- 초기화 가능
- 자동 저장 가능
- CodePen 내보내기 가능
- 자동 실행 실패 복구 가능

Tutorial 상태에는 다음 조건이 추가된다.

- 학습 목표와 사전 지식 명시
- 단계별 실행 코드 검증
- 미션 판정 규칙 검증
- 정답과 힌트 검수

## 20. 운영 주기

- 관리자가 URL 등록: 즉시 분석
- WSSS 등 지정 출처: 하루 한 번 신규 항목 확인
- 일반 웹 자동 검색: 일주일에 두 번
- 실패한 원본 URL: 일주일 후 다시 확인
- 기존 공개 콘텐츠: 한 달에 한 번 실행 상태 확인

생성 실패는 다음 순서로 처리한다.

```text
첫 실패: 원인 분석 후 자동 수정
두 번째 실패: 다른 구현 방식으로 재시도
세 번째 실패: 자동 중단 후 관리자 검토
```

수집 한도와 코드 생성 한도는 별도로 관리한다.

## 21. 검색과 SEO

- 한국어를 기본 언어로 사용한다.
- 원본 제목은 원문을 유지한다.
- 기술명과 태그는 영어를 사용한다.
- 한국어와 영어 검색을 모두 지원한다.
- 자연어 검색을 구조화된 태그 조건으로 변환한다.
- 결과가 부족하면 완화한 조건을 사용자에게 알린다.
- 공개 상세, Section, Pattern, Collection과 Tutorial에 고유 URL을 제공한다.
- 관리자, 미승인 콘텐츠와 임시 Practice URL은 검색엔진에서 제외한다.

## 22. 개인 기능

로그인 없이 다음 데이터를 브라우저에 저장한다.

- Saved Examples
- Practice Later
- Recent Practice
- Draft Code
- Completed Missions
- Content Requests
- Theme Preference

첫 버전에는 사용자 지정 컬렉션을 제공하지 않는다. `저장한 예제`와 `나중에 연습` 두 개의 기본 목록만 제공한다.

## 23. 익명 제품 지표

개인을 식별하지 않는 집계 데이터만 수집한다.

- 검색어와 결과 없음 비율
- 예제 실행 횟수와 실행 성공률
- 인기 태그와 Section
- 상세 진입률
- 연습 시작률
- 미션 완료율
- CodePen 내보내기 횟수
- 연습 및 튜토리얼 요청 수
- 공개 콘텐츠 오류율

## 24. 비주얼 방향

- 브랜드명: Kwak Motion Lab
- 기본 테마: Light
- 선택 테마: Dark
- 최초 방문 기본값: Light
- 배경: 따뜻한 밝은 중성색
- 표면: White
- 텍스트: 높은 대비의 짙은 중성색
- 포인트: 선명한 Indigo 계열
- 넓은 여백과 큰 제목
- 얇고 선명한 경계
- 절제된 둥근 모서리
- 예제 콘텐츠에는 각자의 포인트 색상 허용
- 사용자의 reduced motion 설정을 존중

## 25. 단계별 출시

### Phase 1: Executable Library

- Vue 사용자 사이트
- WSSS 관련 CodePen 최대한 수집
- 기존 예제 15개 이전 및 Featured 적용
- 실제 코드 실행 카드와 상세
- 태그, 검색, 필터와 Hero 컬렉션
- 관리자 승인함
- 중복, 삭제와 실행 오류 검사
- 북마크와 나중에 연습
- Light와 Dark 테마

### Phase 2: Practice

- 자체 코드 편집기
- 격리된 자동 실행
- 자유 연습
- 브라우저 저장
- CodePen 내보내기
- 콘솔과 오류 복구

### Phase 3: Generation and Learning

- 일반 웹 사례 분석
- 실행 코드 자동 생성
- 생성 코드 검증
- 단계별 미션과 자동 판정
- 튜토리얼 생성
- 관리자 코드 수정과 재생성

### Phase 4: Automated Operation

- 지정 사이트 정기 순회 확대
- 일반 웹 자동 발견
- 조건부 자동 승인과 공개
- 실패 분석과 재시도
- 사용자 요청 기반 우선순위

## 26. 초기 콘텐츠 목표

- WSSS 관련 카테고리의 유효한 CodePen을 최대한 후보로 확보
- 기존 예제 15개를 Featured로 이전
- Hero 컬렉션 20개 이상
- 추천 컬렉션 5개
- Practice Ready 예제 10개
- 정식 Tutorial 3개

## 27. 수익화 원칙

기본 라이브러리, 실행 화면, 코드 확인과 자유 연습은 무료로 유지한다.

향후 유료 후보는 다음과 같다.

- 체계적인 GSAP 학습 과정
- Hero 제작 과정
- 실전 프로젝트
- 고급 코드 및 에셋 패키지
- 고급 미션과 자동 피드백
- 클라우드 저장과 기기 간 동기화
- 상업 프로젝트용 모션 템플릿

초기에는 일반 배너 광고를 넣지 않는다. 트래픽이 생긴 뒤 관련 도구 스폰서십을 검토할 수 있다.

## 28. 완료 기준

제품 설계 단계는 다음 문서가 합의되면 완료된다.

- 본 제품 설계서
- 결정 기록
- 개념 데이터 모델
- 화면별 요구사항
- 자동화 단계별 입력과 출력 스키마
- 검증 규칙과 실패 처리표
- Phase 1 수용 기준

현재 문서는 인터뷰 결과를 반영한 제품 기준선이다. 데이터 모델, 자동화 계약과 Phase 1 수용 기준은 후속 설계에서 더 구체화한다.
