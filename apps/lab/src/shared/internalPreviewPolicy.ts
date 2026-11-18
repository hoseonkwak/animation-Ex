export function internalPreviewPolicy(root: string, origins: string[], inertText = false): string {
  const allowed = origins.filter(
    (value) =>
      /^https:\/\/[^/]+$/.test(value) &&
      !/(^|\.)(codepen\.io|cdpn\.io|codepenusercontent\.com|codepen\.dev|pens\.io)$/.test(
        new URL(value).hostname,
      ),
  )
  const resources = [root, ...allowed].join(' ')
  return [
    "default-src 'none'",
    'sandbox allow-scripts',
    `script-src 'unsafe-inline' ${resources}`,
    `style-src 'unsafe-inline' ${resources}`,
    `img-src data: blob: ${resources}`,
    `font-src ${resources}`,
    `connect-src ${resources}`,
    `media-src ${resources}`,
    `frame-src about: ${root}`,
    `base-uri ${root}`,
    "form-action 'none'",
    "object-src 'none'",
    ...(inertText ? [] : ["frame-ancestors 'self'"]),
  ].join('; ')
}
