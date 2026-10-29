-- 자체 작성한 첫 Practice Kit. 원본 CodePen 코드나 에셋은 포함하지 않는다.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-card-hover-v1', 'entry-card-1', 1,
  '<main class="kit-stage"><button class="kit-card" type="button"><span class="kit-card__eyebrow">INTERACTION 01</span><strong>움직이는 카드</strong><span>마우스를 움직이거나 Tab으로 선택해보세요.</span></button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#eef1fa;color:#222b4b}.kit-stage{min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}.kit-card{width:min(100%,340px);min-height:220px;padding:30px;border:1px solid #d8dff1;border-radius:24px;background:linear-gradient(145deg,#fff,#e9edff);box-shadow:0 20px 50px #33428422;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;text-align:left;color:inherit;transform:perspective(700px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .2s,box-shadow .2s;cursor:pointer}.kit-card:hover,.kit-card:focus-visible{box-shadow:0 30px 60px #33428444}.kit-card:focus-visible{outline:3px solid #6658cf;outline-offset:4px}.kit-card__eyebrow{font-size:12px;letter-spacing:.18em;color:#6658cf}.kit-card strong{font-size:32px}.kit-card span:last-child{font-size:14px;line-height:1.5}@media(prefers-reduced-motion:reduce){.kit-card{transition:none}}',
  'const card=document.querySelector(".kit-card");card.addEventListener("pointermove",(event)=>{const box=card.getBoundingClientRect();const x=(event.clientX-box.left)/box.width-.5;const y=(event.clientY-box.top)/box.height-.5;card.style.setProperty("--rx",`${(-y*12).toFixed(1)}deg`);card.style.setProperty("--ry",`${(x*12).toFixed(1)}deg`)});card.addEventListener("pointerleave",()=>{card.style.removeProperty("--rx");card.style.removeProperty("--ry")});',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '카드 위에서 포인터를 움직이거나 Tab으로 카드를 선택하세요.',
  '{"sandbox":"allow-scripts","network":"blocked"}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-27T07:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-card-hover', 'entry-card-1', 'practice-card-hover-v1', 'free', 'ready',
  '2026-10-27T07:00:00.000Z', '2026-10-27T07:00:00.000Z'
);

-- GSAP 기초 트윈을 학습할 수 있는 자체 제작 시작 코드. 원본 Pen 코드는 사용하지 않는다.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-basic-tween-v1', 'entry-basic-1', 1,
  '<main class="kit-stage"><div class="kit-track"><div class="kit-box" aria-label="움직이는 상자">✳</div></div><button class="kit-replay" type="button">다시 실행</button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#f4f2ff;color:#29245a}.kit-stage{min-height:100vh;display:grid;place-content:center;gap:32px;padding:24px;box-sizing:border-box}.kit-track{width:min(72vw,300px);height:100px;display:flex;align-items:center;border-bottom:2px solid #cec8fa}.kit-box{width:68px;height:68px;display:grid;place-items:center;border-radius:18px;background:#7364e5;color:white;font-size:36px;box-shadow:0 14px 28px #7364e544}.kit-replay{width:max-content;margin:auto;padding:12px 20px;border:0;border-radius:12px;background:#29245a;color:white;font:inherit;cursor:pointer}.kit-replay:focus-visible{outline:3px solid #7364e5;outline-offset:3px}',
  'const box=document.querySelector(".kit-box");const replay=document.querySelector(".kit-replay");const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function animate(){gsap.set(box,{x:0,rotation:0});if(reduced){gsap.set(box,{x:180,rotation:360});return}gsap.to(box,{x:180,rotation:360,duration:1.2,ease:"power2.out"})}replay.addEventListener("click",animate);animate();',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '상자의 이동과 회전을 본 뒤 다시 실행 버튼을 누르세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T00:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-basic-tween', 'entry-basic-1', 'practice-basic-tween-v1', 'free', 'ready',
  '2026-10-29T00:00:00.000Z', '2026-10-29T00:00:00.000Z'
);

