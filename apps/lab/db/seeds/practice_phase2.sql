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
