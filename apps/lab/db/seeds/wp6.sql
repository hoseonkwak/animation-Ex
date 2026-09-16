INSERT INTO patterns (
  id, slug, title, summary, defining_traits_json, featured, active, created_at, updated_at
) VALUES
  ('pattern-scroll-reveal', 'scroll-reveal', 'Scroll Reveal', '스크롤 위치에 맞춰 콘텐츠를 단계적으로 드러내는 패턴입니다.', '["scroll","reveal"]', 1, 1, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('pattern-text-motion', 'text-motion', 'Text Motion', '문장과 글자의 등장 순서를 조절해 메시지를 강조하는 패턴입니다.', '["text","stagger"]', 1, 1, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('pattern-interactive-card', 'interactive-card', 'Interactive Card', '포인터 입력에 반응해 카드의 깊이와 상태를 전달하는 패턴입니다.', '["pointer","card"]', 1, 1, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug, title = excluded.title, summary = excluded.summary,
  defining_traits_json = excluded.defining_traits_json, featured = excluded.featured,
  active = excluded.active, updated_at = excluded.updated_at;

INSERT OR IGNORE INTO pattern_entries (pattern_id, animation_entry_id, position, added_at) VALUES
  ('pattern-scroll-reveal', 'entry-legacy-04', 1, '2026-09-16T00:00:00.000Z'),
  ('pattern-scroll-reveal', 'entry-scroll-1', 2, '2026-09-16T00:00:00.000Z'),
  ('pattern-text-motion', 'entry-legacy-12', 1, '2026-09-16T00:00:00.000Z'),
  ('pattern-text-motion', 'entry-legacy-13', 2, '2026-09-16T00:00:00.000Z'),
  ('pattern-interactive-card', 'entry-card-1', 1, '2026-09-16T00:00:00.000Z');

INSERT INTO collections (
  id, slug, title, description, type, filter_json, featured, active, created_at, updated_at
) VALUES
  ('collection-gsap-start', 'gsap-start', 'GSAP 시작하기', 'GSAP의 기본 이동, 크기와 Timeline을 비교해보세요.', 'curated', NULL, 1, 1, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('collection-scroll', 'scroll-motion', '스크롤 모션', '스크롤에 반응하는 리빌과 부드러운 화면 이동을 모았습니다.', 'curated', NULL, 1, 1, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z'),
  ('collection-visual', 'visual-motion', '시각적 변형', 'SVG, 색상과 형태 변화를 활용하는 예제를 모았습니다.', 'curated', NULL, 1, 1, '2026-09-16T00:00:00.000Z', '2026-09-16T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug, title = excluded.title, description = excluded.description,
  type = excluded.type, filter_json = excluded.filter_json, featured = excluded.featured,
  active = excluded.active, updated_at = excluded.updated_at;

INSERT OR IGNORE INTO collection_entries (collection_id, animation_entry_id, position, added_at) VALUES
  ('collection-gsap-start', 'entry-basic-1', 1, '2026-09-16T00:00:00.000Z'),
  ('collection-gsap-start', 'entry-legacy-02', 2, '2026-09-16T00:00:00.000Z'),
  ('collection-gsap-start', 'entry-legacy-03', 3, '2026-09-16T00:00:00.000Z'),
  ('collection-scroll', 'entry-legacy-04', 1, '2026-09-16T00:00:00.000Z'),
  ('collection-scroll', 'entry-legacy-08', 2, '2026-09-16T00:00:00.000Z'),
  ('collection-scroll', 'entry-scroll-1', 3, '2026-09-16T00:00:00.000Z'),
  ('collection-visual', 'entry-legacy-10', 1, '2026-09-16T00:00:00.000Z'),
  ('collection-visual', 'entry-legacy-13', 2, '2026-09-16T00:00:00.000Z'),
  ('collection-visual', 'entry-legacy-14', 3, '2026-09-16T00:00:00.000Z');