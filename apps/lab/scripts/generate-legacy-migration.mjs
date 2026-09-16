/* global console */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(appRoot, 'fixtures/legacy-gsap.json')
const migrationPath = path.join(appRoot, 'db/migrations/0008_seed_legacy_examples.sql')
const examples = JSON.parse(readFileSync(manifestPath, 'utf8'))
const timestamp = '2026-09-16T00:00:00.000Z'
const licenseUrl = 'https://blog.codepen.io/documentation/licensing/'

const extraTags = [
  ['tag-trigger-pointer', 'trigger', 'pointer', '포인터', 'Pointer', '["mouse","cursor"]'],
  ['tag-trigger-drag', 'trigger', 'drag', '드래그', 'Drag', '[]'],
  ['tag-motion-drag', 'motion', 'drag', '드래그 이동', 'Drag', '[]'],
  ['tag-motion-morph', 'motion', 'morph', '모핑', 'Morph', '[]'],
  ['tag-motion-draw', 'motion', 'draw', '그리기', 'Draw', '["stroke"]'],
  ['tag-motion-color', 'motion', 'color', '색상 전환', 'Color', '["background"]'],
  ['tag-section-text', 'section', 'text', '텍스트', 'Text', '[]'],
  ['tag-section-background', 'section', 'background', '배경', 'Background', '[]'],
  [
    'tag-technique-scroll-trigger',
    'technique',
    'scroll-trigger',
    'ScrollTrigger',
    'ScrollTrigger',
    '[]',
  ],
  [
    'tag-technique-scroll-smoother',
    'technique',
    'scroll-smoother',
    'ScrollSmoother',
    'ScrollSmoother',
    '[]',
  ],
  ['tag-technique-draggable', 'technique', 'draggable', 'Draggable', 'Draggable', '[]'],
  ['tag-technique-morph-svg', 'technique', 'morph-svg', 'MorphSVG', 'MorphSVG', '[]'],
  ['tag-technique-draw-svg', 'technique', 'draw-svg', 'DrawSVG', 'DrawSVG', '[]'],
]

function quote(value) {
  if (value === null) return 'NULL'
  if (typeof value === 'number') return String(value)
  return `'${String(value).replaceAll("'", "''")}'`
}

function ids(example) {
  if (example.position === 1) return ['src-basic-1', 'entry-basic-1', 'pen-basic-1']
  if (example.position === 7) return ['src-card-1', 'entry-card-1', 'pen-card-1']
  if (example.position === 15) return ['src-scroll-1', 'entry-scroll-1', 'pen-scroll-1']
  const suffix = String(example.position).padStart(2, '0')
  return [`src-legacy-${suffix}`, `entry-legacy-${suffix}`, `pen-legacy-${suffix}`]
}

function values(rows) {
  return rows.map((row) => `  (${row.map(quote).join(', ')})`).join(',\n')
}

const sourceRows = []
const candidateRows = []
const entryRows = []
const penRows = []
const candidateTagRows = []
const entryTagRows = []
const validationRows = []
const reviewRows = []

for (const example of examples) {
  const [sourceId, entryId, penRefId] = ids(example)
  const suffix = String(example.position).padStart(2, '0')
  const candidateId = `candidate-legacy-${suffix}`
  const canonicalUrl = `https://codepen.io/hoseonkwak/pen/${example.penId}`
  const embedUrl = `https://codepen.io/hoseonkwak/embed/${example.penId}?default-tab=result&theme-id=light`
  const publishedAt = `2026-09-16T00:${String(16 - example.position).padStart(2, '0')}:00.000Z`
  const searchText = [example.title, example.originalTitle, example.summary, ...example.tags]
    .join(' ')
    .toLocaleLowerCase('ko-KR')
  const fingerprint = createHash('sha256')
    .update(`hoseonkwak/${example.penId}|light|result`)
    .digest('hex')

  sourceRows.push([
    sourceId,
    'codepen',
    canonicalUrl,
    canonicalUrl,
    'hoseonkwak',
    'MIT',
    licenseUrl,
    timestamp,
    'available',
    timestamp,
    timestamp,
    timestamp,
    timestamp,
  ])
  candidateRows.push([
    candidateId,
    sourceId,
    'approved',
    example.originalTitle,
    'legacy-gsap',
    JSON.stringify({ legacyFile: example.file, listPosition: example.position }),
    `codepen:hoseonkwak/${example.penId}`,
    1,
    100 - example.position,
    1,
    timestamp,
    timestamp,
  ])
  entryRows.push([
    entryId,
    candidateId,
    sourceId,
    example.slug,
    example.title,
    example.originalTitle,
    example.summary,
    searchText,
    'original-pen',
    'codepen',
    'published',
    example.difficulty,
    example.featured ? 1 : 0,
    publishedAt,
    timestamp,
    timestamp,
  ])
  penRows.push([
    penRefId,
    entryId,
    `hoseonkwak/${example.penId}`,
    example.penId,
    'hoseonkwak',
    canonicalUrl,
    embedUrl,
    'light',
    'result',
    1,
    timestamp,
  ])
  for (const tag of example.tags) {
    const [axis, key] = tag.split(':')
    const tagId = `tag-${axis}-${key}`
    candidateTagRows.push([candidateId, tagId, 'admin', 1, 1])
    entryTagRows.push([entryId, tagId, 'admin', 1, 1])
  }
  validationRows.push([
    `validation-legacy-${suffix}`,
    'entry',
    entryId,
    'admin-codepen-embed',
    '1.0.0',
    `sha256:${fingerprint}`,
    'pass',
    'desktop',
    '[]',
    JSON.stringify({
      method: 'visible-browser-codepen-embed',
      canonicalUrl,
      legacyFile: example.file,
    }),
    timestamp,
    timestamp,
  ])
  reviewRows.push([
    `review-legacy-${suffix}`,
    'candidate',
    candidateId,
    'approve',
    'legacy-migration',
    '기존 공개 GSAP 목록에서 이전',
    JSON.stringify({ legacyFile: example.file, listPosition: example.position }),
    null,
    timestamp,
  ])
}

