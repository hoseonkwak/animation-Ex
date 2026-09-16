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
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const requestId = crypto.randomUUID()

    if (request.method === 'GET' && url.pathname === '/api/v1/health') {
      return json({
        data: {
          service: 'kwak-motion-lab',
          status: 'ok',
        },
        meta: { requestId },
      })
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
              error: {
                code: error.code,
                message: error.message,
                fields: error.fields,
                requestId,
              },
            },
            { status: 400 },
          )
        }
        throw error
      }
    }

    const exampleMatch = url.pathname.match(/^\/api\/v1\/examples\/([a-z0-9-]+)$/)
    if (request.method === 'GET' && exampleMatch) {
      const item = await new ExamplesRepository(env.DB).findPublishedBySlug(exampleMatch[1]!)
      if (item) {
        return json(
          { data: item, meta: { requestId } },
          { headers: { 'cache-control': 'public, max-age=60' } },
        )
      }
    }

    return json(
      {
        error: {
          code: 'NOT_FOUND',
          message: '요청한 API를 찾을 수 없습니다.',
          requestId,
        },
      },
      { status: 404 },
    )
  },
} satisfies ExportedHandler<Env>
import { ApiInputError, ExamplesRepository, parseExampleFilters } from './examples'

interface Env {
  DB: D1Database
}
