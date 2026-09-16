CREATE TABLE ingestion_requests (
  request_id TEXT PRIMARY KEY,
  key_id TEXT NOT NULL,
  request_timestamp TEXT NOT NULL,
  body_sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX ingestion_requests_created_idx ON ingestion_requests(created_at);
