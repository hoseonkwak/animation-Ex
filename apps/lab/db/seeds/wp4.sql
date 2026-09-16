INSERT OR IGNORE INTO sources (
  id, type, url, canonical_url, creator_name, license_code,
  license_evidence_url, license_checked_at, availability,
  first_seen_at, last_checked_at, created_at, updated_at
) VALUES (
  'src-admin-tutorial', 'codepen',
  'https://codepen.io/GreenSock/pen/LYpgKPe',
  'https://codepen.io/GreenSock/pen/LYpgKPe',
  'GreenSock', 'MIT', 'https://codepen.io/GreenSock/pen/LYpgKPe',
  '2026-09-16T00:00:00.000Z', 'available',
  '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z',
  '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'
);

INSERT OR IGNORE INTO candidates (
  id, source_id, status, source_title, source_category, metadata_json,
  deduplication_key, confidence, priority_score, version, created_at, updated_at
) VALUES (
  'candidate-admin-tutorial', 'src-admin-tutorial', 'review',
  'GSAP ScrollTrigger Tutorial', 'GSAP',
  '{"publicTitle":"GSAP ScrollTrigger 튜토리얼","summary":"스크롤 진행에 맞춰 요소를 제어하는 GSAP 공식 예제입니다.","slug":"gsap-scrolltrigger-tutorial","difficulty":"intermediate","featured":false,"interactionNote":"스크롤하여 요소의 진행 상태를 확인하세요."}',
  'codepen:GreenSock/LYpgKPe', 0.96, 90, 1,
  '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'
);

INSERT OR IGNORE INTO candidate_tags (candidate_id, tag_id, source, confidence, confirmed) VALUES
  ('candidate-admin-tutorial', 'tag-technology-gsap', 'imported', 1, 1),
  ('candidate-admin-tutorial', 'tag-trigger-scroll', 'inferred', 0.95, 1),
  ('candidate-admin-tutorial', 'tag-motion-reveal', 'inferred', 0.8, 0),
  ('candidate-admin-tutorial', 'tag-technique-timeline', 'inferred', 0.8, 0),
  ('candidate-admin-tutorial', 'tag-difficulty-intermediate', 'admin', 1, 1);
