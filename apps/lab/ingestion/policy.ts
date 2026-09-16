import { IngestionParseError, assertAllowedWsssUrl } from './normalize.ts'

export class CollectionStoppedError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export function robotsAllows(robotsText: string, pathname: string): boolean {
  let applies = false
  const disallowed: string[] = []
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue
    const [rawName, ...rest] = line.split(':')
    const name = rawName?.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (name === 'user-agent') applies = value === '*'
    if (applies && name === 'disallow' && value) disallowed.push(value)
  }
  return !disallowed.some((prefix) => pathname.startsWith(prefix))
}

export async function fetchWsss(
  input: string,
  options: {
    fetcher?: typeof fetch
    wait?: (milliseconds: number) => Promise<void>
    retryDelaysMs?: number[]
  } = {},
): Promise<string> {
  const url = assertAllowedWsssUrl(input)
  const fetcher = options.fetcher ?? fetch
  const wait =
    options.wait ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)))
  const retryDelays = options.retryDelaysMs ?? [5_000, 20_000]

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    let response: Response
    try {
      response = await fetcher(url, {
        headers: { 'user-agent': 'KwakMotionLab/0.1 (+manual-ingestion)' },
      })
    } catch (error) {
      if (attempt === retryDelays.length) {
        throw new CollectionStoppedError(
          'ARTICLE_UNAVAILABLE',
          error instanceof Error ? error.message : 'WSSS 요청 실패',
        )
      }
      await wait(retryDelays[attempt]!)
      continue
    }
    if (response.status === 403 || response.status === 429) {
      throw new CollectionStoppedError(
        'SOURCE_RATE_LIMITED',
        `WSSS가 HTTP ${response.status}를 반환했습니다.`,
      )
    }
    if (response.status >= 500) {
      if (attempt === retryDelays.length) {
        throw new CollectionStoppedError(
          'ARTICLE_UNAVAILABLE',
          `WSSS가 HTTP ${response.status}를 반복 반환했습니다.`,
        )
      }
      await wait(retryDelays[attempt]!)
      continue
    }
    if (!response.ok) {
      throw new CollectionStoppedError(
        'ARTICLE_UNAVAILABLE',
        `WSSS가 HTTP ${response.status}를 반환했습니다.`,
      )
    }
    return response.text()
  }
  throw new IngestionParseError('ARTICLE_UNAVAILABLE', '도달할 수 없는 수집 상태입니다.')
}
