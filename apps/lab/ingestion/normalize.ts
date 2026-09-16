import type { NormalizedPen } from './types.ts'

export class IngestionParseError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export function normalizeCodePenUrl(raw: string): NormalizedPen {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new IngestionParseError('CODEPEN_URL_INVALID', 'CodePen URL 형식이 올바르지 않습니다.')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.hostname.toLowerCase() !== 'codepen.io') {
    throw new IngestionParseError('CODEPEN_URL_INVALID', 'codepen.io URL만 허용합니다.')
  }
  const match = url.pathname.match(/^\/([^/]+)\/(?:pen|embed)\/([A-Za-z0-9]+)\/?$/)
  if (!match?.[1] || !match[2]) {
    throw new IngestionParseError('CODEPEN_URL_INVALID', 'Pen 또는 embed URL이 아닙니다.')
  }
  const creatorSlug = decodeURIComponent(match[1])
  const penId = match[2]
  return {
    canonicalUrl: `https://codepen.io/${creatorSlug}/pen/${penId}`,
    penKey: `${creatorSlug}/${penId}`,
    creatorSlug,
    penId,
  }
}

export function assertAllowedWsssUrl(raw: string): URL {
  const url = new URL(raw, 'https://wsss.tistory.com')
  if (url.protocol !== 'https:' || url.hostname !== 'wsss.tistory.com') {
    throw new IngestionParseError('SOURCE_URL_FORBIDDEN', 'WSSS HTTPS URL만 요청할 수 있습니다.')
  }
  const allowed =
    /^\/category(?:\/|$)/.test(url.pathname) ||
    /^\/\d+\/?$/.test(url.pathname) ||
    url.pathname === '/robots.txt'
  if (!allowed || /\.(?:zip|png|jpe?g|gif|webp|svg)$/i.test(url.pathname)) {
    throw new IngestionParseError('SOURCE_URL_FORBIDDEN', '허용된 카테고리·게시물 경로가 아닙니다.')
  }
  return url
}
