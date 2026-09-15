# Phase 1 구현 기준선

기록 시각: 2026-09-15
작업 브랜치: `codex/phase1-foundation`

## 구현 전 사용자 변경

다음 경로는 구현 시작 전에 이미 수정 또는 생성되어 있었다.

- `index.html`: 수정됨
- `.cursor/`: 추적되지 않음
- `.cursorrules`: 추적되지 않음
- `package.json`: 추적되지 않음

`package.json`은 기존 `chrome-devtools-mcp` script를 보존하면서 workspace 설정을 병합한다. 나머지 경로는 WP0에서 수정하지 않는다.

## 기준 hash

| 경로 | SHA-256 |
|---|---|
| `index.html` | `E2ECB02A215EF9B8C25C67840D43B62CFA14F4353B9D050E4EA56E8958BC31E4` |
| `package.json` | `990A27E925C7F9B65E76D048996933DC9F10B89357771112AB72EE1D0591BC83` |
| `css/style.css` | `AD615CABC1F04F7A95839BE796C64F8FBD56BDBD29B27302E524D9CCADBC98D1` |
| `js/main.js` | `2A40E923BE19B8D955B1EDDEA9D5CE9569146C761878737D80227E36C121AE1D` |

## 기존 콘텐츠 수

- `pages/animation/gsap/list.html`에서 연결한 예제: 15개
- 폴더 전체에서 확인한 고유 CodePen embed: 16개
- `detail.html`은 `basic-1.html`과 동일 Pen을 사용
- 목록 밖 Tutorial Pen은 Phase 1 Candidate로 별도 검수

이 문서는 기준선 증거이며 기존 콘텐츠를 삭제하거나 이전 완료로 표시하지 않는다.
