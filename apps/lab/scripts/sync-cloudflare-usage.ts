import process from 'node:process'

import { ingestionSignature } from '../server/ingestion.ts'
import {
  cloudflareUsageQuery,
  parseCloudflareUsage,
  usageQueryVariables,
} from './cloudflare-usage.ts'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} 환경 변수가 필요합니다.`)
  return value
}

const date = process.env.USAGE_DATE || new Date().toISOString().slice(0, 10)
const accountTag = required('CLOUDFLARE_ACCOUNT_ID')
const databaseId = required('CLOUDFLARE_D1_DATABASE_ID')
const scriptName = required('CLOUDFLARE_WORKER_SCRIPT_NAME')
const apiToken = required('CLOUDFLARE_ANALYTICS_API_TOKEN')
const ingestionApiUrl = new URL(required('INGESTION_API_URL'))
const keyId = required('INGESTION_KEY_ID')
const secret = required('INGESTION_HMAC_SECRET')

const analyticsResponse = await fetch('https://api.cloudflare.com/client/v4/graphql', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${apiToken}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    query: cloudflareUsageQuery,
    variables: usageQueryVariables(date, accountTag, databaseId, scriptName),
  }),
})
if (!analyticsResponse.ok) {
  throw new Error(`Cloudflare Analytics 요청 실패: HTTP ${analyticsResponse.status}`)
}
const snapshot = parseCloudflareUsage(date, await analyticsResponse.json())
const endpoint = new URL('/api/v1/ingestion/usage', ingestionApiUrl)
const body = JSON.stringify(snapshot)
const timestamp = new Date().toISOString()
const requestId = crypto.randomUUID()
const { signature } = await ingestionSignature(
  'POST',
  endpoint.pathname,
  timestamp,
  requestId,
  body,
  secret,
)
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'X-Ingestion-Key-Id': keyId,
    'X-Ingestion-Timestamp': timestamp,
    'X-Ingestion-Request-Id': requestId,
    'X-Ingestion-Signature': signature,
  },
  body,
})
const result = await response.json()
if (!response.ok) {
  throw new Error(`사용량 저장 실패: HTTP ${response.status} ${JSON.stringify(result)}`)
}
process.stdout.write(`${JSON.stringify({ snapshot, result }, null, 2)}\n`)
