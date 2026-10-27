-- Emergency stop for only the one-time bulk run. Published URLs return 410.
UPDATE animation_entries
SET status = 'unpublished', published_at = NULL,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN (
  SELECT entry_id FROM bulk_publication_items
  WHERE run_id = 'bulk-2026-10-27' AND status = 'published'
) AND status = 'published';

UPDATE candidates
SET status = 'review', version = version + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN (
  SELECT candidate_id FROM bulk_publication_items
  WHERE run_id = 'bulk-2026-10-27' AND status = 'published'
) AND status = 'approved';

UPDATE bulk_publication_items SET status = 'rolled-back'
WHERE run_id = 'bulk-2026-10-27' AND status = 'published';

UPDATE bulk_publication_runs
SET status = 'rolled-back', finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'bulk-2026-10-27' AND status = 'completed';