-- 위치와 크기 변형을 함께 연습하는 자체 제작 Kit.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-basic-transform-v1', 'entry-legacy-02', 1,
  '<main class="transform-stage"><div class="transform-demo"><span class="transform-origin" aria-hidden="true">시작</span><div class="transform-shape" aria-label="크기와 위치가 바뀌는 원"></div><span class="transform-target" aria-hidden="true">도착</span></div><button class="transform-replay" type="button">다시 실행</button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#f2f8f7;color:#173c3a}.transform-stage{min-height:100vh;display:grid;place-content:center;justify-items:center;gap:30px;padding:24px;box-sizing:border-box}.transform-demo{position:relative;width:min(72vw,340px);height:270px;border:1px solid #c9e0db;border-radius:24px;background:linear-gradient(145deg,#fff,#e4f4ef)}.transform-origin,.transform-target{position:absolute;font-size:12px;color:#4d7770}.transform-origin{left:34px;top:18px}.transform-target{right:34px;bottom:18px}.transform-shape{position:absolute;left:34px;top:52px;width:72px;height:72px;border-radius:50%;background:#1c9e8f;box-shadow:0 16px 30px #1c9e8f44}.transform-replay{padding:12px 20px;border:0;border-radius:12px;background:#173c3a;color:#fff;font:inherit;cursor:pointer}.transform-replay:focus-visible{outline:3px solid #1c9e8f;outline-offset:3px}',
  'const shape=document.querySelector(".transform-shape");const demo=document.querySelector(".transform-demo");const replay=document.querySelector(".transform-replay");const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;function animate(){const target={x:Math.max(70,demo.clientWidth-130),y:125,scale:1.45};gsap.killTweensOf(shape);gsap.set(shape,{x:0,y:0,scale:1});if(reduced){gsap.set(shape,target);return}gsap.to(shape,{...target,duration:1.1,ease:"power2.inOut"})}replay.addEventListener("click",animate);animate();',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '원의 위치와 크기가 함께 변하는 모습을 보고 다시 실행해보세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T01:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-basic-transform', 'entry-legacy-02', 'practice-basic-transform-v1', 'free', 'ready',
  '2026-10-29T01:00:00.000Z', '2026-10-29T01:00:00.000Z'
);

-- 캡처 검수에서 도착 라벨과 원이 겹쳐 v1을 보존하고 새 버전으로 교체한다.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
)
SELECT 'practice-basic-transform-v2', animation_entry_id, 2, html,
  replace(css, '.transform-target{right:34px;bottom:18px}', '.transform-target{right:34px;top:18px}'),
  javascript, external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, '2026-10-29T03:00:00.000Z'
FROM code_package_versions WHERE id = 'practice-basic-transform-v1';

UPDATE practice_kits
SET starter_code_package_version_id = 'practice-basic-transform-v2',
    updated_at = '2026-10-29T03:00:00.000Z'
WHERE id = 'practice-basic-transform'
  AND starter_code_package_version_id != 'practice-basic-transform-v2';

