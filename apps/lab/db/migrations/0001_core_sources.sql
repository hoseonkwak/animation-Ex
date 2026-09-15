PRAGMA foreign_keys = ON;

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('codepen', 'website', 'independent')),
  url TEXT NOT NULL,
  canonical_url TEXT UNIQUE,
  creator_name TEXT,
  license_code TEXT,
  license_evidence_url TEXT,
  license_checked_at TEXT,
  availability TEXT NOT NULL DEFAULT 'unknown' CHECK (availability IN ('unknown', 'available', 'unavailable')),
  first_seen_at TEXT NOT NULL,
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE discovery_sources (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  config_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE source_discoveries (
  source_id TEXT NOT NULL REFERENCES sources(id),
  discovery_source_id TEXT NOT NULL REFERENCES discovery_sources(id),
  discovered_url TEXT NOT NULL,
  external_id TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (source_id, discovery_source_id, discovered_url)
);

CREATE UNIQUE INDEX source_discoveries_external_id_uq
  ON source_discoveries(discovery_source_id, external_id)
  WHERE external_id IS NOT NULL;
