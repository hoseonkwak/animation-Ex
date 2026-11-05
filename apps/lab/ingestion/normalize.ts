import type { NormalizedPen } from './types.ts'
import { parseCodePenUrl } from '../src/shared/codepenUrl.ts'

export class IngestionParseError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export function normalizeCodePenUrl(raw: string): NormalizedPen {
  const pen = parseCodePenUrl(raw)
  if (!pen)
    throw new IngestionParseError('CODEPEN_URL_INVALID', 'CodePen Pen URL이 올바르지 않습니다.')
  return pen
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
