import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(root, '..', '..')
const [command, environment] = process.argv.slice(2)

if (!['build', 'dry-run', 'deploy'].includes(command ?? '')) {
  throw new Error('명령은 build, dry-run 또는 deploy 중 하나여야 합니다.')
}
if (!['preview', 'production'].includes(environment ?? '')) {
  throw new Error('환경은 preview 또는 production이어야 합니다.')
}

const environmentVariables = { ...process.env, CLOUDFLARE_ENV: environment }

function run(modulePath, args) {
  const result = spawnSync(process.execPath, [path.resolve(workspaceRoot, modulePath), ...args], {
    cwd: root,
    env: environmentVariables,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('node_modules/vue-tsc/bin/vue-tsc.js', ['--noEmit', '-p', 'tsconfig.app.json'])
run('node_modules/typescript/bin/tsc', ['--noEmit', '-p', 'tsconfig.node.json'])
run('node_modules/typescript/bin/tsc', ['--noEmit', '-p', 'tsconfig.worker.json'])
run('node_modules/vite/bin/vite.js', ['build'])

if (command === 'dry-run') {
  run('node_modules/wrangler/bin/wrangler.js', ['deploy', '--dry-run'])
}
if (command === 'deploy') {
  run('node_modules/wrangler/bin/wrangler.js', ['deploy'])
}
