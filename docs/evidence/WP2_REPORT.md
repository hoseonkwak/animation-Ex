# WP2 Explore와 Preview Card 결과

기록일: 2026-09-16
작업 브랜치: `codex/phase1-foundation`
상태: 완료

## 구현 결과

- 검색어가 제목, 설명과 태그의 한국어·영어 이름을 조회한다.
- Technology, Trigger, Motion, Section, Technique, Difficulty 축을 함께 필터링한다.
- 같은 축의 선택은 OR, 서로 다른 축은 AND로 처리한다.
- 최신순, 추천순, 난이도순을 안정적인 keyset cursor로 페이지 이동한다.
- 검색, 필터와 정렬 상태를 URL query에 저장하고 새로고침과 뒤로가기에서 복원한다.
- 결과 없음, API 오류와 추가 결과 로딩 상태를 각각 제공한다.
- IntersectionObserver가 접근한 카드만 실행 후보로 등록하고 화면 밖 iframe을 제거한다.
- Preview scheduler가 동시 iframe을 2개로 제한하고 사용자가 누른 실행 요청을 우선한다.
- 카드별 idle, loading, running, paused, error 상태와 CodePen 새 창 링크를 제공한다.
- 1440, 1024, 768, 320px에서 각각 4, 3, 2, 1열로 배치한다.

## 검증 증거

| 검사 | 결과 |
|---|---|
| TypeScript | 통과 |
| ESLint | 통과 |
| Production build | 통과 |
| Vitest 단위·API 계약 | 5 files, 14 tests 통과 |
| Playwright Chromium | 6건 통과 |
| 같은 축 OR, 다른 축 AND | 계약 검사 통과 |
| cursor 다음 페이지 중복 | 0개 |
| 동시 실행 Preview | 최대 2개 |
| Preview 오류 격리 | component 검사 통과 |
| URL 새로고침·뒤로가기·스크롤 복원 | 브라우저 검사 통과 |
| 반응형 1440·1024·768·320px | 4·3·2·1열 통과 |

Playwright용 Chromium v1243을 로컬 테스트 런타임에 설치했다. 공개 Preview는 이미지나 녹화 영상 대신 CodePen iframe의 실제 코드를 실행한다.

## 다음 단계

WP3에서 기존 GSAP 목록 15개를 Source, Entry, CodePenRef와 태그 seed로 이전한다. canonical URL 중복을 제거하고 15개 Preview를 직접 실행해 ValidationRun 근거를 남긴다.
