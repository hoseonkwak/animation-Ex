export interface CodePenUrlParts {
  canonicalUrl: string
  penKey: string
  creatorSlug: string
  penId: string
}

export function parseCodePenUrl(raw: string): CodePenUrlParts | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.hostname.toLowerCase() !== 'codepen.io') {
    return null
  }
  const match = url.pathname.match(
    /^\/((?:team\/)?[A-Za-z0-9_-]+|editor\/[A-Za-z0-9_-]+)\/(?:pen|embed)\/([A-Za-z0-9]+|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/?$/i,
  )
  if (!match?.[1] || !match[2]) return null
  const creatorSlug = match[1]
  const penId = match[2]
  if (
    creatorSlug.startsWith('editor/') &&
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(penId)
  ) {
    return null
  }
  return {
    canonicalUrl: `https://codepen.io/${creatorSlug}/pen/${penId}`,
    penKey: `${creatorSlug}/${penId}`,
    creatorSlug,
    penId,
  }
}
