CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL UNIQUE REFERENCES sources(id),
  status TEXT NOT NULL CHECK (status IN ('candidate', 'analyzing', 'review', 'approved', 'rejected', 'needs-edit', 'duplicate', 'source-unavailable', 'validation-failed')),
  source_title TEXT,
  source_category TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  deduplication_key TEXT NOT NULL UNIQUE,
  confidence REAL NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
  priority_score REAL NOT NULL DEFAULT 0 CHECK (priority_score BETWEEN 0 AND 100),
  failure_code TEXT,
  failure_detail TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX candidates_review_queue_idx
  ON candidates(status, priority_score DESC, created_at);
