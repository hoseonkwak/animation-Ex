CREATE TABLE example_reports (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES animation_entries(id),
  reason_code TEXT NOT NULL CHECK (reason_code IN (
    'not-working', 'source-unavailable', 'inappropriate', 'removal-request', 'other'
  )),
  note TEXT CHECK (length(note) <= 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  report_day TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 1 CHECK (report_count > 0),
  admin_note TEXT CHECK (length(admin_note) <= 500),
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX example_reports_open_daily_idx
  ON example_reports (entry_id, reason_code, report_day) WHERE status = 'open';

CREATE INDEX example_reports_status_created_idx
  ON example_reports (status, created_at DESC);

CREATE INDEX example_reports_entry_idx
  ON example_reports (entry_id, status);
