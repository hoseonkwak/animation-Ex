import gsapSource from 'gsap/dist/gsap.min.js?raw'
import type { PracticeLibrary } from '@/shared/practice'

export interface PracticeCode {
  html: string
  css: string
  javascript: string
}

export type PracticeMessage =
  | { type: 'ready'; runId: string }
  | { type: 'heartbeat'; runId: string }
  | { type: 'log' | 'warn' | 'error'; runId: string; message: string }

const contentPolicy = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  "connect-src 'none'",
  "font-src 'none'",
  "media-src 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ')

export function buildPracticeDocument(
  code: PracticeCode,
  runId: string,
  libraries: PracticeLibrary[] = [],
): string {
  const payload = JSON.stringify({
    ...code,
    runId,
    gsapSource: libraries.includes('gsap@3.15.0') ? gsapSource : null,
  }).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${contentPolicy}">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<script>
(() => {
  const data = ${payload};
  const send = (type, message) => parent.postMessage({ source: 'kwak-practice', runId: data.runId, type, message }, '*');
  const text = (value) => {
    try { return typeof value === 'string' ? value.slice(0, 500) : JSON.stringify(value).slice(0, 500); }
    catch { return String(value).slice(0, 500); }
  };
  for (const level of ['log', 'warn', 'error']) {
    const original = console[level].bind(console);
    console[level] = (...values) => {
      send(level, values.map(text).join(' '));
      original(...values);
    };
  }
  addEventListener('error', (event) => send('error', event.message || '실행 오류'));
  addEventListener('unhandledrejection', (event) => send('error', text(event.reason)));
  const style = document.createElement('style');
  style.textContent = data.css;
  document.head.append(style);
  document.body.innerHTML = data.html;
  if (data.gsapSource) {
    const library = document.createElement('script');
    library.textContent = data.gsapSource;
    document.body.append(library);
  }
  const script = document.createElement('script');
  script.textContent = data.javascript;
  document.body.append(script);
  send('ready');
  setInterval(() => send('heartbeat'), 1000);
})();
</script>
</body>
</html>`
}

export function parsePracticeMessage(value: unknown, runId: string): PracticeMessage | null {
  if (typeof value !== 'object' || value === null) return null
  const message = value as Record<string, unknown>
  if (message.source !== 'kwak-practice' || message.runId !== runId) return null
  if (message.type === 'ready' || message.type === 'heartbeat') {
    return { type: message.type, runId }
  }
  if (
    (message.type === 'log' || message.type === 'warn' || message.type === 'error') &&
    typeof message.message === 'string'
  ) {
    return { type: message.type, runId, message: message.message.slice(0, 500) }
  }
  return null
}
