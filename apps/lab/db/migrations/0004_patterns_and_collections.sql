CREATE TABLE patterns (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  defining_traits_json TEXT NOT NULL DEFAULT '[]',
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE pattern_entries (
  pattern_id TEXT NOT NULL REFERENCES patterns(id),
  animation_entry_id TEXT NOT NULL REFERENCES animation_entries(id),
  position INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL,
  PRIMARY KEY (pattern_id, animation_entry_id)
);

CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('curated', 'dynamic')),
  filter_json TEXT,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((type = 'dynamic' AND filter_json IS NOT NULL) OR type = 'curated')
);

CREATE TABLE collection_entries (
  collection_id TEXT NOT NULL REFERENCES collections(id),
  animation_entry_id TEXT NOT NULL REFERENCES animation_entries(id),
  position INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL,
  PRIMARY KEY (collection_id, animation_entry_id)
);

CREATE INDEX pattern_entries_position_idx
  ON pattern_entries(pattern_id, position, animation_entry_id);