const sql = `-- Generated from fixtures/legacy-gsap.json. Do not edit after application.\nPRAGMA foreign_keys = ON;\n\n-- The old draft fixture used the real second legacy Pen. Move it before claiming that Pen.\nUPDATE codepen_refs\nSET pen_key = 'fixture/draft-hidden',\n    pen_id = 'draft-hidden',\n    creator_slug = 'fixture',\n    canonical_url = 'https://codepen.io/fixture/pen/draft-hidden',\n    embed_url = 'https://codepen.io/fixture/embed/draft-hidden?default-tab=result&theme-id=light'\nWHERE id = 'pen-draft' AND pen_id = 'KwpZamO';\n\nUPDATE sources\nSET url = 'https://codepen.io/fixture/pen/draft-hidden',\n    canonical_url = 'https://codepen.io/fixture/pen/draft-hidden',\n    creator_name = 'fixture',\n    license_code = NULL,\n    license_evidence_url = NULL,\n    license_checked_at = NULL,\n    availability = 'unknown',\n    updated_at = '${timestamp}'\nWHERE id = 'src-draft' AND canonical_url = 'https://codepen.io/hoseonkwak/pen/KwpZamO';\n\nINSERT OR IGNORE INTO tags (id, axis, key, label_ko, label_en, aliases_json) VALUES\n${values(extraTags)};\n\nINSERT INTO sources (\n  id, type, url, canonical_url, creator_name, license_code, license_evidence_url,\n  license_checked_at, availability, first_seen_at, last_checked_at, created_at, updated_at\n) VALUES\n${values(sourceRows)}\nON CONFLICT(id) DO UPDATE SET\n  url = excluded.url, canonical_url = excluded.canonical_url, creator_name = excluded.creator_name,\n  license_code = excluded.license_code, license_evidence_url = excluded.license_evidence_url,\n  license_checked_at = excluded.license_checked_at, availability = excluded.availability,\n  last_checked_at = excluded.last_checked_at, updated_at = excluded.updated_at;\n\nINSERT INTO candidates (\n  id, source_id, status, source_title, source_category, metadata_json, deduplication_key,\n  confidence, priority_score, version, created_at, updated_at\n) VALUES\n${values(candidateRows)}\nON CONFLICT(id) DO UPDATE SET\n  status = excluded.status, source_title = excluded.source_title, source_category = excluded.source_category,\n  metadata_json = excluded.metadata_json, confidence = excluded.confidence,\n  priority_score = excluded.priority_score, version = excluded.version, updated_at = excluded.updated_at;\n\nINSERT INTO animation_entries (\n  id, candidate_id, source_id, slug, title, original_title, summary, search_text,\n  content_origin, preview_kind, status, difficulty, featured, published_at, created_at, updated_at\n) VALUES\n${values(entryRows)}\nON CONFLICT(id) DO UPDATE SET\n  candidate_id = excluded.candidate_id, source_id = excluded.source_id, slug = excluded.slug,\n  title = excluded.title, original_title = excluded.original_title, summary = excluded.summary,\n  search_text = excluded.search_text, content_origin = excluded.content_origin,\n  preview_kind = excluded.preview_kind, status = excluded.status, difficulty = excluded.difficulty,\n  featured = excluded.featured, published_at = excluded.published_at, updated_at = excluded.updated_at;\n\nINSERT INTO codepen_refs (\n  id, animation_entry_id, pen_key, pen_id, creator_slug, canonical_url, embed_url,\n  theme_id, default_tab, active, last_verified_at\n) VALUES\n${values(penRows)}\nON CONFLICT(id) DO UPDATE SET\n  animation_entry_id = excluded.animation_entry_id, pen_key = excluded.pen_key, pen_id = excluded.pen_id,\n  creator_slug = excluded.creator_slug, canonical_url = excluded.canonical_url, embed_url = excluded.embed_url,\n  theme_id = excluded.theme_id, default_tab = excluded.default_tab, active = excluded.active,\n  last_verified_at = excluded.last_verified_at;\n\nINSERT OR REPLACE INTO candidate_tags (candidate_id, tag_id, source, confidence, confirmed) VALUES\n${values(candidateTagRows)};\n\nINSERT OR REPLACE INTO entry_tags (animation_entry_id, tag_id, source, confidence, confirmed) VALUES\n${values(entryTagRows)};\n\nINSERT OR REPLACE INTO validation_runs (\n  id, target_type, target_id, validator, validator_version, subject_fingerprint, result, viewport,\n  failure_codes_json, evidence_json, checked_at, created_at\n) VALUES\n${values(validationRows)};\n\nINSERT OR REPLACE INTO review_decisions (\n  id, target_type, target_id, decision, reason_code, note, changes_json, actor_email_hash, created_at\n) VALUES\n${values(reviewRows)};\n`

writeFileSync(migrationPath, sql)
console.log(`Generated ${path.relative(appRoot, migrationPath)} from ${examples.length} examples.`)
