import type { CodePenPreview } from './examples'

export function previewUrl(preview: CodePenPreview): string {
  return preview.kind === 'internal' ? preview.runtimeUrl : preview.embedUrl
}

export function previewSandbox(preview: CodePenPreview): string {
  return preview.kind === 'internal'
    ? 'allow-scripts'
    : 'allow-scripts allow-same-origin allow-forms allow-popups'
}
