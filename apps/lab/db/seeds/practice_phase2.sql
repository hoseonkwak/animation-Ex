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
