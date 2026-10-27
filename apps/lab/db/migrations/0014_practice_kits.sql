CREATE TABLE code_package_versions (
  id TEXT PRIMARY KEY,
  animation_entry_id TEXT NOT NULL REFERENCES animation_entries(id),
  version INTEGER NOT NULL CHECK (version > 0),
  html TEXT NOT NULL,
  css TEXT NOT NULL,
  javascript TEXT NOT NULL,
  external_scripts_json TEXT NOT NULL DEFAULT '[]',
  external_styles_json TEXT NOT NULL DEFAULT '[]',
  assets_json TEXT NOT NULL DEFAULT '[]',
  viewport_json TEXT NOT NULL DEFAULT '{"width":1280,"height":800}',
  interaction_instructions TEXT NOT NULL DEFAULT '',
  runtime_policy_json TEXT NOT NULL DEFAULT '{"sandbox":"allow-scripts"}',
  provenance_json TEXT NOT NULL,
  license_code TEXT NOT NULL,
  created_by TEXT NOT NULL CHECK (created_by IN ('imported', 'agent', 'admin')),
  created_at TEXT NOT NULL,
  UNIQUE (animation_entry_id, version),
  CHECK (length(html) + length(css) + length(javascript) > 0)
);

CREATE TRIGGER code_package_versions_immutable
BEFORE UPDATE ON code_package_versions
BEGIN
  SELECT RAISE(ABORT, 'code package versions are immutable');
END;

CREATE TABLE practice_kits (
  id TEXT PRIMARY KEY,
  animation_entry_id TEXT NOT NULL UNIQUE REFERENCES animation_entries(id),
  starter_code_package_version_id TEXT NOT NULL REFERENCES code_package_versions(id),
  mode TEXT NOT NULL DEFAULT 'free' CHECK (mode = 'free'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'paused')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TRIGGER practice_kits_entry_match_insert
BEFORE INSERT ON practice_kits
WHEN (SELECT animation_entry_id FROM code_package_versions WHERE id = NEW.starter_code_package_version_id) != NEW.animation_entry_id
BEGIN
  SELECT RAISE(ABORT, 'practice kit entry mismatch');
END;

CREATE TRIGGER practice_kits_entry_match_update
BEFORE UPDATE ON practice_kits
WHEN (SELECT animation_entry_id FROM code_package_versions WHERE id = NEW.starter_code_package_version_id) != NEW.animation_entry_id
BEGIN
  SELECT RAISE(ABORT, 'practice kit entry mismatch');
END;

CREATE INDEX idx_practice_kits_ready ON practice_kits(status, animation_entry_id);
