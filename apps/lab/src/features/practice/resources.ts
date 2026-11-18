export interface PracticeResources {
  scripts: string[]
  styles: string[]
  images: string[]
}

export function resourceUrl(value: string): string {
  const url = new URL(value.trim())
  if (url.protocol !== 'https:' || url.username || url.password || /[\s"'<>]/.test(url.href)) {
    throw new Error('외부 리소스는 HTTPS 주소로 입력해주세요.')
  }
  return url.href
}

export function validPracticeResources(value: unknown): value is PracticeResources {
  if (!value || typeof value !== 'object') return false
  const resources = value as Record<string, unknown>
  return ['scripts', 'styles', 'images'].every((key) => {
    const urls = resources[key]
    if (!Array.isArray(urls) || urls.length > 20) return false
    try {
      return urls.every((url: unknown) => typeof url === 'string' && resourceUrl(url) === url)
    } catch {
      return false
    }
  })
}
