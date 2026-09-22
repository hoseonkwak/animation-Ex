import process from 'node:process'

import { DeploymentSmokeError, runProductionSmoke } from './preview-smoke.mjs'

const baseUrl = process.env.PRODUCTION_BASE_URL
if (!baseUrl) throw new Error('PRODUCTION_BASE_URL 환경 변수가 필요합니다.')

try {
  process.stdout.write(`${JSON.stringify(await runProductionSmoke(baseUrl), null, 2)}\n`)
} catch (error) {
  if (error instanceof DeploymentSmokeError) {
    process.stderr.write(`${JSON.stringify(error.results, null, 2)}\n`)
  }
  throw error
}
