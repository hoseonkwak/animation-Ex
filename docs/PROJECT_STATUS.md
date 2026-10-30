# Kwak Motion Lab 현재 진행 상황

기준일: 2026-10-30  
구현 기준 커밋: `a4b4d16` (전체 Explore 자동 스크롤 로딩)  
판정: **Phase 1 완료, Phase 2 구현·Preview 검증 진행 중**

이 문서는 현재 상태를 빠르게 파악하기 위한 요약이다. 결정의 우선순위는 [DECISIONS.md](DECISIONS.md), 상세 수용 기준은 [Phase 1](PHASE1_ACCEPTANCE.md)과 [Phase 2](PHASE2_EXECUTION_PLAN.md)를 따른다. 아래 운영 수치는 확인 날짜가 적힌 시점의 증거이며 실시간 집계가 아니다.

## 공개 서비스에서 할 수 있는 일

- 회원가입 없이 Home의 카테고리와 썸네일, Explore의 검색·필터·정렬, Sections, 예제 상세, 저장 목록, URL 제보를 이용할 수 있다. Light가 기본 테마이고 Dark를 선택할 수 있다.
- 목록은 썸네일을 먼저 보여주고 클릭한 카드만 실제 CodePen 실행 화면으로 바꾼다. 실행 화면을 이미지나 영상으로 대체하지 않는다. 실행이 확인되지 않은 예제에는 `실행 미확인`을 표시한다.
- Home과 Explore는 다음 cursor 페이지를 스크롤 끝 전에 자동으로 가져온다. 전체 Explore와 카테고리 Explore 모두 `다음 결과 불러오기` 버튼이 없으며, 실패 때만 `다시 시도`가 나온다.
- Explore는 기본 3열이고 사용자가 2·3·4열로 바꿀 수 있다. TanStack Vue Virtual이 화면 주변의 카드 DOM만 유지하고 스크롤 중 슬롯 내용을 재사용한다. 카테고리는 좁은 화면에서 줄바꿈되어 잘리지 않는다.
- [Production](https://kwak-motion-lab-production.kwak-motion-lab.workers.dev/)은 Vue 앱과 Cloudflare Worker API로 제공한다. `master` push 후 CI 검증, Preview 배포·smoke, Production 배포·smoke 순서로 자동 배포한다. D1 migration과 Practice Kit seed는 자동 적용하지 않는다.

## Phase 1 · 실행형 라이브러리

[완료 기준](PHASE1_ACCEPTANCE.md)의 항목을 충족했고, WSSS 예약 수집과 수동 복구의 운영 증거까지 [마감 검증](evidence/PHASE1_CLOSEOUT_2026-10-21.md)에 기록했다. 기존 GSAP 목록 15건을 이전했고, 관리자 owner 인증, 후보 검수·공개 중지, 출처·중복·실행 검사, 사용량 경고와 백업·복구 절차를 구현했다.

WSSS GSAP은 GitHub Actions에서 예약 수집한다. 안전 조건을 통과한 GSAP/Loading 후보는 반복 승인 없이 자동 공개하고, 실패와 보류 이유를 기록한다. [2026-10-27 일괄 공개](evidence/BULK_PUBLICATION_2026-10-27.md)에서는 당시 대기 중이던 CodePen 후보 1,836건을 소유자 요청에 따라 별도로 게시했다. **이 1,836건은 실행 검증 완료로 취급하지 않는다.** 당시 공개 총수는 1,876건이었으며, 일괄 항목은 `runtime_verified=0`과 `실행 미확인` 표시를 유지한다. 새 후보에는 기존 자동 공개 게이트가 적용된다.

## Phase 2 · Practice

- HTML·CSS·JavaScript 편집, Run과 지연 자동 실행, 격리 Preview, Console·오류 안내, IndexedDB 초안 복원, 초기화 전 복구, 빈 코드 연습과 원본 Pen 참고, CodePen 내보내기 경로를 구현했다.
- 자체 제작 Practice Kit 10건을 Preview D1에 등록했다. 고정된 GSAP·ScrollTrigger 버전을 필요한 Kit에만 주입하며, Preview의 브라우저 검사와 Kit 중지·복구 리허설을 기록했다. [Preview Practice](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/practice)와 [10건 검증 증거](evidence/PHASE2_TEN_KITS_2026-10-29.md)에서 확인할 수 있다.
- **Phase 2 완료 또는 Kit의 Production 공개로 판정하지 않는다.** 2026-10-29 운영 확인 기준 Production에는 0014 스키마만 적용했고 Kit seed는 0건이다. Preview의 자동 검사와 에이전트 화면 검수는 [소유자 10건 일괄 검수](PHASE2_OWNER_REVIEW.md)를 대신하지 않는다.

## 남은 일

1. 소유자가 Preview Kit 10건의 움직임·화면·원본과의 표현 유사성·권리를 한 번에 검수하고 예외를 기록한다.
2. 모바일 확대, 브라우저 저장 용량 한계, 오래 실행되는 코드의 격리 한계를 확인한다. CodePen prefill은 payload와 실패 시 코드 복사 경로를 검사했지만, CodePen 측 403·확인 화면 때문에 **편집기의 실제 수신은 미확인**이다.
3. Phase 2 수용 기준과 Kit별 품질 게이트를 통과한 뒤 [운영 절차](PHASE2_OPERATIONS.md)에 따라 Production 백업, 승인된 Kit seed, 공개 API·브라우저 smoke와 중지·복구 증거를 남긴다.
4. 일괄 공개한 실행 미확인 Pen의 품질을 계속 점검하고 문제가 있는 항목은 관리자에서 중지한다. Hero 콘텐츠 목표 20건, 월간 Preview 재검사와 운영 지표 동기화도 확장 작업으로 남아 있다.

## 최근 검증과 참고 문서

- `a4b4d16`의 [GitHub Actions CI](https://github.com/hoseonkwak/animation-Ex/actions/runs/40985248889): 검증·Production 자동 배포 성공. Production 전체 Explore에서 Playwright 3건으로 버튼 제거, 8페이지 자동 로딩, 오류 재시도를 확인했다. 로컬에서는 관련 Playwright 7건과 format·typecheck·lint·build가 통과했다.
- [디자인 및 공개 화면 명세](PUBLIC_SCREEN_SPEC.md), [Phase 2 실행 계획](PHASE2_EXECUTION_PLAN.md), [Phase 2 운영 절차](PHASE2_OPERATIONS.md), [배포 증거](evidence/AUTO_DEPLOY_2026-10-29.md), [결정 기록](DECISIONS.md).
- 로컬 실행·검증 명령은 [README](../README.md#실행-방법), 장애·배포 절차는 [RUNBOOK](RUNBOOK.md)을 참고한다.
