import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import path from 'node:path'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const packageCli = (packageName, relativePath) =>
  path.join(path.dirname(require.resolve(`${packageName}/package.json`)), relativePath)
const viteCli = packageCli('vite', 'bin/vite.js')
const playwrightCli = packageCli('@playwright/test', 'cli.js')
const wranglerCli = packageCli('wrangler', 'bin/wrangler.js')
const baseUrl = 'http://127.0.0.1:5173'
const e2eStateDir = mkdtempSync(path.join(tmpdir(), 'kwak-motion-e2e-'))
process.env.KWAK_E2E_STATE_DIR = e2eStateDir

async function runCommand(command, args) {
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(command, [...args, '--persist-to', e2eStateDir], {
      cwd: appRoot,
      env: { ...process.env, WRANGLER_LOG: 'none' },
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })

  if (exitCode !== 0) {
    throw new Error(`명령 실행이 실패했습니다: ${command} ${args.join(' ')}`)
  }
}

await runCommand(process.execPath, [
  wranglerCli,
  'd1',
  'migrations',
  'apply',
  'kwak-motion-lab-local',
  '--local',
])
await runCommand(process.execPath, [
  wranglerCli,
  'd1',
  'execute',
  'kwak-motion-lab-local',
  '--local',
  '--file',
  'db/seeds/wp1.sql',
])
await runCommand(process.execPath, [
  wranglerCli,
  'd1',
  'execute',
  'kwak-motion-lab-local',
  '--local',
  '--file',
  'db/seeds/wp4.sql',
])
await runCommand(process.execPath, [
  wranglerCli,
  'd1',
  'execute',
  'kwak-motion-lab-local',
  '--local',
  '--file',
  'db/seeds/wp5.sql',
])
await runCommand(process.execPath, [
  wranglerCli,
  'd1',
  'execute',
  'kwak-motion-lab-local',
  '--local',
  '--file',
  'db/seeds/wp6.sql',
])
await runCommand(process.execPath, [
  wranglerCli,
  'd1',
  'execute',
  'kwak-motion-lab-local',
  '--local',
  '--file',
  'db/seeds/practice_phase2.sql',
])
await runCommand(process.execPath, [
  wranglerCli,
  'd1',
  'execute',
  'kwak-motion-lab-local',
  '--local',
  '--file',
  'tests/e2e/reset.sql',
])

const server = spawn(
  process.execPath,
  [viteCli, '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
  {
    cwd: appRoot,
    env: {
      ...process.env,
      MINIFLARE_REGISTRY_PATH: path.join(appRoot, '.wrangler/registry-e2e'),
    },
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  },
)

async function waitUntilReady() {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`E2E 개발 서버가 코드 ${server.exitCode}로 종료됐습니다.`)
    }

    try {
      const response = await fetch(`${baseUrl}/api/v1/health`)
      if (response.ok) return
    } catch {
      // 서버가 포트를 열 때까지 다시 시도한다.
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error('E2E 개발 서버가 30초 안에 준비되지 않았습니다.')
}

async function stopServer() {
  if (server.exitCode !== null) return

  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], {
      stdio: 'ignore',
    })

    await Promise.race([
      new Promise((resolve) => killer.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ])
    killer.unref()
    server.unref()
    return
  }

  process.kill(-server.pid, 'SIGTERM')
}

function cleanupE2eState() {
  const resolvedState = path.resolve(e2eStateDir)
  const resolvedTemp = path.resolve(tmpdir())
  if (
    path.dirname(resolvedState) !== resolvedTemp ||
    !path.basename(resolvedState).startsWith('kwak-motion-e2e-')
  ) {
    throw new Error('E2E 임시 상태 경로가 예상한 임시 폴더 밖입니다.')
  }
  rmSync(resolvedState, { recursive: true, force: true, maxRetries: 15, retryDelay: 200 })
}

let exitCode

try {
  await waitUntilReady()

  exitCode = await new Promise((resolve, reject) => {
    const tests = spawn(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
      cwd: appRoot,
      env: process.env,
      stdio: 'inherit',
    })

    tests.once('error', reject)
    tests.once('exit', (code) => resolve(code ?? 1))
  })
} finally {
  await stopServer()
  cleanupE2eState()
}

process.exit(exitCode)
