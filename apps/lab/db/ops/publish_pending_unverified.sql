-- One-time, rerunnable import authorized on 2026-10-27.
-- The rows are public, but runtime_verified=0 until a separate live check passes.
INSERT OR IGNORE INTO bulk_publication_runs (
  id, status, requested_count, started_at
)
SELECT 'bulk-2026-10-27', 'running', COUNT(*), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM candidates WHERE status = 'review';

INSERT OR IGNORE INTO animation_entries (
  id, candidate_id, source_id, slug, title, original_title, summary, search_text,
  content_origin, preview_kind, status, difficulty, featured, runtime_verified,
  published_at, created_at, updated_at
)
SELECT
  'bulk-entry-' || c.id,
  c.id,
  c.source_id,
  'bulk-' || lower(c.id),
  COALESCE(NULLIF(trim(json_extract(c.metadata_json, '$.publicTitle')), ''),
    NULLIF(trim(c.source_title), ''), 'CodePen 애니메이션 예제'),
  c.source_title,
  COALESCE(NULLIF(trim(json_extract(c.metadata_json, '$.summary')), ''),
    'CodePen 원본의 움직임과 상호작용을 살펴보는 예제입니다.'),
  lower(COALESCE(json_extract(c.metadata_json, '$.publicTitle'), '') || ' ' ||
    COALESCE(c.source_title, '') || ' ' || COALESCE(c.source_category, '')),
  'original-pen', 'codepen', 'published',
  CASE WHEN json_extract(c.metadata_json, '$.difficulty') IN
    ('beginner', 'intermediate', 'advanced')
    THEN json_extract(c.metadata_json, '$.difficulty') ELSE 'intermediate' END,
  0, 0,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM candidates c JOIN sources s ON s.id = c.source_id
WHERE c.status = 'review' AND s.type = 'codepen'
  AND s.canonical_url GLOB 'https://codepen.io/*/pen/*'
  AND s.creator_name IS NOT NULL AND s.license_code IS NOT NULL
  AND s.license_evidence_url IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM codepen_refs p WHERE p.canonical_url = s.canonical_url);

INSERT OR IGNORE INTO codepen_refs (
  id, animation_entry_id, pen_key, pen_id, creator_slug, canonical_url,
  embed_url, theme_id, default_tab, active, last_verified_at
)
SELECT
  'bulk-ref-' || c.id,
  e.id,
  replace(replace(rtrim(s.canonical_url, '/'), 'https://codepen.io/', ''), '/pen/', '/'),
  substr(rtrim(s.canonical_url, '/'), instr(rtrim(s.canonical_url, '/'), '/pen/') + 5),
  substr(rtrim(s.canonical_url, '/'), length('https://codepen.io/') + 1,
    instr(rtrim(s.canonical_url, '/'), '/pen/') - length('https://codepen.io/') - 1),
  rtrim(s.canonical_url, '/'),
  replace(rtrim(s.canonical_url, '/'), '/pen/', '/embed/') ||
    '?default-tab=result&theme-id=light',
  'light', 'result', 1, '1970-01-01T00:00:00.000Z'
FROM candidates c JOIN sources s ON s.id = c.source_id
JOIN animation_entries e ON e.candidate_id = c.id AND e.runtime_verified = 0
WHERE c.status = 'review';

INSERT OR IGNORE INTO entry_tags (
  animation_entry_id, tag_id, source, confidence, confirmed
)
SELECT e.id, ct.tag_id, ct.source, ct.confidence, ct.confirmed
FROM candidates c JOIN animation_entries e ON e.candidate_id = c.id
JOIN candidate_tags ct ON ct.candidate_id = c.id
WHERE c.status = 'review' AND e.runtime_verified = 0 AND ct.confirmed = 1;

INSERT OR IGNORE INTO entry_tags (
  animation_entry_id, tag_id, source, confidence, confirmed
)
SELECT e.id, t.id, 'inferred', 0.5, 0
FROM candidates c JOIN animation_entries e ON e.candidate_id = c.id
JOIN tags t ON t.axis = 'section' AND t.key = CASE
  WHEN c.source_category LIKE 'Text/%' THEN 'text'
  WHEN c.source_category LIKE 'Button/%' THEN 'button'
  WHEN c.source_category LIKE 'Slider/%' THEN 'slider'
  WHEN c.source_category LIKE 'Menu/%' THEN 'navigation'
  WHEN c.source_category = 'Image/Background' THEN 'background'
  WHEN c.source_category LIKE 'Image/%' THEN 'image'
  WHEN c.source_category = 'Animation/Loading' THEN 'loading'
  WHEN c.source_category = 'UI/Card UI' THEN 'card'
  WHEN c.source_category = 'UI/Modal UI' THEN 'modal'
  WHEN c.source_category = 'UI/Dashboard UI' THEN 'dashboard'
  WHEN c.source_category IN ('UI/Form UI', 'UI/Login UI') THEN 'form'
  WHEN c.source_category = 'UI/Intro UI' THEN 'hero'
  ELSE NULL END
WHERE c.status = 'review' AND e.runtime_verified = 0;

INSERT OR IGNORE INTO bulk_publication_items (run_id, candidate_id, entry_id)
SELECT 'bulk-2026-10-27', c.id, e.id
FROM candidates c JOIN animation_entries e ON e.candidate_id = c.id
JOIN codepen_refs p ON p.animation_entry_id = e.id
WHERE c.status = 'review' AND e.runtime_verified = 0;

UPDATE candidates
SET status = 'approved', version = version + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE status = 'review' AND id IN (
  SELECT candidate_id FROM bulk_publication_items
  WHERE run_id = 'bulk-2026-10-27'
);

UPDATE bulk_publication_runs
SET status = 'completed',
  published_count = (SELECT COUNT(*) FROM bulk_publication_items
    WHERE run_id = 'bulk-2026-10-27'),
  finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'bulk-2026-10-27';
