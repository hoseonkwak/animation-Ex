-- Bulk CodePen imports remain visibly unverified until their live preview is checked.
ALTER TABLE animation_entries
  ADD COLUMN runtime_verified INTEGER NOT NULL DEFAULT 1 CHECK (runtime_verified IN (0, 1));

CREATE TABLE bulk_publication_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'rolled-back')),
  requested_count INTEGER NOT NULL,
  published_count INTEGER NOT NULL DEFAULT 0,
  failure_detail TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE bulk_publication_items (
  run_id TEXT NOT NULL REFERENCES bulk_publication_runs(id),
  candidate_id TEXT NOT NULL UNIQUE REFERENCES candidates(id),
  entry_id TEXT NOT NULL UNIQUE REFERENCES animation_entries(id),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'rolled-back')),
  PRIMARY KEY (run_id, candidate_id)
);
