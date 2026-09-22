import { actorEmailHash, AdminApiError, AdminRepository } from './admin'
import { ApiInputError, ExamplesRepository, parseExampleFilters } from './examples'
import {
  authenticateIngestion,
  completeIngestionRun,
  handleIngestionBatch,
  IngestionApiError,
} from './ingestion'
import { acceptSubmission, PublicRepository, SubmissionError } from './public'
import { readUsageStatus, storeUsageSnapshot } from './operations'

interface Env {
  DB: D1Database
  ADMIN_EMAIL?: string
  LOCAL_ADMIN_SIMULATION?: string
  INGESTION_KEY_ID?: string
  INGESTION_HMAC_SECRET?: string
  TURNSTILE_SECRET_KEY?: string
  APP_ENVIRONMENT?: 'local' | 'preview' | 'production'
  INGESTION_PAUSED?: string
}

type RequestHandler = (request: Request, env: Env, requestId: string) => Promise<Response>

function withErrorBoundary(handler: RequestHandler) {
  return async (request: Request, env: Env): Promise<Response> => {
    const requestId = crypto.randomUUID()
    try {
      return await handler(request, env, requestId)
    } catch (error) {
      const url = new URL(request.url)
      console.error({
        event: 'request_error',
        requestId,
        method: request.method,
        path: url.pathname,
        environment: env.APP_ENVIRONMENT ?? 'local',
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      return json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: '요청을 처리하지 못했습니다.',
            requestId,
          },
        },
        { status: 500 },
      )
    }
  }
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
} as const

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  for (const [name, value] of Object.entries(jsonHeaders)) {
    if (!headers.has(name)) headers.set(name, value)
  }
  return Response.json(data, { ...init, headers })
}