-- from, fromTo, timeline의 순차 실행을 비교해 연습하는 자체 제작 Kit.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-from-fromto-timeline-v1', 'entry-legacy-03', 1,
  '<main class="timeline-stage"><div class="timeline-list"><div class="timeline-step step-one">01 <strong>from</strong></div><div class="timeline-step step-two">02 <strong>fromTo</strong></div><div class="timeline-step step-three">03 <strong>timeline</strong></div></div><button class="timeline-replay" type="button">순서 다시 보기</button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#f7f5ff;color:#27214d}.timeline-stage{min-height:100vh;display:grid;place-content:center;justify-items:center;gap:28px;padding:24px;box-sizing:border-box}.timeline-list{display:grid;gap:12px;width:min(75vw,320px)}.timeline-step{display:flex;align-items:center;gap:18px;min-height:64px;padding:0 20px;border-radius:16px;background:#fff;border:1px solid #ddd6ff;box-shadow:0 10px 24px #453c8b18;font-size:13px;color:#746c95}.timeline-step strong{font-size:20px;color:#34276d}.step-one{border-left:5px solid #765ce8}.step-two{border-left:5px solid #31a6a1}.step-three{border-left:5px solid #e99b55}.timeline-replay{padding:12px 20px;border:0;border-radius:12px;background:#34276d;color:#fff;font:inherit;cursor:pointer}.timeline-replay:focus-visible{outline:3px solid #765ce8;outline-offset:3px}',
  'const steps=Array.from(document.querySelectorAll(".timeline-step"));const replay=document.querySelector(".timeline-replay");const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;let sequence;function animate(){if(sequence)sequence.kill();gsap.set(steps,{opacity:1,x:0});if(reduced)return;sequence=gsap.timeline();sequence.from(steps[0],{opacity:0,x:-60,duration:.45});sequence.fromTo(steps[1],{opacity:0,x:60},{opacity:1,x:0,duration:.45});sequence.from(steps[2],{opacity:0,x:-60,duration:.45})}replay.addEventListener("click",animate);animate();',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '세 단계가 차례로 나타나는 모습을 보고 from, fromTo와 timeline 코드를 비교하세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T01:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-from-fromto-timeline', 'entry-legacy-03', 'practice-from-fromto-timeline-v1', 'free', 'ready',
  '2026-10-29T01:00:00.000Z', '2026-10-29T01:00:00.000Z'
);

-- 포인터 좌표에 반응하는 독립 제작 마우스 인터랙션 Kit.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-mouse-interaction-v1', 'entry-legacy-05', 1,
  '<main class="pointer-stage"><div class="pointer-field"><div class="pointer-orb" aria-label="포인터를 따라 움직이는 원"></div><p>이 안에서 포인터를 움직여보세요</p></div><button class="pointer-reset" type="button">중앙으로</button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#eaf6fb;color:#163d55}.pointer-stage{min-height:100vh;display:grid;place-content:center;justify-items:center;gap:24px;padding:24px;box-sizing:border-box}.pointer-field{position:relative;width:min(78vw,420px);height:290px;overflow:hidden;border:1px solid #b8dfea;border-radius:28px;background:radial-gradient(circle at center,#fff,#d7f0f5);touch-action:none}.pointer-orb{position:absolute;left:calc(50% - 42px);top:calc(50% - 42px);width:84px;height:84px;border-radius:50%;background:linear-gradient(145deg,#34cbb8,#138ea4);box-shadow:0 20px 35px #138ea455}.pointer-field p{position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:13px;color:#477083;pointer-events:none}.pointer-reset{padding:12px 20px;border:0;border-radius:12px;background:#163d55;color:#fff;font:inherit;cursor:pointer}.pointer-reset:focus-visible{outline:3px solid #34cbb8;outline-offset:3px}',
  'const field=document.querySelector(".pointer-field");const orb=document.querySelector(".pointer-orb");const reset=document.querySelector(".pointer-reset");const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;function move(x,y,scale){const target={x,y,scale};if(reduced){gsap.set(orb,target)}else{gsap.to(orb,{...target,duration:.28,ease:"power2.out",overwrite:true})}}field.addEventListener("pointermove",(event)=>{const box=field.getBoundingClientRect();const limitX=(box.width-84)/2;const limitY=(box.height-84)/2;const x=Math.max(-limitX,Math.min(limitX,event.clientX-box.left-box.width/2));const y=Math.max(-limitY,Math.min(limitY,event.clientY-box.top-box.height/2));move(x,y,1.18)});field.addEventListener("pointerleave",()=>move(0,0,1));reset.addEventListener("click",()=>move(0,0,1));',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '영역 안에서 포인터를 움직여 원을 따라오게 하고 중앙으로 버튼을 누르세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T02:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-mouse-interaction', 'entry-legacy-05', 'practice-mouse-interaction-v1', 'free', 'ready',
  '2026-10-29T02:00:00.000Z', '2026-10-29T02:00:00.000Z'
);

