# WP0 기준선과 하네스 결과

기록일: 2026-09-15
작업 브랜치: `codex/phase1-foundation`
상태: 완료

## 구현 결과

- 기존 정적 사이트와 사용자 변경을 유지하고 `apps/lab`에 새 애플리케이션을 분리했다.
- Vue 3, Vue Router, TypeScript strict mode와 Cloudflare Vite plugin을 구성했다.
- Worker의 `GET /api/v1/health`와 구조화된 404 응답을 구현했다.
- Prettier, ESLint, Vitest, Playwright와 production build 명령을 만들었다.
- GitHub Actions에 Node 24 기반 `npm ci → typecheck → lint → test → build` 게이트를 추가했다.
- 루트 `package.json`의 기존 `chrome-devtools-mcp` script를 보존하고 npm workspace로 확장했다.

## 고정 실행 환경

| 항목 | 값 |
|---|---|
| Node | 24.19.0 (`.nvmrc`), 최소 24.12.0 |
| npm | 10.8.2 |
| Vue | 3.5.42 |
| Vite | 8.3.0 |
| Cloudflare Vite plugin | 1.54.9 |
| Wrangler | 4.131.2 |
| TypeScript | 6.0.3 |
| Vitest | 5.0.0 |
| Playwright | 1.63.0 |

정확한 전체 버전과 무결성은 `package-lock.json`에 고정했다.

## 검증 증거

| 검사 | 결과 |
|---|---|
| `npm run format:check` | 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm run test` | 2 files, 2 tests 통과 |
| `npm run test:contracts` | 명령 동작 확인, WP1 fixture 대기 |
| `npm run test:ingestion` | 명령 동작 확인, WP5 fixture 대기 |
| `npm run test:e2e` | 실제 Chrome에서 Vue 화면과 Worker API 2 tests 통과 |
| `npm run build` | Worker와 client production build 통과 |

Production client 출력은 JavaScript 83.90 kB, gzip 32.75 kB이며 Worker 출력은 0.90 kB, gzip 0.57 kB였다.

## 기존 파일 보존 확인

`docs/evidence/PHASE1_BASELINE.md`와 다시 비교한 결과는 다음과 같다.

| 경로 | 기준 SHA-256 | 결과 |
|---|---|---|
| `index.html` | `E2ECB02A215EF9B8C25C67840D43B62CFA14F4353B9D050E4EA56E8958BC31E4` | 동일 |
| `css/style.css` | `AD615CABC1F04F7A95839BE796C64F8FBD56BDBD29B27302E524D9CCADBC98D1` | 동일 |
| `js/main.js` | `2A40E923BE19B8D955B1EDDEA9D5CE9569146C761878737D80227E36C121AE1D` | 동일 |

구현 전에 존재한 `.cursor/`, `.cursorrules`와 `index.html`의 사용자 변경은 수정하지 않았다. 구현 전 추적되지 않았던 `package.json`만 기존 script를 유지한 채 workspace 설정과 검증 명령을 추가했다.

## 환경 메모

현재 Codex 샌드박스는 사용자 홈의 Wrangler 설정 경로를 쓸 수 없으므로 로컬 검증에서 `XDG_CONFIG_HOME`을 저장소의 무시된 `.wrangler/config`로 지정했다. 일반 개발 환경과 CI에서는 기본 사용자 설정 경로를 사용한다.

Playwright는 설치된 Chrome을 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`로 지정해 검증했다. 다른 환경에서는 Playwright Chromium을 설치하거나 같은 환경 변수를 사용할 수 있다.

## 다음 단계

WP1에서 D1 migration과 seed를 만들고, 공개 상태 필터가 적용된 examples API를 Vue 카드 3개까지 수직으로 연결한다.
