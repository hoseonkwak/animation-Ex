INSERT OR IGNORE INTO sources (
  id, type, url, canonical_url, creator_name, license_code,
  license_evidence_url, license_checked_at, availability,
  first_seen_at, last_checked_at, created_at, updated_at
) VALUES
  ('src-basic-1', 'codepen', 'https://codepen.io/hoseonkwak/pen/LEVeYQO', 'https://codepen.io/hoseonkwak/pen/LEVeYQO', 'hoseonkwak', 'MIT', 'https://blog.codepen.io/legal/terms-of-service/', '2026-09-16T00:00:00.000Z', 'available', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('src-card-1', 'codepen', 'https://codepen.io/hoseonkwak/pen/qEdyyJG', 'https://codepen.io/hoseonkwak/pen/qEdyyJG', 'hoseonkwak', 'MIT', 'https://blog.codepen.io/legal/terms-of-service/', '2026-09-16T00:00:00.000Z', 'available', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('src-scroll-1', 'codepen', 'https://codepen.io/hoseonkwak/pen/vEOQNmz', 'https://codepen.io/hoseonkwak/pen/vEOQNmz', 'hoseonkwak', 'MIT', 'https://blog.codepen.io/legal/terms-of-service/', '2026-09-16T00:00:00.000Z', 'available', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('src-draft', 'codepen', 'https://codepen.io/fixture/pen/draft-hidden', 'https://codepen.io/fixture/pen/draft-hidden', 'fixture', NULL, NULL, NULL, 'unknown', '2026-09-16T00:00:00.000Z', NULL, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z');

INSERT OR IGNORE INTO animation_entries (
  id, source_id, slug, title, original_title, summary, search_text,
  content_origin, preview_kind, status, difficulty, featured,
  published_at, created_at, updated_at
) VALUES
  ('entry-basic-1', 'src-basic-1', 'gsap-basic-tween', 'GSAP 기본 트윈', 'gsap 기초 -1', '이동과 회전으로 GSAP의 기본 트윈을 익히는 예제입니다.', 'gsap 기본 트윈 이동 회전 beginner load', 'original-pen', 'codepen', 'published', 'beginner', 1, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('entry-card-1', 'src-card-1', 'interactive-card-hover', '인터랙티브 카드', '인터랙티브 카드', '마우스 움직임에 반응하는 입체 카드 인터랙션입니다.', 'gsap 인터랙티브 카드 hover scale intermediate', 'original-pen', 'codepen', 'published', 'intermediate', 0, '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('entry-scroll-1', 'src-scroll-1', 'scroll-circle-reveal', '스크롤 원형 이미지 리빌', '이미지가 아래부분만 원 안으로 들어가는 효과', '스크롤에 맞춰 이미지가 원형 영역으로 들어가는 리빌 예제입니다.', 'gsap scroll 이미지 원형 reveal advanced', 'original-pen', 'codepen', 'published', 'advanced', 0, '2026-09-14T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('entry-draft', 'src-draft', 'hidden-draft-example', '공개되면 안 되는 초안', 'gsap 기초 -2', '공개 상태 필터 검증을 위한 내부 fixture입니다.', 'draft hidden', 'original-pen', 'codepen', 'draft', 'beginner', 0, NULL, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z');

INSERT OR IGNORE INTO codepen_refs (
  id, animation_entry_id, pen_key, pen_id, creator_slug,
  canonical_url, embed_url, theme_id, default_tab, active, last_verified_at
) VALUES
  ('pen-basic-1', 'entry-basic-1', 'hoseonkwak/LEVeYQO', 'LEVeYQO', 'hoseonkwak', 'https://codepen.io/hoseonkwak/pen/LEVeYQO', 'https://codepen.io/hoseonkwak/embed/LEVeYQO?default-tab=result&theme-id=light', 'light', 'result', 1, '2026-09-16T00:00:00.000Z'),
  ('pen-card-1', 'entry-card-1', 'hoseonkwak/qEdyyJG', 'qEdyyJG', 'hoseonkwak', 'https://codepen.io/hoseonkwak/pen/qEdyyJG', 'https://codepen.io/hoseonkwak/embed/qEdyyJG?default-tab=result&theme-id=light', 'light', 'result', 1, '2026-09-16T00:00:00.000Z'),
  ('pen-scroll-1', 'entry-scroll-1', 'hoseonkwak/vEOQNmz', 'vEOQNmz', 'hoseonkwak', 'https://codepen.io/hoseonkwak/pen/vEOQNmz', 'https://codepen.io/hoseonkwak/embed/vEOQNmz?default-tab=result&theme-id=light', 'light', 'result', 1, '2026-09-16T00:00:00.000Z'),
  ('pen-draft', 'entry-draft', 'fixture/draft-hidden', 'draft-hidden', 'fixture', 'https://codepen.io/fixture/pen/draft-hidden', 'https://codepen.io/fixture/embed/draft-hidden?default-tab=result&theme-id=light', 'light', 'result', 1, '2026-09-16T00:00:00.000Z');

INSERT OR IGNORE INTO entry_tags (animation_entry_id, tag_id, source, confidence, confirmed) VALUES
  ('entry-basic-1', 'tag-technology-gsap', 'admin', 1, 1),
  ('entry-basic-1', 'tag-trigger-load', 'admin', 1, 1),
  ('entry-basic-1', 'tag-motion-slide', 'admin', 1, 1),
  ('entry-basic-1', 'tag-difficulty-beginner', 'admin', 1, 1),
  ('entry-card-1', 'tag-technology-gsap', 'admin', 1, 1),
  ('entry-card-1', 'tag-trigger-hover', 'admin', 1, 1),
  ('entry-card-1', 'tag-motion-scale', 'admin', 1, 1),
  ('entry-card-1', 'tag-section-card', 'admin', 1, 1),
  ('entry-scroll-1', 'tag-technology-gsap', 'admin', 1, 1),
  ('entry-scroll-1', 'tag-trigger-scroll', 'admin', 1, 1),
  ('entry-scroll-1', 'tag-motion-reveal', 'admin', 1, 1),
  ('entry-scroll-1', 'tag-section-gallery', 'admin', 1, 1),
  ('entry-draft', 'tag-technology-gsap', 'admin', 1, 1);