-- 세 요소의 시작 시점을 바꾸는 동적 타임라인 Kit.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-dynamic-timeline-v1', 'entry-legacy-06', 1,
  '<main class="rhythm-stage"><div class="rhythm-board"><div class="rhythm-row"><span>첫 번째</span><div class="rhythm-bar bar-one"></div></div><div class="rhythm-row"><span>두 번째</span><div class="rhythm-bar bar-two"></div></div><div class="rhythm-row"><span>세 번째</span><div class="rhythm-bar bar-three"></div></div></div><button class="rhythm-replay" type="button">다시 재생</button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#f5f4fb;color:#302d55}.rhythm-stage{min-height:100vh;display:grid;place-content:center;justify-items:center;gap:28px;padding:24px;box-sizing:border-box}.rhythm-board{display:grid;gap:24px;width:min(76vw,380px);padding:30px;border:1px solid #dedaf0;border-radius:24px;background:#fff;box-shadow:0 20px 45px #40377512}.rhythm-row{display:grid;gap:8px}.rhythm-row span{font-size:13px}.rhythm-bar{height:20px;border-radius:20px;transform-origin:left center}.bar-one{width:72%;background:#766ce8}.bar-two{width:90%;background:#4da9c7}.bar-three{width:58%;background:#e5a26b}.rhythm-replay{padding:12px 20px;border:0;border-radius:12px;background:#302d55;color:#fff;font:inherit;cursor:pointer}.rhythm-replay:focus-visible{outline:3px solid #766ce8;outline-offset:3px}',
  'const bars=Array.from(document.querySelectorAll(".rhythm-bar"));const replay=document.querySelector(".rhythm-replay");const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;let sequence;function play(){if(sequence)sequence.kill();gsap.set(bars,{scaleX:0,transformOrigin:"left center"});if(reduced){gsap.set(bars,{scaleX:1});return}sequence=gsap.timeline();bars.forEach((bar,index)=>sequence.to(bar,{scaleX:1,duration:.6,ease:"power2.out"},index*.35))}replay.addEventListener("click",play);play();',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '세 막대의 시작 간격을 보고 timeline의 위치 매개변수를 바꿔보세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T02:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-dynamic-timeline', 'entry-legacy-06', 'practice-dynamic-timeline-v1', 'free', 'ready',
  '2026-10-29T02:00:00.000Z', '2026-10-29T02:00:00.000Z'
);

-- 한글 문구의 단어별 등장 순서를 연습하는 자체 제작 Kit.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-text-reveal-v1', 'entry-legacy-12', 1,
  '<main class="reveal-stage"><p class="reveal-kicker">TEXT REVEAL</p><h1 aria-label="움직임은 작은 차이에서 시작됩니다"><span aria-hidden="true">움직임은</span> <span aria-hidden="true">작은</span> <span aria-hidden="true">차이에서</span> <span aria-hidden="true">시작됩니다</span></h1><button class="reveal-replay" type="button">다시 보기</button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#f7f7ef;color:#2e3729}.reveal-stage{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:24px;padding:clamp(24px,8vw,100px);box-sizing:border-box}.reveal-kicker{margin:0;color:#758346;font-size:12px;font-weight:700;letter-spacing:.2em}.reveal-stage h1{max-width:700px;margin:0;font-size:clamp(32px,6vw,68px);line-height:1.2;letter-spacing:-.05em}.reveal-stage h1 span{display:inline-block}.reveal-replay{padding:12px 20px;border:0;border-radius:12px;background:#2e3729;color:#fff;font:inherit;cursor:pointer}.reveal-replay:focus-visible{outline:3px solid #758346;outline-offset:3px}',
  'const words=Array.from(document.querySelectorAll(".reveal-stage h1 span"));const replay=document.querySelector(".reveal-replay");const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;function play(){gsap.killTweensOf(words);if(reduced){gsap.set(words,{opacity:1,y:0});return}gsap.fromTo(words,{opacity:0,y:28},{opacity:1,y:0,duration:.65,stagger:.15,ease:"power2.out"})}replay.addEventListener("click",play);play();',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '문장이 단어별로 나타나는 모습을 보고 stagger 값을 바꿔보세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T02:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-text-reveal', 'entry-legacy-12', 'practice-text-reveal-v1', 'free', 'ready',
  '2026-10-29T02:00:00.000Z', '2026-10-29T02:00:00.000Z'
);

