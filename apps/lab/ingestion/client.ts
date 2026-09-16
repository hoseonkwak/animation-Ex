import type { IngestionCandidate } from './types.ts'

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

export async function signIngestionRequest(
  method: string,
  pathname: string,
  timestamp: string,
  requestId: string,
  body: string,
  secret: string,
): Promise<string> {
  const bodyHash = await sha256(body)
  const canonical = `${method.toUpperCase()}\n${pathname}\n${timestamp}\n${requestId}\n${bodyHash}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical)))
}

export async function sendSignedJson<T>(
  apiBase: string,
  pathname: string,
  bodyValue: unknown,
  credentials: { keyId: string; secret: string },
): Promise<T> {
  const body = JSON.stringify(bodyValue)
  const timestamp = new Date().toISOString()
  const requestId = crypto.randomUUID()
  const signature = await signIngestionRequest(
    'POST',
    pathname,
    timestamp,
    requestId,
    body,
    credentials.secret,
  )
  const response = await fetch(new URL(pathname, apiBase), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Ingestion-Key-Id': credentials.keyId,
      'X-Ingestion-Timestamp': timestamp,
      'X-Ingestion-Request-Id': requestId,
      'X-Ingestion-Signature': signature,
    },
    body,
  })
  const payload = (await response.json()) as T & { error?: { message?: string } }
  if (!response.ok)
    throw new Error(payload.error?.message ?? `Ingestion API HTTP ${response.status}`)
  return payload
}

export interface BatchResponse {
  data: {
    accepted: number
    duplicates: number
    failed: number
    items: Array<{
      externalId: string
      result: 'accepted' | 'duplicate' | 'failed'
      candidateId?: string
      failureCode?: string
    }>
  }
}

export async function submitCandidateBatches(
  apiBase: string,
  runId: string,
  items: IngestionCandidate[],
  checkpointBefore: string | null,
  credentials: { keyId: string; secret: string },
): Promise<BatchResponse['data']> {
  const total: BatchResponse['data'] = { accepted: 0, duplicates: 0, failed: 0, items: [] }
  for (let offset = 0; offset < items.length; offset += 50) {
    const response = await sendSignedJson<BatchResponse>(
      apiBase,
      '/api/v1/ingestion/batches',
      { runId, trigger: 'manual', checkpointBefore, items: items.slice(offset, offset + 50) },
      credentials,
    )
    total.accepted += response.data.accepted
    total.duplicates += response.data.duplicates
    total.failed += response.data.failed
    total.items.push(...response.data.items)
  }
  return total
}