export default {
  fetch: withErrorBoundary(async (request, env, requestId): Promise<Response> => {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/api/v1/health') {
      return json({ data: { service: 'kwak-motion-lab', status: 'ok' }, meta: { requestId } })
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/discovery') {
      const data = await new PublicRepository(env.DB).discovery()
      return json(
        { data, meta: { requestId } },
        { headers: { 'cache-control': 'public, max-age=300' } },
      )
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/submissions') {
      try {
        await acceptSubmission(request, env.DB, {
          ...(env.TURNSTILE_SECRET_KEY ? { secret: env.TURNSTILE_SECRET_KEY } : {}),
          localSimulation:
            env.LOCAL_ADMIN_SIMULATION === 'true' &&
            (url.hostname === 'localhost' || url.hostname === '127.0.0.1'),
        })
        return json({ data: { received: true }, meta: { requestId } }, { status: 202 })
      } catch (error) {
        if (error instanceof SubmissionError) {
          return json(
            {
              error: { code: error.code, message: error.message, fields: error.fields, requestId },
            },
            { status: error.status },
          )
        }
        throw error
      }
    }

    if (request.method === 'GET' && url.pathname === '/sitemap.xml') {
      const slugs = await new PublicRepository(env.DB).sitemapSlugs()
      const paths = [
        '/',
        '/explore',
        '/sections',
        '/about',
        ...slugs.sections.map((slug) => `/sections/${slug}`),
        ...slugs.examples.map((slug) => `/examples/${slug}`),
      ]
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${url.origin}${path}</loc></url>`).join('')}</urlset>`
      return new Response(body, {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      })
    }

    if (request.method === 'GET' && url.pathname === '/robots.txt') {
      const preview = env.APP_ENVIRONMENT === 'preview'
      return new Response(
        preview
          ? 'User-agent: *\nDisallow: /\n'
          : `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${url.origin}/sitemap.xml\n`,
        {
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            ...(preview ? { 'x-robots-tag': 'noindex, nofollow' } : {}),
          },
        },
      )
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/examples') {
      try {
        const filters = parseExampleFilters(url)
        const data = await new ExamplesRepository(env.DB).list(filters)
        return json(
          { data, meta: { requestId } },
          { headers: { 'cache-control': 'public, max-age=60' } },
        )
      } catch (error) {
        if (error instanceof ApiInputError) {
          return json(
            {
              error: { code: error.code, message: error.message, fields: error.fields, requestId },
            },
            { status: 400 },
          )
        }
        throw error
      }
    }

    const exampleMatch = url.pathname.match(/^\/api\/v1\/examples\/([a-z0-9-]+)$/)
    if (request.method === 'GET' && exampleMatch) {
      const repository = new ExamplesRepository(env.DB)
      const item = await repository.findPublishedBySlug(exampleMatch[1]!)
      if (item) {
        return json(
          { data: item, meta: { requestId } },
          { headers: { 'cache-control': 'public, max-age=60' } },
        )
      }
      if ((await repository.statusBySlug(exampleMatch[1]!)) === 'unpublished') {
        return json(
          {
            error: {
              code: 'CONTENT_UNPUBLISHED',
              message: '운영 정책에 따라 공개가 중지된 예제입니다.',
              requestId,
            },
          },
          { status: 410 },
        )
      }
    }

    if (request.method === 'POST' && url.pathname.startsWith('/api/v1/ingestion/')) {
      const rawBody = await request.text()
      try {
        const ingestionRequestId = await authenticateIngestion(request, rawBody, env)
        if (url.pathname === '/api/v1/ingestion/usage') {
          try {
            return json({
              data: await storeUsageSnapshot(env.DB, JSON.parse(rawBody)),
              meta: { requestId },
            })
          } catch (error) {
            if (error instanceof SyntaxError || error instanceof TypeError) {
              throw new IngestionApiError(400, 'INVALID_USAGE_SNAPSHOT', error.message)
            }
            throw error
          }
        }
        if (url.pathname === '/api/v1/ingestion/batches') {
          const usage = await readUsageStatus(env.DB)
          if (env.INGESTION_PAUSED === 'true' || usage.level === 'paused') {
            throw new IngestionApiError(
              429,
              'INGESTION_PAUSED_LIMIT',
              '무료 사용량 보호를 위해 수집이 일시 중지되었습니다.',
            )
          }
          const data = await handleIngestionBatch(rawBody, ingestionRequestId, env)
          return json(
            { data, meta: { requestId } },
            { headers: { 'x-ingestion-usage-level': usage.level } },
          )
        }
        const completeMatch = url.pathname.match(/^\/api\/v1\/ingestion\/runs\/([^/]+)\/complete$/)
        if (completeMatch) {
          await completeIngestionRun(rawBody, completeMatch[1]!, env)
          return json({ data: { completed: true }, meta: { requestId } })
        }
      } catch (error) {
        if (error instanceof IngestionApiError) {
          return json(
            { error: { code: error.code, message: error.message, requestId } },
            { status: error.status },
          )
        }
        throw error
      }
    }
    if (url.pathname.startsWith('/api/v1/admin/')) {
      try {
        const email = authenticateAdmin(request, env)
        if (request.method !== 'GET') assertSameOrigin(request, url)
        const actorHash = await actorEmailHash(email)
        const repository = new AdminRepository(env.DB)

        if (request.method === 'GET' && url.pathname === '/api/v1/admin/ingestion-runs') {
          return json({ data: await repository.ingestionRuns(), meta: { requestId } })
        }
        if (request.method === 'GET' && url.pathname === '/api/v1/admin/operations') {
          return json({
            data: {
              environment: env.APP_ENVIRONMENT ?? 'local',
              ingestionPaused: env.INGESTION_PAUSED === 'true',
              usage: await readUsageStatus(env.DB),
            },
            meta: { requestId },
          })
        }
        if (request.method === 'GET' && url.pathname === '/api/v1/admin/candidates') {
          return json({ data: await repository.list(url), meta: { requestId } })
        }

        const candidateMatch = url.pathname.match(/^\/api\/v1\/admin\/candidates\/([^/]+)$/)
        if (candidateMatch && request.method === 'GET') {
          return json({ data: await repository.detail(candidateMatch[1]!), meta: { requestId } })
        }
        if (candidateMatch && request.method === 'PATCH') {
          return json({
            data: await repository.update(candidateMatch[1]!, await request.json()),
            meta: { requestId },
          })
        }

        const actionMatch = url.pathname.match(
          /^\/api\/v1\/admin\/candidates\/([^/]+)\/(preview-checks|approve|decision|reject)$/,
        )
        if (actionMatch && request.method === 'POST') {
          const [, candidateId, action] = actionMatch
          const body = await request.json()
          if (action === 'preview-checks') {
            return json({
              data: await repository.previewCheck(candidateId!, body, actorHash),
              meta: { requestId },
            })
          }
          if (action === 'approve') {
            return json(
              {
                data: await repository.approve(
                  candidateId!,
                  body,
                  request.headers.get('Idempotency-Key') ?? '',
                  actorHash,
                ),
                meta: { requestId },
              },
              { status: 201 },
            )
          }
          const decisionBody =
            action === 'reject' && body && typeof body === 'object'
              ? { ...(body as object), decision: 'reject' }
              : body
          return json({
            data: await repository.decide(candidateId!, decisionBody, actorHash),
            meta: { requestId },
          })
        }

        const unpublishMatch = url.pathname.match(
          /^\/api\/v1\/admin\/examples\/([^/]+)\/unpublish$/,
        )
        if (unpublishMatch && request.method === 'POST') {
          await repository.unpublish(unpublishMatch[1]!, await request.json(), actorHash)
          return json({ data: { unpublished: true }, meta: { requestId } })
        }
      } catch (error) {
        if (error instanceof AdminApiError) {
          return json(
            {
              error: { code: error.code, message: error.message, fields: error.fields, requestId },
            },
            { status: error.status },
          )
        }
        if (error instanceof SyntaxError) {
          return json(
            {
              error: { code: 'INVALID_JSON', message: 'JSON 요청 본문을 확인해주세요.', requestId },
            },
            { status: 400 },
          )
        }
        throw error
      }
    }

    return json(
      { error: { code: 'NOT_FOUND', message: '요청한 API를 찾을 수 없습니다.', requestId } },
      { status: 404 },
    )
  }),
} satisfies ExportedHandler<Env>

function authenticateAdmin(request: Request, env: Env): string {
  const url = new URL(request.url)
  const accessEmail = request.headers.get('Cf-Access-Authenticated-User-Email')
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  const localEmail =
    isLocal && env.LOCAL_ADMIN_SIMULATION === 'true'
      ? request.headers.get('X-Local-Access-Email')
      : null
  const email = accessEmail ?? localEmail
  if (!email) throw new AdminApiError(401, 'ADMIN_AUTH_REQUIRED', '관리자 인증이 필요합니다.')
  if (
    !env.ADMIN_EMAIL ||
    email.toLocaleLowerCase('en-US') !== env.ADMIN_EMAIL.toLocaleLowerCase('en-US')
  ) {
    throw new AdminApiError(403, 'ADMIN_FORBIDDEN', '허용된 관리자 계정이 아닙니다.')
  }
  return email
}

function assertSameOrigin(request: Request, url: URL): void {
  const origin = request.headers.get('Origin')
  if (!origin || origin !== url.origin) {
    throw new AdminApiError(403, 'ORIGIN_FORBIDDEN', '같은 출처의 요청만 허용합니다.')
  }
}
