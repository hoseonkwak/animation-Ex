# Example Validation

공개 CodePen 예제의 실행 가능 여부와 DB 검증 증거를 같은 기준으로 확인한다.

## 자체 실행 스냅샷 예외 (D-075·D-077)

- 2026-11-18 소유자의 자체 실행 전환 요청은 `docs/SELF_HOSTED_PILOT.md`를 따른다. 원본 파일 해시, 패키지 버전, 격리 정책, 실제 서비스 파일 경로에서의 실행과 데스크톱·모바일 원본 비교를 기록한다.
- 시각 비교용 로컬 PNG는 Git 무시 폴더에만 보관할 수 있다. 아래 절차 6번의 Phase 1 미디어 증거 금지와 구분하며, 공개 실행을 이미지·영상으로 대체하지 않는다.
- 비교 원본은 공식 `codepen.dev` 실제 실행 화면이다. Raw File 응답의 실행 제한·403·429·빈 화면은 비교 성공으로 기록하지 않는다.
- 런타임·시각 비교를 모두 통과한 정확한 버전만 공개 미리보기·상세에 연결한다. 움직임 시점 차이가 큰 항목은 `review-required`로 남긴다. 원본 자체의 의도적인 `overflow: hidden|clip`은 단순 scrollWidth 증가와 구분하되 원본 화면 비교도 통과해야 한다.
- 배포 목록 밖 파일, 공개 중지된 예제, 원본 불일치, 임의 경로와 권한 확장은 계약 검사로 차단한다.

## 적용 시점

- 기존 또는 신규 CodePen 예제를 `published`로 이전할 때
- Pen ID, creator, embed 옵션 또는 공개 상태가 바뀔 때
- `validation_runs`의 pass 증거를 새로 만들 때

## 절차

1. 입력 manifest와 원본 목록에서 creator와 Pen ID가 일치하는지 결정적 계약 검사로 확인한다.
2. canonical URL은 `https://codepen.io/{creator}/pen/{penId}`로 만든다.
3. embed URL은 검증된 creator와 Pen ID로 만들고 `theme-id=light`, `default-tab=result`를 사용한다.
4. 1440×900 Chromium에서 embed 문서와 실제 result iframe을 로드한다.
5. HTTP 오류, result iframe 누락 또는 Pen Not Found 문구가 있으면 fail로 기록한다.
6. 이미지, GIF 또는 녹화 영상을 증거로 저장하지 않는다.
7. creator, canonical URL, Pen ID, viewport, 검사 시각, validator 버전과 결과를 JSON 및 `validation_runs`에 기록한다.
8. 모든 필수 예제가 pass하기 전에는 `published` migration을 완료로 표시하지 않는다.

## 현재 명령

```bash
npm run test:legacy-previews --workspace @kwak-motion/lab
```

결과는 `docs/evidence/WP3_PREVIEW_VALIDATION.json`에 기록한다.
