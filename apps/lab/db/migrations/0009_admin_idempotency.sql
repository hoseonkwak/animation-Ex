CREATE TABLE admin_idempotency_keys (
  key TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  target_id TEXT NOT NULL,
  result_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX admin_idempotency_target_idx
  ON admin_idempotency_keys(operation, target_id);
