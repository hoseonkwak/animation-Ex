CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  submitted_url TEXT NOT NULL,
  normalized_url_hash TEXT NOT NULL UNIQUE,
  note TEXT CHECK (length(note) <= 300),
  status TEXT NOT NULL CHECK (status IN ('received', 'linked', 'rejected')),
  source_id TEXT REFERENCES sources(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE daily_metrics (
  metric_date TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  dimension_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (metric_date, metric_key, dimension_key)
);
