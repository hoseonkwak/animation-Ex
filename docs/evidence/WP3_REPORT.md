# WP3 기존 15개 이전 결과

기록일: 2026-09-16
작업 브랜치: `codex/phase1-foundation`
상태: 완료

## 구현 결과

- `pages/animation/gsap/list.html`의 연결 항목 15개를 순서대로 manifest에 고정했다.
- 제목은 기존 목록을 기준으로 유지하고 원본 CodePen 제목을 별도 필드에 보존했다.
- 각 항목에 한국어 요약, 난이도와 다축 태그를 검수해 추가했다.
- 15개를 Source, approved Candidate, published Entry와 활성 CodePenRef로 연결했다.
- 후보와 공개 Entry 양쪽에 동일한 검수 태그를 저장했다.
- 각 Candidate에 승인 이력, 각 Entry에 desktop pass ValidationRun을 기록했다.
- 제작자는 `hoseonkwak`, 라이선스는 `MIT`, 근거는 CodePen 공식 Licensing 문서로 통일했다.
- 공개 Pen과 충돌하던 기존 draft fixture는 가상 Pen 식별값으로 이동했다.

## Preview 검수

CodePen이 headless 요청을 403으로 차단해 최종 외부 검수는 가시 브라우저로 실행했다. 각 Pen에서 HTML, CSS, JS, Result 탭과 Rerun 제어를 확인하고 Result iframe 내부 HTML이 생성됐는지 검사했다.

| 결과 | 수량 |
|---|---:|
| pass | 15 |
| fail | 0 |
| canonical URL 중복 | 0 |
| Pen key 중복 | 0 |

항목별 결과와 실행된 Result HTML 길이는 [`WP3_PREVIEW_VALIDATION.json`](WP3_PREVIEW_VALIDATION.json)에 저장했다. 이미지, GIF와 녹화 영상은 증거로 사용하지 않았다.

## 제외 항목

- `detail.html`은 첫 번째 목록 항목 `LEVeYQO`와 같은 Pen이므로 별도 Entry를 만들지 않았다.
- `toturial-1.html`의 `GreenSock/LYpgKPe`는 공개 목록 15개 밖의 Tutorial Pen이므로 자동 공개하지 않았다.
- `gasp-text2 copy.html`은 CodePen embed가 없는 별도 마크업이므로 이전 대상에 포함하지 않았다.

## 검증 증거

| 검사 | 결과 |
|---|---|
| 빈 Node SQLite에 0001~0008 재구성 | 통과 |
| 기존 local D1에 0008 upgrade 적용 | 통과 |
| Source→Candidate→Entry→CodePenRef 연결 | 15개 통과 |
| 승인 이력과 pass ValidationRun | 각각 15개 |
| creator, MIT 근거와 canonical URL 누락 | 0개 |
| legacy import 및 API Vitest | 6 files, 19 tests 통과 |
| 가시 브라우저 CodePen 실행 검수 | 15개 통과 |

`0008_seed_legacy_examples.sql` SHA-256:

```text
3CB3BE6549738A73131E355583D954A01DC4700A53B2DE0CF35D43F6B44B0196
```

## 다음 단계

WP4에서 owner 한 명이 Candidate를 실제 Preview로 확인하고 metadata와 태그를 편집한 뒤 승인·반려·수정 요청을 남기는 관리자 검수 흐름을 구현한다.
