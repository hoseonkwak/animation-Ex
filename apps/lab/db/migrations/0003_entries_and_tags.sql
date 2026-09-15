CREATE TABLE animation_entries (
  id TEXT PRIMARY KEY,
  candidate_id TEXT UNIQUE REFERENCES candidates(id),
  source_id TEXT REFERENCES sources(id),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT,
  summary TEXT NOT NULL,
  search_text TEXT NOT NULL,
  content_origin TEXT NOT NULL CHECK (content_origin IN ('original-pen', 'lab-created')),
  preview_kind TEXT NOT NULL CHECK (preview_kind IN ('codepen', 'internal')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'unpublished')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  active_code_package_version_id TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((status = 'published' AND published_at IS NOT NULL) OR (status <> 'published' AND published_at IS NULL))
);

CREATE TABLE codepen_refs (
  id TEXT PRIMARY KEY,
  animation_entry_id TEXT NOT NULL UNIQUE REFERENCES animation_entries(id),
  pen_key TEXT NOT NULL UNIQUE,
  pen_id TEXT NOT NULL,
  creator_slug TEXT NOT NULL,
  canonical_url TEXT NOT NULL UNIQUE,
  embed_url TEXT NOT NULL,
  theme_id TEXT NOT NULL DEFAULT 'light',
  default_tab TEXT NOT NULL DEFAULT 'result',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  last_verified_at TEXT NOT NULL
);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  axis TEXT NOT NULL CHECK (axis IN ('technology', 'trigger', 'motion', 'section', 'technique', 'difficulty', 'mood')),
  key TEXT NOT NULL,
  label_ko TEXT NOT NULL,
  label_en TEXT NOT NULL,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  UNIQUE (axis, key)
);

CREATE TABLE candidate_tags (
  candidate_id TEXT NOT NULL REFERENCES candidates(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  source TEXT NOT NULL CHECK (source IN ('imported', 'inferred', 'admin')),
  confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  confirmed INTEGER NOT NULL DEFAULT 0 CHECK (confirmed IN (0, 1)),
  PRIMARY KEY (candidate_id, tag_id)
);

CREATE TABLE entry_tags (
  animation_entry_id TEXT NOT NULL REFERENCES animation_entries(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  source TEXT NOT NULL CHECK (source IN ('imported', 'inferred', 'admin')),
  confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  confirmed INTEGER NOT NULL DEFAULT 0 CHECK (confirmed IN (0, 1)),
  PRIMARY KEY (animation_entry_id, tag_id)
);

CREATE INDEX animation_entries_published_idx
  ON animation_entries(status, published_at DESC, id);
CREATE INDEX animation_entries_featured_idx
  ON animation_entries(status, featured DESC, published_at DESC, id);
CREATE INDEX animation_entries_difficulty_idx
  ON animation_entries(difficulty, status, published_at DESC, id);
CREATE INDEX entry_tags_tag_idx ON entry_tags(tag_id, animation_entry_id);
