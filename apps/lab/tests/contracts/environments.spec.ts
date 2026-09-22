// @vitest-environment node

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function readWranglerConfig() {
  const source = readFileSync(path.resolve('wrangler.jsonc'), 'utf8')
  return JSON.parse(source.replace(/,\s*([}\]])/g, '$1')) as {
    d1_databases: Array<{ database_name: string }>
    env: Record<
      'preview' | 'production',
      {
        name: string
        vars: Record<string, string>
        d1_databases: Array<{ database_name: string }>
      }
    >
  }
}

describe('P1-OPS-11 deployment environment isolation', () => {
  it('local, preview와 production이 서로 다른 Worker와 D1을 사용한다', () => {
    const config = readWranglerConfig()
    const databaseNames = [
      config.d1_databases[0]?.database_name,
      config.env.preview.d1_databases[0]?.database_name,
      config.env.production.d1_databases[0]?.database_name,
    ]
    expect(new Set(databaseNames).size).toBe(3)
    expect(config.env.preview.name).not.toBe(config.env.production.name)
    expect(config.env.preview.vars.APP_ENVIRONMENT).toBe('preview')
    expect(config.env.production.vars.APP_ENVIRONMENT).toBe('production')
    expect(config.env.preview.vars.LOCAL_ADMIN_SIMULATION).toBe('false')
    expect(config.env.production.vars.LOCAL_ADMIN_SIMULATION).toBe('false')
  })
})
