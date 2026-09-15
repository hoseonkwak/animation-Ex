const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
} as const

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)

  for (const [name, value] of Object.entries(jsonHeaders)) {
    headers.set(name, value)
  }

  return Response.json(data, { ...init, headers })
}

export default {
  async fetch(request): Promise<Response> {
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
} satisfies ExportedHandler
