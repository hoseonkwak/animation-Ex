# Example Validation

공개 CodePen 예제의 실행 가능 여부와 DB 검증 증거를 같은 기준으로 확인한다.

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