-- 배경색을 순환시키는 자체 제작 컬러 애니메이션 Kit.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-rainbow-background-v1', 'entry-legacy-14', 1,
  '<main class="color-stage"><div class="color-panel" aria-label="색상이 바뀌는 배경"><span>COLOR FLOW</span><h1>색이 흐르는 순간</h1></div><button class="color-toggle" type="button">색상 멈추기</button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#f5f5f5;color:#232936}.color-stage{min-height:100vh;display:grid;place-content:center;justify-items:center;gap:24px;padding:24px;box-sizing:border-box}.color-panel{display:flex;flex-direction:column;justify-content:center;gap:14px;width:min(78vw,440px);min-height:250px;padding:30px;box-sizing:border-box;border-radius:28px;background:#8f7de8;color:#fff;box-shadow:0 22px 45px #33365222}.color-panel span{font-size:12px;font-weight:700;letter-spacing:.2em}.color-panel h1{margin:0;font-size:clamp(28px,5vw,46px);line-height:1.2}.color-toggle{padding:12px 20px;border:0;border-radius:12px;background:#232936;color:#fff;font:inherit;cursor:pointer}.color-toggle:focus-visible{outline:3px solid #8f7de8;outline-offset:3px}.color-toggle:disabled{opacity:.6;cursor:default}',
  'const panel=document.querySelector(".color-panel");const toggle=document.querySelector(".color-toggle");const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduced){gsap.set(panel,{backgroundColor:"#277a84"});toggle.textContent="움직임 줄이기 적용";toggle.disabled=true}else{const colors=["#277a84","#b06cbb","#dd7f60","#8f7de8"];const flow=gsap.timeline({repeat:-1});colors.forEach((color)=>flow.to(panel,{backgroundColor:color,duration:1.1,ease:"none"}));toggle.addEventListener("click",()=>{flow.paused(!flow.paused());toggle.textContent=flow.paused()?"색상 이어보기":"색상 멈추기"})}',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '배경의 색상 변화를 보고 멈추기와 이어보기를 눌러보세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T02:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-rainbow-background', 'entry-legacy-14', 'practice-rainbow-background-v1', 'free', 'ready',
  '2026-10-29T02:00:00.000Z', '2026-10-29T02:00:00.000Z'
);

-- 텍스트와 직접 작성한 SVG 경로를 함께 그리는 Kit.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-text-drawing-v1', 'entry-legacy-13', 1,
  '<main class="draw-stage"><div class="draw-art"><svg viewBox="0 0 320 160" role="img" aria-label="새로 그린 곡선"><path class="draw-line" d="M20 118 C85 12 145 150 205 54 S275 26 300 108" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg><h1 class="draw-title">선을 따라, 생각을 잇다</h1></div><button class="draw-replay" type="button">다시 그리기</button></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#fff7ef;color:#533d32}.draw-stage{min-height:100vh;display:grid;place-content:center;justify-items:center;gap:30px;padding:24px;box-sizing:border-box}.draw-art{display:grid;justify-items:center;gap:18px;width:min(80vw,440px);padding:34px 22px;border-radius:28px;background:#fff;border:1px solid #f0dbc7;box-shadow:0 20px 50px #8d5c3718;box-sizing:border-box}.draw-art svg{width:min(100%,320px);color:#e08759}.draw-title{margin:0;text-align:center;font-size:clamp(22px,4vw,34px);line-height:1.3}.draw-replay{padding:12px 20px;border:0;border-radius:12px;background:#533d32;color:#fff;font:inherit;cursor:pointer}.draw-replay:focus-visible{outline:3px solid #e08759;outline-offset:3px}',
  'const line=document.querySelector(".draw-line");const title=document.querySelector(".draw-title");const replay=document.querySelector(".draw-replay");const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const length=line.getTotalLength();let sequence;function draw(){if(sequence)sequence.kill();gsap.set(line,{strokeDasharray:length,strokeDashoffset:length});gsap.set(title,{opacity:0,y:20});if(reduced){gsap.set(line,{strokeDashoffset:0});gsap.set(title,{opacity:1,y:0});return}sequence=gsap.timeline();sequence.to(line,{strokeDashoffset:0,duration:1.3,ease:"power2.inOut"}).to(title,{opacity:1,y:0,duration:.5},"-=.2")}replay.addEventListener("click",draw);draw();',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '직접 만든 SVG 선이 그려진 다음 텍스트가 나타납니다. 다시 그리기를 눌러보세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T02:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-text-drawing', 'entry-legacy-13', 'practice-text-drawing-v1', 'free', 'ready',
  '2026-10-29T02:00:00.000Z', '2026-10-29T02:00:00.000Z'
);

