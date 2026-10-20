-- Apply after local-release.sql in an isolated D1, before the first scheduled call.
UPDATE auto_publication_batches
SET sample_candidate_id = 'auto-test-candidate-1', sample_candidate_version = 1
WHERE id = 'auto-test-batch-1';

DELETE FROM auto_publication_items
WHERE batch_id = 'auto-test-batch-1' AND candidate_id = 'candidate-legacy-01';

UPDATE auto_publication_items
SET role = 'sample', status = 'awaiting-sample'
WHERE batch_id = 'auto-test-batch-1' AND candidate_id = 'auto-test-candidate-1';

INSERT INTO sources (id, type, url, canonical_url, creator_name, license_code, license_evidence_url,
  availability, first_seen_at, last_checked_at, created_at, updated_at)
VALUES ('auto-test-source-3', 'codepen', 'https://codepen.io/petebarr/pen/JjPKrqg',
  'https://codepen.io/petebarr/pen/JjPKrqg', 'Pete Barr', 'MIT',
  'https://blog.codepen.io/legal/terms-of-service/', 'available',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO candidates (id, source_id, status, source_title, source_category, metadata_json, deduplication_key,
  confidence, priority_score, version, created_at, updated_at)
VALUES ('auto-test-candidate-3', 'auto-test-source-3', 'review', 'GSAP Motion Study',
  'Animation/GSAP', '{"publicTitle":"GSAP 모션 스터디","summary":"GSAP으로 만든 움직임을 확인합니다.","slug":"auto-test-gsap-study","difficulty":"intermediate"}',
  'pen:petebarr/JjPKrqg', 0.9, 50, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO candidate_tags (candidate_id, tag_id, source, confidence, confirmed)
VALUES ('auto-test-candidate-3', 'tag-technology-gsap', 'admin', 1, 1);

INSERT INTO validation_runs (id, target_type, target_id, validator, validator_version, subject_fingerprint,
  result, viewport, failure_codes_json, evidence_json, checked_at, created_at)
VALUES ('auto-test-validation-3', 'candidate', 'auto-test-candidate-3', 'browser-run-auto', '1',
  'pen:petebarr/JjPKrqg|theme:light|tab:result', 'pass', 'desktop', '[]',
  '{"status":"visual-change-observed","embedStatus":200,"resultStatus":200,"bodyLength":400,"elementCount":9,"earlyChange":true,"lateChange":true,"pageErrors":[]}',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO auto_publication_items (batch_id, candidate_id, candidate_version, role, status, probe_evidence_json)
VALUES ('auto-test-batch-1', 'auto-test-candidate-3', 1, 'automatic', 'pending', '{}');
