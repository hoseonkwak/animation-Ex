---
name: source-ingestion
description: WSSS 등 지정 출처에서 CodePen 후보를 수집하거나 parser, canonicalization, provenance, deduplication과 checkpoint를 변경할 때 적용한다.
---

# Source Ingestion

지정 출처를 CodePen 발견 경로로만 사용하고, 재실행 가능한 Candidate 입력과 실패 증거를 만든다.

## 필수 순서

1. `docs/WSSS_INGESTION_SPEC.md`와 현재 robots 정책을 확인한다.
2. 실제 요청 전에 `npm run test:ingestion`으로 최소 HTML fixture와 parser 계약을 통과시킨다.
3. 수집 URL은 허용한 출처 host의 카테고리 목록과 숫자 게시물 경로로 제한한다.
4. ZIP, 이미지, 첨부 파일과 CodePen 페이지 또는 코드는 요청하지 않는다.
5. 목록에서 게시물 URL을 찾고 상세에서 모든 CodePen 링크를 보존한다.
6. CodePen URL을 `https://codepen.io/{creator}/pen/{penId}`로 정규화하고 `creator/penId`를 중복 키로 사용한다.
7. WSSS 발견 URL과 canonical CodePen URL을 별도 provenance로 유지한다.
8. API 저장이 확인된 항목까지만 checkpoint를 전진한다.

## 중지 조건

- fixture 실패 상태에서는 실제 출처를 요청하지 않는다.
- robots 비허용, 403 또는 429는 즉시 중지하고 같은 실행에서 재시도하지 않는다.
- 5xx와 timeout은 5초, 20초 후 최대 두 번만 재시도한다.
- 구조 오류가 5개 또는 처리 항목의 10%를 넘으면 `ARTICLE_STRUCTURE_CHANGED`로 중지한다.
- 원인을 기록하지 않은 빈 성공을 만들지 않는다.

## 검증 명령

```bash
npm run test:ingestion --workspace @kwak-motion/lab
npm run ingest:wsss:fixture --workspace @kwak-motion/lab
```

실제 수동 실행은 fixture 검증 후 GitHub Actions의 `WSSS ingestion` workflow에서 수행한다.
