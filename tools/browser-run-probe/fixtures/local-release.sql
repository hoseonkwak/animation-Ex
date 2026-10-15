UPDATE auto_publication_control SET paused = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 1;

INSERT INTO auto_publication_runs (id, status, started_at, finished_at)
VALUES ('auto-test-run-1', 'staged', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO auto_publication_batches (id, run_id, status, sample_candidate_id, sample_candidate_version, created_at)
VALUES ('auto-test-batch-1', 'auto-test-run-1', 'awaiting-sample', 'candidate-legacy-01', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO auto_publication_items (batch_id, candidate_id, candidate_version, role, status, probe_evidence_json)
VALUES ('auto-test-batch-1', 'candidate-legacy-01', 1, 'sample', 'awaiting-sample', '{}');

INSERT INTO sources (id, type, url, canonical_url, creator_name, license_code, license_evidence_url,
  availability, first_seen_at, last_checked_at, created_at, updated_at)
VALUES
  ('auto-test-source-1', 'codepen', 'https://codepen.io/georgedoescode/pen/qBqLrGG', 'https://codepen.io/georgedoescode/pen/qBqLrGG', 'George Francis', 'MIT', 'https://blog.codepen.io/legal/terms-of-service/', 'available', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('auto-test-source-2', 'codepen', 'https://codepen.io/Sicontis/pen/oNbgjda', 'https://codepen.io/Sicontis/pen/oNbgjda', 'Sicontis', 'MIT', 'https://blog.codepen.io/legal/terms-of-service/', 'available', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO candidates (id, source_id, status, source_title, source_category, metadata_json, deduplication_key,
  confidence, priority_score, version, created_at, updated_at)
VALUES
  ('auto-test-candidate-1', 'auto-test-source-1', 'review', 'Generative GSAP', 'Animation/GSAP', '{"publicTitle":"GSAP 랜덤 애니메이션","summary":"GSAP으로 만든 움직임을 확인합니다.","slug":"auto-test-generative-gsap","difficulty":"intermediate"}', 'pen:georgedoescode/qBqLrGG', 0.9, 50, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('auto-test-candidate-2', 'auto-test-source-2', 'review', 'GSAP Sequencing', 'Animation/GSAP', '{"publicTitle":"GSAP 시퀀스 애니메이션","summary":"GSAP으로 만든 움직임을 확인합니다.","slug":"auto-test-gsap-sequencing","difficulty":"intermediate"}', 'pen:Sicontis/oNbgjda', 0.9, 50, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO candidate_tags (candidate_id, tag_id, source, confidence, confirmed)
VALUES ('auto-test-candidate-1', 'tag-technology-gsap', 'admin', 1, 1),
  ('auto-test-candidate-2', 'tag-technology-gsap', 'admin', 1, 1);

INSERT INTO validation_runs (id, target_type, target_id, validator, validator_version, subject_fingerprint,
  result, viewport, failure_codes_json, evidence_json, checked_at, created_at)
VALUES
  ('auto-test-validation-1', 'candidate', 'auto-test-candidate-1', 'browser-run-auto', '1', 'pen:georgedoescode/qBqLrGG|theme:light|tab:result', 'pass', 'desktop', '[]', '{}', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('auto-test-validation-2', 'candidate', 'auto-test-candidate-2', 'browser-run-auto', '1', 'pen:Sicontis/oNbgjda|theme:light|tab:result', 'pass', 'desktop', '[]', '{}', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO auto_publication_items (batch_id, candidate_id, candidate_version, role, status, probe_evidence_json)
VALUES ('auto-test-batch-1', 'auto-test-candidate-1', 1, 'automatic', 'pending', '{}'),
  ('auto-test-batch-1', 'auto-test-candidate-2', 1, 'automatic', 'pending', '{}');
