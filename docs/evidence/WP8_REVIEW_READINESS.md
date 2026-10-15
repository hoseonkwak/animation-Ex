# WP8 관리자 검수 표본 준비

검증일: 2026-10-15
환경: Production Worker, Production D1, CodePen embed
범위: 운영 후보 6건의 접근 경계, 메타데이터와 실제 Preview 상태 확인

## 결론

- Production 관리자 API는 인증 없이 `401 ADMIN_AUTH_REQUIRED`를 반환하고, 등록된 owner의 GitHub OAuth 승인 후 Candidate Inbox를 정상 로드한다.
- 우선순위가 가장 높은 기존 관리자 튜토리얼 후보 1건은 CodePen에서 `404`가 확인됐다. 승인 대상에서 제외하고, 인증된 관리자 경로가 준비되면 `source-unavailable` 또는 거절로 처리해야 한다.
- WSSS GSAP 후보 5건은 CodePen Result iframe이 정상 로드됐고 최상위 브라우저 콘솔 오류가 없었다. 실제 애니메이션 화면도 눈으로 확인했다.
- 다섯 후보 모두 제목과 기술 태그만 채워져 있다. 요약, slug, 난이도, 상호작용 안내와 축별 태그를 보완한 뒤 Preview ValidationRun을 저장해야 승인할 수 있다.
- 이번 확인은 읽기 전용이다. Candidate 상태, 공개 Entry와 기존 승인 후보 15건은 변경하지 않았다.

## 접근 경계 확인

요청:

```text
GET /api/v1/admin/candidates?status=review&sort=oldest
```

Production 응답:

```text
401 ADMIN_AUTH_REQUIRED
```

`docs/DECISIONS.md`의 D-033에 따라 결제 등록이나 초과 사용 동의 없이 Cloudflare Access 활성화를 진행하지 않는다. 2026-10-15에 다시 확인한 [Cloudflare One 공식 시작 안내](https://developers.cloudflare.com/cloudflare-one/setup/)도 Zero Trust Free 플랜에 결제 정보 입력이 필요하다고 명시한다. D-035에서 무료 GitHub OAuth owner 인증으로 전환했고, Preview와 Production에 분리된 OAuth App과 Worker secret을 연결했다. 실제 owner 로그인과 Candidate Inbox 로딩까지 확인했다.

## 표본 결과

| Candidate                    | 원본                       | Preview                                 | 메타데이터 | 다음 판정           |
| ---------------------------- | -------------------------- | --------------------------------------- | ---------- | ------------------- |
| `candidate-admin-tutorial`   | GreenSock · `LYpgKPe`      | 실패 · CodePen 404                      | 완성       | 출처 이용 불가 처리 |
| `01M35VCBW7H1XSSHK65TWXD4V9` | Tom Miller · `mdrmZYY`     | 통과 · 궤도를 도는 기술 로고 애니메이션 | 미완성     | 보완 후 승인 검토   |
| `01M35VCC0BCWB3GJMJEVABN3Z0` | George Francis · `qBqLrGG` | 통과 · 생성형 원 애니메이션             | 미완성     | 보완 후 승인 검토   |
| `01M35VCC39EETQWW6P97VJ2PZ8` | Sicontis · `oNbgjda`       | 통과 · 도시 장면 시퀀스                 | 미완성     | 보완 후 승인 검토   |
| `01M35VCC6705BXM1RF510VY3TS` | Pete Barr · `JjPKrqg`      | 통과 · 카드 덱 전환                     | 미완성     | 보완 후 승인 검토   |
| `01M35VCC9BPM3E97BYQ58EXFF1` | Pete Barr · `dyyLEwB`      | 통과 · 분할 텍스트 입체 전환            | 미완성     | 보완 후 승인 검토   |

Preview 통과는 CodePen embed 문서 로드, Result 화면 렌더링과 최상위 브라우저 콘솔 오류 0건을 뜻한다. 최종 승인을 위한 ValidationRun은 아직 생성하지 않았다.

## 메타데이터 보완 초안

| Candidate                    | 공개 제목                   | 요약                                                                                          | 난이도       | 추가 태그 제안                                          |
| ---------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------- |
| `01M35VCBW7H1XSSHK65TWXD4V9` | 기술 로고 궤도 애니메이션   | 여러 기술 로고와 원형 요소가 중심을 기준으로 서로 다른 궤도를 순환하는 GSAP 애니메이션입니다. | intermediate | `motion:orbit`, `motion:loop`, `section:hero`           |
| `01M35VCC0BCWB3GJMJEVABN3Z0` | 생성형 원 모션              | 크기와 색상이 다른 원을 무작위로 배치하고 반복 이동시키는 생성형 GSAP 애니메이션입니다.       | beginner     | `motion:float`, `motion:loop`, `technique:generative`   |
| `01M35VCC39EETQWW6P97VJ2PZ8` | 도시 장면 시퀀스 애니메이션 | 도시와 캐릭터 요소를 순서대로 등장시키는 GSAP 타임라인 시퀀스 예제입니다.                     | intermediate | `motion:sequence`, `technique:timeline`                 |
| `01M35VCC6705BXM1RF510VY3TS` | 카드 덱 전환 애니메이션     | 카드 묶음이 열리고 전환되는 과정을 단계적으로 보여주는 GSAP 카드 모션입니다.                  | advanced     | `motion:sequence`, `section:card`, `trigger:auto`       |
| `01M35VCC9BPM3E97BYQ58EXFF1` | 분할 텍스트 입체 전환       | 여러 줄로 나눈 텍스트가 기울고 뒤집히며 입체적으로 전환되는 GSAP 타이포그래피 예제입니다.     | intermediate | `motion:reveal`, `section:text`, `technique:split-text` |

태그 키는 관리자 화면에서 실제 활성 Tag 목록과 대조해 확정한다. 존재하지 않는 키를 데이터베이스에 직접 추가하지 않는다.

## 남은 작업

1. 다른 GitHub 계정 차단을 원격에서 확인한다.
2. owner 관리자 화면에서 404 후보를 출처 이용 불가로 처리한다.
3. Preview 통과 5건의 메타데이터와 태그를 편집한다.
4. 각 후보의 Preview ValidationRun을 저장하고 승인한다.
5. 공개 Explore와 상세 화면에서 실제 CodePen Preview, 출처와 검색 노출을 재확인한다.
