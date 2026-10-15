CREATE TABLE auto_publication_control (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  paused INTEGER NOT NULL DEFAULT 1 CHECK (paused IN (0, 1)),
  updated_at TEXT NOT NULL
);

INSERT INTO auto_publication_control (id, paused, updated_at)
VALUES (1, 1, '2026-10-15T00:00:00.000Z');

CREATE TABLE auto_publication_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('running', 'staged', 'no-batch', 'published', 'blocked', 'failed')),
  examined_count INTEGER NOT NULL DEFAULT 0,
  passed_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  failure_code TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE auto_publication_batches (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES auto_publication_runs(id),
  status TEXT NOT NULL CHECK (status IN ('awaiting-sample', 'blocked', 'published', 'rolled-back')),
  sample_candidate_id TEXT NOT NULL REFERENCES candidates(id),
  sample_candidate_version INTEGER NOT NULL,
  failure_code TEXT,
  created_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE auto_publication_items (
  batch_id TEXT NOT NULL REFERENCES auto_publication_batches(id),
  candidate_id TEXT NOT NULL UNIQUE REFERENCES candidates(id),
  candidate_version INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sample', 'automatic')),
  status TEXT NOT NULL CHECK (status IN ('awaiting-sample', 'pending', 'published', 'blocked', 'rolled-back')),
  probe_evidence_json TEXT NOT NULL,
  entry_id TEXT REFERENCES animation_entries(id),
  PRIMARY KEY (batch_id, candidate_id)
);

CREATE INDEX auto_publication_batches_status_idx ON auto_publication_batches(status, created_at);