-- ScrollTrigger가 뷰포트 진입을 감지하는 자체 제작 스크롤 Kit.
INSERT OR IGNORE INTO code_package_versions (
  id, animation_entry_id, version, html, css, javascript,
  external_scripts_json, external_styles_json, assets_json,
  viewport_json, interaction_instructions, runtime_policy_json,
  provenance_json, license_code, created_by, created_at
) VALUES (
  'practice-scrolltrigger-v1', 'entry-legacy-04', 1,
  '<main class="scroll-stage"><section class="scroll-intro"><span>SCROLL STUDY</span><h1>아래로 스크롤하세요</h1><p>다음 영역에 들어오면 카드가 나타납니다.</p></section><section class="scroll-panel"><div class="scroll-card"><span>01 / REVEAL</span><h2>움직임이 시작되는 지점</h2><p>ScrollTrigger의 start 값을 바꿔보세요.</p></div></section><div class="scroll-tail" aria-hidden="true"></div></main>',
  'body{margin:0;font-family:system-ui,sans-serif;background:#f0f6fb;color:#183c56}.scroll-stage{min-height:100vh}.scroll-intro{min-height:90vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:14px;padding:28px;text-align:center;box-sizing:border-box}.scroll-intro span,.scroll-card span{font-size:12px;font-weight:700;letter-spacing:.2em;color:#487d9c}.scroll-intro h1{margin:0;font-size:clamp(30px,6vw,64px)}.scroll-intro p{margin:0;line-height:1.5}.scroll-panel{min-height:90vh;display:grid;place-items:center;padding:30px;box-sizing:border-box;background:#dcebf3}.scroll-card{width:min(100%,420px);padding:clamp(24px,5vw,48px);border-radius:26px;background:#fff;box-shadow:0 25px 55px #24476225;box-sizing:border-box}.scroll-card h2{font-size:clamp(25px,4vw,36px);line-height:1.2}.scroll-card p{line-height:1.5}.scroll-tail{height:35vh}',
  'gsap.registerPlugin(ScrollTrigger);const card=document.querySelector(".scroll-card");const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduced){gsap.set(card,{autoAlpha:1,y:0})}else{gsap.fromTo(card,{autoAlpha:0,y:80},{autoAlpha:1,y:0,duration:.9,ease:"power2.out",scrollTrigger:{trigger:card,start:"top 85%",toggleActions:"play none none reverse"}})}',
  '[]', '[]', '[]',
  '{"width":1280,"height":800}',
  '실행 화면 안에서 아래로 스크롤해 카드가 나타나는 지점을 확인하세요.',
  '{"sandbox":"allow-scripts","network":"blocked","libraries":["gsap@3.15.0","gsap-scrolltrigger@3.15.0"]}',
  '{"basis":"independent-reimplementation","author":"Kwak Motion Lab","sourceCodeCopied":false,"externalAssets":false}',
  'MIT', 'agent', '2026-10-29T02:00:00.000Z'
);

INSERT OR IGNORE INTO practice_kits (
  id, animation_entry_id, starter_code_package_version_id, mode, status, created_at, updated_at
) VALUES (
  'practice-scrolltrigger', 'entry-legacy-04', 'practice-scrolltrigger-v1', 'free', 'ready',
  '2026-10-29T02:00:00.000Z', '2026-10-29T02:00:00.000Z'
);
