import gsapSource from 'gsap/dist/gsap.min.js?raw'
import scrollTriggerSource from 'gsap/dist/ScrollTrigger.min.js?raw'
import scrollSmootherSource from 'gsap/dist/ScrollSmoother.min.js?raw'
import type { PracticeLibrary } from '@/shared/practice'
import { validPracticeResources, type PracticeResources } from './resources'

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
  resources: PracticeResources = { scripts: [], styles: [], images: [] },
): string {
  if (!validPracticeResources(resources)) throw new Error('외부 리소스 설정이 올바르지 않습니다.')
  const policy = contentPolicy
    .replace(
      "script-src 'unsafe-inline'",
      ["script-src 'unsafe-inline'", ...resources.scripts].join(' '),
    )
    .replace(
      "style-src 'unsafe-inline'",
      ["style-src 'unsafe-inline'", ...resources.styles].join(' '),
    )
    .replace('img-src data: blob:', ['img-src data: blob:', ...resources.images].join(' '))
  const payload = JSON.stringify({
    ...code,
    runId,
    gsapSource: libraries.includes('gsap@3.15.0') ? gsapSource : null,
    scrollTriggerSource: libraries.includes('gsap-scrolltrigger@3.15.0')
      ? scrollTriggerSource
      : null,
    scrollSmootherSource: libraries.includes('gsap-scrollsmoother@3.15.0')
      ? scrollSmootherSource
      : null,
    resources,
  }).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${policy}">
<meta name="referrer" content="no-referrer">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<script>
(async () => {
  const data = ${payload};
  const send = (type, message) => parent.postMessage({ source: 'kwak-practice', runId: data.runId, type, message }, '*');
  const text = (value) => {
    if (value instanceof Error) return value.message.slice(0, 500);
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
  addEventListener('error', (event) => {
    const detail = event.error instanceof Error ? event.error.message : event.message;
    send('error', detail === 'Script error.'
      ? 'JavaScript 문법 또는 실행 오류가 발생했습니다. 코드를 확인해 주세요.'
      : detail || '실행 오류');
  });
  addEventListener('unhandledrejection', (event) => send('error', text(event.reason)));
  const style = document.createElement('style');
  style.textContent = data.css;
  document.head.append(style);
  document.body.innerHTML = data.html;
  for (const image of document.images) {
    image.addEventListener('error', () => send('warn', '이미지를 불러오지 못했습니다. 외부 리소스에 주소를 추가했는지 확인하세요: ' + image.src.slice(0, 300)));
  }
  if (data.gsapSource) {
    const library = document.createElement('script');
    library.textContent = data.gsapSource;
    document.body.append(library);
  }
  if (data.scrollTriggerSource) {
    const plugin = document.createElement('script');
    plugin.textContent = data.scrollTriggerSource;
    document.body.append(plugin);
  }
  if (data.scrollSmootherSource) {
    const plugin = document.createElement('script');
    plugin.textContent = data.scrollSmootherSource;
    document.body.append(plugin);
  }
  const loadResource = (url, type) => new Promise((resolve, reject) => {
    const element = document.createElement(type === 'script' ? 'script' : 'link');
    if (type === 'script') element.src = url;
    else { element.rel = 'stylesheet'; element.href = url; }
    const timer = setTimeout(() => { element.remove(); reject(new Error('리소스 로드 시간 초과: ' + url)); }, 10000);
    element.onload = () => { clearTimeout(timer); resolve(); };
    element.onerror = () => { clearTimeout(timer); reject(new Error('리소스를 불러오지 못했습니다: ' + url)); };
    document.head.append(element);
  });
  const resourceHeartbeat = setInterval(() => send('heartbeat'), 1000);
  try {
    await Promise.all(data.resources.styles.map(url => loadResource(url, 'style')));
    for (const url of data.resources.scripts) await loadResource(url, 'script');
  } catch (error) {
    send('error', text(error));
    send('ready');
    setInterval(() => send('heartbeat'), 1000);
    return;
  } finally {
    clearInterval(resourceHeartbeat);
  }
  const script = document.createElement('script');
  script.textContent = [
    'try {',
    data.javascript,
    '} catch (error) { console.error(error instanceof Error ? error.message : String(error)) }'
  ].join(String.fromCharCode(10));
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
