# Phase 1 관리자 검수 화면 명세

문서 상태: Draft v0.1
대상: 소유자 한 명
목표: 많은 CodePen 후보를 실제 실행 화면으로 확인하고 정확하게 분류·공개한다.

## 1. 핵심 작업 흐름

```text
Dashboard
→ Candidate Inbox
→ 실제 CodePen 실행 확인
→ 메타데이터와 태그 수정
→ 승인 / 보류 / 중복 / 거절
→ 다음 후보
```

관리자가 한 화면에서 판단을 끝낼 수 있게 하고, 승인에 필요한 정보가 없으면 버튼을 비활성화하는 대신 부족한 항목을 바로 표시한다.

## 2. 정보 구조

```text
Admin
├─ Dashboard
├─ Candidates
│  ├─ Ready
│  ├─ Needs Edit
│  ├─ Possible Duplicates
│  ├─ Preview Failed
│  └─ User Submissions
├─ Published
├─ Sources
├─ Ingestion Runs
└─ Settings
```

Phase 1에서는 Generation Queue와 Tutorial 관리 메뉴를 노출하지 않는다.

## 3. Dashboard

첫 화면에는 오늘 처리할 일과 운영 이상만 보여준다.

### 상태 카드

- 승인 대기
- 수정 필요
- 중복 확인 필요
- Preview 실패
- 최근 24시간 신규 후보
- 공개 콘텐츠 수

### 운영 상태

- 마지막 WSSS 수집 성공 시간
- 최근 수집의 신규, 중복과 실패 수
- Worker 및 D1 무료 한도 경고 상태
- 예약 수집 `정상`, `지연`, `중지` 상태

주요 행동은 `승인 대기 검수`, `실패 확인`, `수집 수동 실행` 세 가지다.

## 4. Candidate Inbox

### 화면 구조

데스크톱에서는 목록과 검수 패널을 함께 표시한다.

```text
┌ Queue / Search / Filters ─────────────────────────────┐
├ Candidate list ─────┬ Live Preview ────┬ Edit panel ──┤
│ title               │ CodePen iframe   │ title        │
│ source/category     │ run/reload/open  │ summary      │
│ warnings            │ interaction note│ tags         │
│ age/priority        │ errors           │ difficulty   │
└─────────────────────┴──────────────────┴───────────────┘
                       Reject  Duplicate  Needs edit  Approve
```

- 목록 폭은 고정하고 Preview에 가장 넓은 영역을 준다.
- 편집 패널은 세로 스크롤하되 하단 결정 바는 고정한다.
- 후보를 바꿔도 목록 필터와 스크롤 위치를 유지한다.
- Preview와 편집 내용이 로드되기 전에는 이전 후보의 결정 버튼을 재사용하지 않는다.

### 목록 표시 정보

- WSSS 제목
- WSSS 카테고리
- CodePen 작성자와 Pen 제목
- 자동 제안 태그
- `미리보기 미확인`, `작성자 없음`, `중복 가능` 등의 경고
- 우선순위와 수집일

### 필터와 정렬

- 상태
- WSSS 카테고리
- 태그 축
- Preview 확인 여부
- 중복 가능성
- 수집 실행
- 최신순, 오래된순, 우선순위순

기본값은 `review + 오래된순`이다. 오래 기다린 후보가 계속 뒤로 밀리지 않게 한다.

## 5. Live Preview 검수

Preview는 이미지나 녹화 화면이 아니라 CodePen의 실제 embed를 사용한다.

제공 기능:

- Run 또는 Reload
- 새 창에서 원본 Pen 열기
- viewport `Desktop`, `Tablet`, `Mobile` 전환
- 상호작용 안내
- `정상 실행 확인` 체크
- 실패 사유 선택

실패 사유:

- Pen 접근 불가
- 빈 결과
- JavaScript 오류로 보이는 동작 실패
- 필수 외부 리소스 실패
- 지나치게 무겁거나 멈춤
- 유해하거나 부적절한 콘텐츠
- 모바일에서 사용할 수 없음

Cross-origin iframe 내부 오류를 서비스가 모두 읽을 수 없으므로 Phase 1의 최종 실행 확인은 관리자 체크로 남긴다. 확인 시각과 검수한 viewport를 저장한다.

검사 결과에는 현재 Pen key와 embed 설정의 fingerprint를 함께 저장한다. Pen 주소나 설정이 바뀌면 기존 확인은 자동으로 무효가 되고 다시 확인해야 한다.

## 6. 편집 패널

### 기본 정보

- 공개 제목: 한국어, 필수
- 원본 제목: 원문 유지
- 한 줄 요약: 한국어, 필수
- slug: 제목에서 제안하고 승인 전 중복 확인
- 난이도: Beginner, Intermediate, Advanced
- Featured 여부

### 출처 정보

