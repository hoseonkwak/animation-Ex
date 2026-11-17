-- Unpublish only entries belonging to this bulk operation.
UPDATE animation_entries
SET status = 'unpublished', published_at = NULL,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE status = 'published' AND id IN (
  SELECT entry_id FROM bulk_publication_items
  WHERE run_id = 'bulk-2026-11-17' AND status = 'published'
);

UPDATE candidates
SET status = 'review', version = version + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE status = 'approved' AND id IN (
  SELECT candidate_id FROM bulk_publication_items
  WHERE run_id = 'bulk-2026-11-17' AND status = 'published'
);

UPDATE bulk_publication_items SET status = 'rolled-back'
WHERE run_id = 'bulk-2026-11-17' AND status = 'published';

UPDATE bulk_publication_runs
SET status = 'rolled-back', finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'bulk-2026-11-17' AND status IN ('running', 'completed', 'failed');
