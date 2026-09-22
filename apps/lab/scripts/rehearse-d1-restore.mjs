import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(root, '..', '..')
const wrangler = path.resolve(workspaceRoot, 'node_modules/wrangler/bin/wrangler.js')
const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), 'kwak-motion-d1-restore-'))
const exportPath = path.join(temporaryRoot, 'local-export.sql')
const restoreStatePath = path.join(temporaryRoot, 'restore-state')
const restoreConfigPath = path.join(temporaryRoot, 'wrangler.restore.json')
const restoreDatabase = 'kwak-motion-lab-restore-rehearsal'

function run(args, capture = false) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
    stdio: capture ? 'pipe' : 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    if (capture && result.stderr) process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }
  return result.stdout ?? ''
}

function parseWranglerJson(output) {
  const start = output.indexOf('[')
  const end = output.lastIndexOf(']')
  if (start < 0 || end < start) throw new Error('Wrangler JSON 결과를 찾지 못했습니다.')
  return JSON.parse(output.slice(start, end + 1))
}

try {
  run(['d1', 'export', 'kwak-motion-lab-local', '--local', '--output', exportPath])

  writeFileSync(
    restoreConfigPath,
    JSON.stringify({
      name: 'kwak-motion-lab-restore-rehearsal',
      main: path.join(root, 'server/index.ts'),
      compatibility_date: '2026-09-15',
      d1_databases: [
        {
          binding: 'DB',
          database_name: restoreDatabase,
          database_id: '00000000-0000-0000-0000-000000000099',
        },
      ],
    }),
  )

  run(
    [
      'd1',
      'execute',
      restoreDatabase,
      '--config',
      restoreConfigPath,
      '--local',
      '--persist-to',
      restoreStatePath,
      '--file',
      exportPath,
      '--yes',
    ],
    true,
  )

  const query = `SELECT
    (SELECT COUNT(*) FROM animation_entries WHERE status = 'published') AS published_entries,
    (SELECT COUNT(*) FROM sources) AS sources,
    (SELECT COUNT(*) FROM tags) AS tags,
    (SELECT COUNT(*) FROM ingestion_runs) AS ingestion_runs`
  const output = run(
    [
      'd1',
      'execute',
      restoreDatabase,
      '--config',
      restoreConfigPath,
      '--local',
      '--persist-to',
      restoreStatePath,
      '--command',
      query,
      '--json',
    ],
    true,
  )
  const response = parseWranglerJson(output)
  const counts = response[0]?.results?.[0]
  if (!counts || counts.published_entries < 15 || counts.sources < 15 || counts.tags < 1) {
    throw new Error(`복구 결과가 완료 조건을 충족하지 않습니다: ${JSON.stringify(counts)}`)
  }

  const exported = readFileSync(exportPath)
  process.stdout.write(
    `${JSON.stringify(
      {
        status: 'passed',
        sourceDatabase: 'kwak-motion-lab-local',
        restoredDatabase: restoreDatabase,
        exportSha256: createHash('sha256').update(exported).digest('hex'),
        counts,
      },
      null,
      2,
    )}\n`,
  )
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true })
}