- CodePen 작성자
- canonical Pen URL
- WSSS 발견 게시물과 카테고리
- 라이선스와 확인 근거
- 마지막 접근 확인 시각

WSSS는 내부 발견 경로로 보관하고 공개 화면에는 CodePen 작성자, Pen 제목, 원본 링크와 라이선스를 표시한다.

### 태그

축별로 구분한다.

- Technology
- Trigger
- Motion
- Section
- Technique
- Mood

수집 규칙이 확정한 태그, 제목에서 추론한 태그와 관리자가 확정한 태그를 모양으로 구분한다. 낮은 신뢰도의 제안은 승인 전 확인 대상으로 표시한다.

## 7. 승인 조건

다음 조건이 모두 충족되어야 승인할 수 있다.

- CodePen Preview를 이번 검수에서 정상 실행 확인
- canonical URL, 작성자와 원본 제목 존재
- 공개 제목과 요약 존재
- 난이도 선택
- Technology 또는 Section 태그 중 하나 이상 확정
- 라이선스와 확인 근거 존재
- 확정되지 않은 중복 경고 없음
- 거절 수준의 안전 또는 품질 경고 없음

승인하면 Entry, CodePenRef, 확정 태그와 ReviewDecision을 하나의 작업으로 저장하고 다음 후보로 이동한다.

## 8. 결정 종류

### 승인

즉시 공개한다. 공개 URL을 결과 toast에서 열 수 있다.

### 수정 필요

누락 정보, 태그 재검토, Preview 재확인 중 하나 이상의 이유를 선택한다. 자유 메모만으로 저장하지 않는다.

### 중복

기존 Candidate 또는 공개 Entry를 검색해 대상을 선택한다. WSSS 발견 경로는 기존 Source에 추가한 뒤 현재 Candidate를 종료한다.

### 거절

다음 reason code 중 하나가 필수다.

- `not-animation`
- `source-unavailable`
- `unsafe-content`
- `broken-preview`
- `unsupported-runtime`
- `insufficient-quality`
- `license-uncertain`
- `other`

### 공개 중지

Published 화면에서 즉시 처리할 수 있다. 사용자 URL은 `410 Gone` 상태와 간단한 안내를 보여준다.

## 9. 일괄 작업

일괄 승인은 다음 후보에만 허용한다.

- 각 후보를 개별적으로 Preview 확인함
- 필수 필드와 확정 태그가 모두 있음
- 중복과 경고가 없음
- 같은 검수 세션에서 선택됨

일괄 태그 추가, 수정 필요 이동과 거절은 가능하다. 일괄 거절에도 공통 reason code가 필수다. 일괄 작업 결과는 성공과 실패를 항목별로 보여준다.

## 10. 저장과 충돌

- 필드 변경 후 800ms 동안 입력이 없으면 임시 저장한다.
- 저장 요청에는 Candidate `version`을 포함한다.
- `409 VERSION_CONFLICT`가 발생하면 서버 값과 현재 편집 값을 비교해 보여준다.
- 결정 버튼을 누르면 진행 중 자동 저장을 먼저 완료한다.
- 네트워크 오류 시 편집값을 브라우저에 임시 보관하고 재시도한다.
- 승인 요청은 idempotency key를 사용한다.

## 11. 키보드와 접근성

- 목록은 위·아래 방향키로 이동할 수 있다.
- `Ctrl/Cmd + Enter`는 모든 승인 조건이 충족된 경우에만 승인한다.
- 거절과 공개 중지는 단축키 하나로 실행하지 않는다.
- Preview iframe에는 Pen 제목과 작성자를 포함한 title을 제공한다.
- 상태는 색상과 아이콘·텍스트를 함께 사용한다.
- 포커스가 Preview iframe에 들어간 상태와 관리자 UI에 있는 상태를 구분한다.

## 12. 반응형

- Desktop: 3열 검수 작업 공간
- Tablet: 목록 + Preview/편집 탭
- Mobile: 상태 확인, 메모와 긴급 공개 중지만 지원

대량 분류와 승인은 Desktop을 기준으로 설계한다.

## 13. 화면별 완료 조건

### Candidate Inbox

- 100개 후보에서도 필터와 다음 후보 이동이 끊기지 않는다.
- Preview 하나의 실패가 목록을 중단시키지 않는다.
- 승인 불가 이유를 버튼 주변에서 모두 확인할 수 있다.
- 후보를 처리한 뒤 같은 필터의 다음 후보로 이동한다.

### Ingestion Runs

- 실행별 신규, 중복, 실패와 checkpoint를 확인한다.
- 실패 항목만 내려받거나 재시도할 수 있다.
- 무료 한도 중지와 소스 오류를 구분한다.

### Published

- 공개 화면을 바로 열 수 있다.
- Preview 마지막 확인 시각을 볼 수 있다.
- 공개 중지 이유와 이력을 확인한다.
