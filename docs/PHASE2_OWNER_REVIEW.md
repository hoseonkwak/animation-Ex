# Phase 2 Practice Kit 일괄 검수

상태: 에이전트의 10건 화면·메타데이터 검수 완료, 소유자 판단 대기. 이 문서의 10건은 Preview에서 실행되며 Production에는 아직 입력하지 않았다. 직접 검수 결과와 한계는 [증거 문서](evidence/PHASE2_TEN_KITS_2026-10-29.md#에이전트-화면-검수)에 기록했다.

## 확인할 화면

[Practice Kit 목록](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/practice)에서 썸네일을 보고 각 예제의 **시작 코드로 연습하기**를 누른다. 데스크톱과 휴대전화 크기에서 실행 화면이 잘리지 않는지, 버튼과 스크롤 동작이 의도대로 보이는지 확인한다. 개별 승인 버튼은 없다. 문제를 발견한 Kit만 아래 예외란에 적고 나머지를 한 번에 승인할 수 있다.

| 예제 | 눈으로 확인할 동작 |
| --- | --- |
| [움직이는 카드](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/interactive-card-hover) | 포인터 이동과 키보드 포커스에서 카드 반응 |
| [기초 트윈](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-basic-tween) | 상자 이동·회전과 다시 실행 |
| [크기와 위치](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-basic-transform) | 원 확대·이동, 라벨 겹침 없음 |
| [순차 등장](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-from-fromto-timeline) | 세 단계가 순서대로 나타남 |
| [포인터 상호작용](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-mouse-interaction) | 원이 포인터를 따라가고 중앙으로 복귀 |
| [동적 타임라인](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-dynamic-timeline) | 세 막대가 차례로 채워짐 |
| [텍스트 리빌](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-text-reveal) | 한국어 단어가 차례로 등장 |
| [색상 배경](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-rainbow-background) | 배경색 변화·멈추기·이어보기 |
| [SVG 선 그리기](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-text-drawing) | 자체 SVG 선과 문구 등장 |
| [ScrollTrigger](https://kwak-motion-lab-preview.kwak-motion-lab.workers.dev/examples/gsap-scrolltrigger) | 실행 화면 **안쪽**을 스크롤하면 카드 등장 |

## 권리 확인 근거

10건의 HTML·CSS·JavaScript·문구·SVG는 자체 제작했다. Seed에는 `independent-reimplementation`, `sourceCodeCopied=false`, `externalAssets=false`, 제작자 `Kwak Motion Lab`, 라이선스 `MIT`가 기록돼 있다. 원본 Pen은 참고 링크로만 별도 표시한다. 이 기록은 코드 출처의 기계적 증거이며, 화면이 원본의 독창적 표현과 지나치게 닮았는지는 소유자가 최종 확인한다. 자세한 구현·검사 결과는 [10개 Kit 증거](evidence/PHASE2_TEN_KITS_2026-10-29.md)에 있다.

## 한 번에 남길 결과

- 검수 일시·브라우저·화면 크기:
- 10건 일괄 판단: 승인 / 아래 예외를 제외하고 승인 / 수정 후 다시 확인
- 예외 Kit과 수정 요청:
- CodePen 실제 수신 확인: 완료 / 미확인 (절차는 [운영 문서](PHASE2_OPERATIONS.md#codepen-실제-수신-확인))

소유자의 판단을 이 문서나 `docs/evidence/`에 기록한 뒤 `QUALITY_GATES.md`의 Practice Gate와 Production 배포 점검을 진행한다. CodePen 확인 화면이 나타나면 사람이 직접 통과해야 하며, 자동 검사만으로 수신 성공이라 기록하지 않는다.
