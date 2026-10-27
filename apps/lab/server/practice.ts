import type { PracticeKitPayload } from '../src/shared/practice'

interface PracticeKitRow {
  kit_id: string
  version_id: string
  version: number
  html: string
  css: string
  javascript: string
  external_scripts_json: string
  external_styles_json: string
  assets_json: string
  interaction_instructions: string
  runtime_policy_json: string
  provenance_json: string
  license_code: string
}

export async function findReadyPracticeKit(
  db: D1Database,
  slug: string,
): Promise<PracticeKitPayload | null> {
  const row = await db
    .prepare(
      `SELECT k.id AS kit_id, p.id AS version_id, p.version,
              p.html, p.css, p.javascript, p.external_scripts_json,
              p.external_styles_json, p.assets_json, p.interaction_instructions,
              p.runtime_policy_json, p.provenance_json, p.license_code
       FROM practice_kits k
       JOIN animation_entries e ON e.id = k.animation_entry_id
       JOIN code_package_versions p
         ON p.id = k.starter_code_package_version_id
        AND p.animation_entry_id = e.id
       WHERE e.slug = ? AND e.status = 'published' AND k.status = 'ready'`,
    )
    .bind(slug)
    .first<PracticeKitRow>()
  if (!row) return null

  const scripts = JSON.parse(row.external_scripts_json) as unknown
  const styles = JSON.parse(row.external_styles_json) as unknown
  const assets = JSON.parse(row.assets_json) as unknown
  const policy = JSON.parse(row.runtime_policy_json) as Record<string, unknown>
  const provenance = JSON.parse(row.provenance_json) as Record<string, unknown>
  if (
    !Array.isArray(scripts) ||
    scripts.length > 0 ||
    !Array.isArray(styles) ||
    styles.length > 0 ||
    !Array.isArray(assets) ||
    assets.length > 0 ||
    policy.sandbox !== 'allow-scripts' ||
    policy.network !== 'blocked' ||
    provenance.basis !== 'independent-reimplementation' ||
    provenance.sourceCodeCopied !== false ||
    typeof provenance.author !== 'string' ||
    !row.license_code
  ) {
    throw new Error(`Practice Kit ${row.kit_id} violates the public runtime or rights policy`)
  }

  return {
    kitId: row.kit_id,
    versionId: row.version_id,
    version: row.version,
    code: { html: row.html, css: row.css, javascript: row.javascript },
    interactionInstructions: row.interaction_instructions,
    provenance: {
      basis: 'independent-reimplementation',
      author: provenance.author,
      licenseCode: row.license_code,
    },
  }
}
