import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

export class DeploymentSmokeError extends Error {
  constructor(results) {
    const failed = results.filter((result) => result.status === 'fail')
    super(`배포 smoke test 실패: ${failed.map((result) => result.name).join(', ')}`)
    this.results = results
  }
}

export { DeploymentSmokeError as PreviewSmokeError }

function previewUrl(value) {
  const url = new URL(value)
  const local = ['localhost', '127.0.0.1'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new TypeError('원격 Preview URL은 HTTPS여야 합니다.')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new TypeError('Preview URL에는 인증 정보, query 또는 hash를 넣을 수 없습니다.')
  }
  url.pathname = '/'
  return url
}

async function json(response) {
  try {
    return await response.json()
  } catch {
    throw new Error(`JSON 응답이 아닙니다. HTTP ${response.status}`)
  }
}

function errorDetail(error) {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause
  return cause instanceof Error ? `${error.message}: ${cause.message}` : error.message
}

async function runDeploymentSmoke(baseUrl, environment, options = {}) {
  const origin = previewUrl(baseUrl)
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const results = []

  async function check(name, pathname, validate, init = {}) {
    try {
      const response = await fetchImpl(new URL(pathname, origin), {
        redirect: 'manual',
        signal: globalThis.AbortSignal.timeout(10_000),
        ...init,
      })
      const detail = await validate(response)
      results.push({ name, status: 'pass', detail })
    } catch (error) {
      results.push({
        name,
        status: 'fail',
        detail: errorDetail(error),
      })
    }
  }

  await check('health', '/api/v1/health', async (response) => {
    const body = await json(response)
    if (response.status !== 200 || body?.data?.status !== 'ok') {
      throw new Error(`서비스 상태 오류: HTTP ${response.status}`)
    }
    return 'Worker health 정상'
  })

  await check('published examples', '/api/v1/examples?limit=1', async (response) => {
    const body = await json(response)
    const items = body?.data?.items
    if (response.status !== 200 || !Array.isArray(items) || items.length === 0) {
      throw new Error(`공개 예제 조회 실패: HTTP ${response.status}`)
    }
    return `공개 예제 ${items.length}개 확인`
  })

  await check(`${environment} robots`, '/robots.txt', async (response) => {
    const body = await response.text()
    const header = response.headers.get('x-robots-tag')
    if (environment === 'preview') {
      if (response.status !== 200 || !body.includes('Disallow: /')) {
        throw new Error('robots.txt가 Preview 전체 색인을 차단하지 않습니다.')
      }
      if (header !== 'noindex, nofollow') {
        throw new Error('X-Robots-Tag가 noindex, nofollow가 아닙니다.')
      }
      return 'robots.txt와 X-Robots-Tag 차단 확인'
    }
    const sitemap = `Sitemap: ${new URL('/sitemap.xml', origin).toString()}`
    if (
      response.status !== 200 ||
      !body.includes('Allow: /') ||
      !body.includes('Disallow: /admin/') ||
      !body.includes(sitemap)
    ) {
      throw new Error('robots.txt가 공개 경로와 관리자 차단 정책을 반영하지 않습니다.')
    }
    if (header) throw new Error('Production 응답에 X-Robots-Tag 차단이 남아 있습니다.')
    return '공개 색인, 관리자 경로 차단과 sitemap 확인'
  })

  await check('public home', '/', async (response) => {
    const contentType = response.headers.get('content-type') ?? ''
    if (response.status !== 200 || !contentType.includes('text/html')) {
      throw new Error(`공개 홈 응답 오류: HTTP ${response.status}`)
    }
    return '비로그인 홈 접근 확인'
  })

  await check('admin blocked', '/api/v1/admin/operations', async (response) => {
    if (![301, 302, 303, 307, 308, 401, 403].includes(response.status)) {
      throw new Error(`비인증 관리자 API가 차단되지 않았습니다. HTTP ${response.status}`)
    }
    return `비인증 요청 차단 확인: HTTP ${response.status}`
  })

  if (results.some((result) => result.status === 'fail')) {
    throw new DeploymentSmokeError(results)
  }
  return results
}

export function runPreviewSmoke(baseUrl, options = {}) {
  return runDeploymentSmoke(baseUrl, 'preview', options)
}

export function runProductionSmoke(baseUrl, options = {}) {
  return runDeploymentSmoke(baseUrl, 'production', options)
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isCli) {
  const baseUrl = process.env.PREVIEW_BASE_URL
  if (!baseUrl) throw new Error('PREVIEW_BASE_URL 환경 변수가 필요합니다.')
  try {
    process.stdout.write(`${JSON.stringify(await runPreviewSmoke(baseUrl), null, 2)}\n`)
  } catch (error) {
    if (error instanceof DeploymentSmokeError) {
      process.stderr.write(`${JSON.stringify(error.results, null, 2)}\n`)
    }
    throw error
  }
}
