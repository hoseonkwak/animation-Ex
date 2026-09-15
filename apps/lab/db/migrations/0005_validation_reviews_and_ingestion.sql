CREATE TABLE validation_runs (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('candidate', 'entry')),
  target_id TEXT NOT NULL,
  validator TEXT NOT NULL,
  validator_version TEXT NOT NULL,
  subject_fingerprint TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'warning')),
  viewport TEXT NOT NULL CHECK (viewport IN ('desktop', 'tablet', 'mobile')),
  failure_codes_json TEXT NOT NULL DEFAULT '[]',
  evidence_json TEXT NOT NULL DEFAULT '{}',
  checked_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE review_decisions (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('candidate', 'entry')),
  target_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject', 'needs-edit', 'merge', 'unpublish')),
  reason_code TEXT,
  note TEXT,
  changes_json TEXT NOT NULL DEFAULT '{}',
  actor_email_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE ingestion_runs (
  id TEXT PRIMARY KEY,
  discovery_source_id TEXT NOT NULL REFERENCES discovery_sources(id),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed', 'paused-limit')),
  trigger TEXT NOT NULL CHECK (trigger IN ('schedule', 'manual')),
  checkpoint_before TEXT,
  checkpoint_after TEXT,
  discovered_count INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  failure_code TEXT,
  failure_detail TEXT
);

CREATE TABLE ingestion_items (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL REFERENCES ingestion_runs(id),
  external_id TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  source_url TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('accepted', 'duplicate', 'failed')),
  candidate_id TEXT REFERENCES candidates(id),
  failure_code TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (ingestion_run_id, external_id)
);

CREATE INDEX validation_runs_target_idx
  ON validation_runs(target_type, target_id, checked_at DESC);
CREATE INDEX review_decisions_target_idx
  ON review_decisions(target_type, target_id, created_at DESC);
CREATE INDEX ingestion_runs_source_idx
  ON ingestion_runs(discovery_source_id, started_at DESC);
