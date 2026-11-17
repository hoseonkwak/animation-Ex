-- Publish the reviewed November 17 inventory as unverified CodePen entries.
INSERT OR IGNORE INTO bulk_publication_runs (id, status, requested_count, started_at)
SELECT 'bulk-2026-11-17', 'running', 1121, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE (SELECT COUNT(*) FROM animation_entries WHERE status = 'published') = 1879
  AND (SELECT COUNT(*) FROM candidates c JOIN sources s ON s.id = c.source_id
    WHERE c.status = 'review'
      AND c.source_category IN ('CodeMyUI/All', 'TheAnimatedWeb/CodePen', 'CodePen/Spark')
      AND s.type = 'codepen' AND s.availability <> 'unavailable'
      AND s.canonical_url GLOB 'https://codepen.io/*/pen/*'
      AND trim(s.creator_name) <> '' AND trim(s.license_code) <> ''
      AND trim(s.license_evidence_url) <> ''
      AND NOT EXISTS (SELECT 1 FROM codepen_refs p WHERE p.canonical_url = s.canonical_url)
      AND NOT EXISTS (SELECT 1 FROM animation_entries e WHERE e.candidate_id = c.id)
  ) = 1121;

INSERT INTO animation_entries (
  id, candidate_id, source_id, slug, title, original_title, summary, search_text,
  content_origin, preview_kind, status, difficulty, featured, runtime_verified,
  published_at, created_at, updated_at
)
SELECT
  'bulk-entry-' || c.id, c.id, c.source_id, 'bulk-' || lower(c.id),
  COALESCE(NULLIF(trim(json_extract(c.metadata_json, '$.publicTitle')), ''),
    NULLIF(trim(c.source_title), ''), 'CodePen 애니메이션 예제'),
  c.source_title,
  COALESCE(NULLIF(trim(json_extract(c.metadata_json, '$.summary')), ''),
    'CodePen 원본의 움직임과 상호작용을 살펴보는 예제입니다.'),
  lower(COALESCE(json_extract(c.metadata_json, '$.publicTitle'), '') || ' ' ||
    COALESCE(c.source_title, '') || ' ' || COALESCE(c.source_category, '')),
  'original-pen', 'codepen', 'published',
  CASE WHEN json_extract(c.metadata_json, '$.difficulty') IN ('beginner', 'intermediate', 'advanced')
    THEN json_extract(c.metadata_json, '$.difficulty') ELSE 'intermediate' END,
  0, 0, r.started_at, r.started_at, r.started_at
FROM candidates c JOIN sources s ON s.id = c.source_id
JOIN bulk_publication_runs r ON r.id = 'bulk-2026-11-17' AND r.status = 'running'
WHERE c.status = 'review'
  AND c.source_category IN ('CodeMyUI/All', 'TheAnimatedWeb/CodePen', 'CodePen/Spark')
  AND s.type = 'codepen' AND s.availability <> 'unavailable'
  AND s.canonical_url GLOB 'https://codepen.io/*/pen/*'
  AND trim(s.creator_name) <> '' AND trim(s.license_code) <> ''
  AND trim(s.license_evidence_url) <> ''
  AND NOT EXISTS (SELECT 1 FROM codepen_refs p WHERE p.canonical_url = s.canonical_url)
  AND NOT EXISTS (SELECT 1 FROM animation_entries e WHERE e.candidate_id = c.id);

INSERT INTO codepen_refs (
  id, animation_entry_id, pen_key, pen_id, creator_slug, canonical_url,
  embed_url, theme_id, default_tab, active, last_verified_at
)
SELECT
  'bulk-ref-' || e.candidate_id, e.id,
  replace(replace(s.canonical_url, 'https://codepen.io/', ''), '/pen/', '/'),
  substr(s.canonical_url, instr(s.canonical_url, '/pen/') + 5),
  substr(s.canonical_url, length('https://codepen.io/') + 1,
    instr(s.canonical_url, '/pen/') - length('https://codepen.io/') - 1),
  s.canonical_url,
  replace(s.canonical_url, '/pen/', '/embed/') || '?default-tab=result&theme-id=light',
  'light', 'result', 1, '1970-01-01T00:00:00.000Z'
FROM animation_entries e JOIN sources s ON s.id = e.source_id
JOIN bulk_publication_runs r ON r.id = 'bulk-2026-11-17' AND r.status = 'running'
WHERE e.created_at = r.started_at AND e.id = 'bulk-entry-' || e.candidate_id;

INSERT INTO bulk_publication_items (run_id, candidate_id, entry_id)
SELECT r.id, e.candidate_id, e.id
FROM animation_entries e JOIN codepen_refs p ON p.animation_entry_id = e.id
JOIN bulk_publication_runs r ON r.id = 'bulk-2026-11-17' AND r.status = 'running'
WHERE e.created_at = r.started_at AND e.id = 'bulk-entry-' || e.candidate_id;

INSERT INTO entry_tags (animation_entry_id, tag_id, source, confidence, confirmed)
SELECT i.entry_id, ct.tag_id, ct.source, ct.confidence, ct.confirmed
FROM bulk_publication_items i JOIN candidate_tags ct ON ct.candidate_id = i.candidate_id
JOIN bulk_publication_runs r ON r.id = i.run_id
WHERE r.id = 'bulk-2026-11-17' AND r.status = 'running';

UPDATE candidates SET status = 'approved', version = version + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE status = 'review' AND id IN (
  SELECT i.candidate_id FROM bulk_publication_items i
  JOIN bulk_publication_runs r ON r.id = i.run_id
  WHERE r.id = 'bulk-2026-11-17' AND r.status = 'running'
);

UPDATE bulk_publication_runs
SET published_count = (SELECT COUNT(*) FROM bulk_publication_items WHERE run_id = 'bulk-2026-11-17'),
  status = CASE WHEN (SELECT COUNT(*) FROM bulk_publication_items WHERE run_id = 'bulk-2026-11-17')
    = requested_count THEN 'completed' ELSE 'failed' END,
  finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'bulk-2026-11-17' AND status = 'running';
