<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import { setPageMeta } from '@/app/pageMeta'
import { codePenPrefillData, codePenPrefillUrl } from '@/features/practice/codepen'
import { blankCode, getDraft, saveDraft, type PracticeDraft } from '@/features/practice/drafts'
import {
  buildPracticeDocument,
  parsePracticeMessage,
  type PracticeCode,
} from '@/features/practice/runtime'
import type { ApiSuccess, ExampleDetail } from '@/shared/examples'
import type { PracticeLibrary } from '@/shared/practice'
import { resourceUrl, type PracticeResources } from '@/features/practice/resources'

type CodeTab = keyof PracticeCode
type WorkspaceTab = 'reference' | 'code' | 'preview'
type PreviewStatus = 'idle' | 'running' | 'ready' | 'code-error' | 'timeout'

const route = useRoute()
const draft = ref<PracticeDraft | null>(null)
const title = ref('')
const reference = ref<ExampleDetail | null>(null)
const referenceLoading = ref(true)
const resourcesOpen = ref(false)
const resourceKind = ref<keyof PracticeResources>('scripts')
const resourceInput = ref('')
const resourceError = ref('')
const resources = computed<PracticeResources>(
  () => draft.value?.resources ?? { scripts: [], styles: [], images: [] },
)
const pendingResource = computed(() => {
  try {
    const url = resourceUrl(resourceInput.value)
    return { url, domain: new URL(url).host }
  } catch {
    return null
  }
})
const resourceLabels: Record<keyof PracticeResources, string> = {
  scripts: 'JavaScript',
  styles: 'CSS',
  images: '이미지',
}
const detectedResources = computed(() => {
  const template = document.createElement('template')
  template.innerHTML = code.html
  const found: Array<{ kind: keyof PracticeResources; url: string }> = []
  const add = (kind: keyof PracticeResources, value: string | null) => {
    if (!value) return
    try {
      const url = resourceUrl(value)
      if (
        !resources.value[kind].includes(url) &&
        !found.some((item) => item.url === url && item.kind === kind)
      ) {
        found.push({ kind, url })
      }
    } catch {
      /* 상대 주소와 내장 이미지는 외부 URL 추가 대상에서 제외한다. */
    }
  }
  template.content
    .querySelectorAll('img[src], image[href]')
    .forEach((node) => add('images', node.getAttribute('src') ?? node.getAttribute('href')))
  template.content
    .querySelectorAll('script[src]')
    .forEach((node) => add('scripts', node.getAttribute('src')))
  template.content
    .querySelectorAll('link[rel="stylesheet"]')
    .forEach((node) => add('styles', node.getAttribute('href')))
  for (const match of (code.css + '\n' + code.html).matchAll(
    /url\(\s*["']?([^"')\s]+)["']?\s*\)/gi,
  )) {
    add('images', match[1] ?? null)
  }
  return found
})
const libraryPreset = computed(() => {
  const libraries = draft.value?.libraries ?? []
  if (libraries.includes('gsap-scrollsmoother@3.15.0')) return 'smoother'
  if (libraries.includes('gsap-scrolltrigger@3.15.0')) return 'scroll'
  return libraries.includes('gsap@3.15.0') ? 'gsap' : 'none'
})
const referenceCodeUrl = computed(() => {
  if (!reference.value) return ''
  const url = new URL(reference.value.preview.embedUrl)
  url.searchParams.set('default-tab', 'html')
  if (url.pathname.startsWith('/editor/')) url.searchParams.set('preview', 'false')
  return url.href
})
const loading = ref(true)
const error = ref('')
const code = reactive<PracticeCode>({ ...blankCode })
const codeTab = ref<CodeTab>('html')
const workspaceTab = ref<WorkspaceTab>('code')
const compactLayout = ref(false)
const editorWidth = ref(50)
const autoRun = ref(true)
const saveStatus = ref<'saved' | 'saving' | 'error'>('saved')
const previewStatus = ref<PreviewStatus>('idle')
const frame = ref<HTMLIFrameElement | null>(null)
const panels = ref<HTMLElement | null>(null)
const frameKey = ref(0)
const frameDocument = ref('')
const logs = ref<Array<{ type: 'log' | 'warn' | 'error'; message: string }>>([])
const showExportCode = ref(false)
const exportHint = ref(false)
const copiedTab = ref<CodeTab | null>(null)
const showConsole = ref(false)
const lastGoodAvailable = computed(() => Boolean(draft.value?.lastGoodCode))
const recoveryAvailable = computed(() => Boolean(draft.value?.recoveryCode))
const codePenPayload = computed(() =>
  codePenPrefillData(
    snapshot(),
    title.value.trim() || '새 연습',
    reference.value?.source.canonicalUrl,
    draft.value?.kitAuthor && draft.value.kitLicenseCode
      ? { author: draft.value.kitAuthor, licenseCode: draft.value.kitLicenseCode }
      : undefined,
    draft.value?.libraries ?? [],
    resources.value,
  ),
)

let activeRunId = ''
let runCode: PracticeCode = { ...blankCode }
let lastHeartbeat = 0
const environmentFailures = ref(0)
let receivedHeartbeat = false
let saveTimer: ReturnType<typeof setTimeout> | null = null
let runTimer: ReturnType<typeof setTimeout> | null = null
let watchdog: ReturnType<typeof setInterval> | null = null
let stableTimer: ReturnType<typeof setTimeout> | null = null
let saveQueue = Promise.resolve()
let ready = false
let compactQuery: MediaQueryList | null = null
let stopDragging: (() => void) | null = null

const statusLabel = computed(() => {
  if (previewStatus.value === 'running') return '실행 중'
  if (previewStatus.value === 'ready') return '정상 실행'
  if (previewStatus.value === 'code-error') return '코드 오류'
  if (previewStatus.value === 'timeout') return '응답 없음'
  return '실행 대기'
})

function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 화면 설정 저장 실패는 IndexedDB 초안 편집을 막지 않는다.
  }
}

onMounted(async () => {
  window.addEventListener('message', onPreviewMessage)
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('visibilitychange', onVisibilityChange)
  compactQuery = window.matchMedia('(max-width: 639px)')
  compactLayout.value = compactQuery.matches
  compactQuery.addEventListener('change', onCompactChange)
  try {
    const stored = readSetting('kwak-motion:practice-auto-run')
    autoRun.value = stored !== 'off'
    editorWidth.value = Math.min(
      65,
      Math.max(35, Number(readSetting('kwak-motion:practice-editor-width')) || 50),
    )
    document.documentElement.dataset.theme =
      readSetting('kwak-motion:theme') === 'dark' ? 'dark' : 'light'
    const id = String(route.params.id ?? '')
    draft.value = await getDraft(id)
    if (!draft.value) {
      error.value = '이 브라우저에서 연습 초안을 찾을 수 없습니다.'
      return
    }
    Object.assign(code, draft.value.code)
    title.value = draft.value.title
    await nextTick()
    setPageMeta(
      draft.value.title,
      '이 브라우저에 저장되는 자유 연습 공간입니다.',
      route.path,
      false,
    )
    ready = true
    if (draft.value.referenceSlug) void loadReference(draft.value.referenceSlug)
    if (!compactLayout.value) execute()
  } catch {
    error.value =
      '연습 초안을 불러오지 못했습니다. 저장 데이터가 손상됐거나 브라우저 저장을 사용할 수 없습니다. 데이터는 삭제하지 않았습니다.'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onPreviewMessage)
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  compactQuery?.removeEventListener('change', onCompactChange)
  stopDragging?.()
  clearTimers()
  frameDocument.value = ''
})

onBeforeRouteLeave(async () => {
  if (ready && saveStatus.value !== 'saved') await persist()
})

watch(
  () => [code.html, code.css, code.javascript],
  () => {
    if (!ready) return
    saveStatus.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    if (runTimer) clearTimeout(runTimer)
    saveTimer = setTimeout(() => void persist(), 250)
    if (autoRun.value && (!compactLayout.value || workspaceTab.value === 'preview')) {
      runTimer = setTimeout(() => void run(), 800)
    }
  },
)

watch(
  title,
  () => {
    if (!ready) return
    saveStatus.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void persist(), 250)
  },
  { flush: 'sync' },
)

async function loadReference(slug: string): Promise<void> {
  try {
    const response = await fetch(`/api/v1/examples/${encodeURIComponent(slug)}`)
    if (!response.ok) return
    reference.value = ((await response.json()) as ApiSuccess<ExampleDetail>).data
    if (
      draft.value &&
      !draft.value.kitVersionId &&
      !draft.value.librariesConfigured &&
      !draft.value.libraries?.length
    ) {
      const signals = [
        reference.value.slug,
        reference.value.title,
        ...Object.values(reference.value.tags).flat(),
      ].join(' ')
      if (/scroll-?smoother|scrollsmother/i.test(signals)) {
        await configureLibraries('smoother')
      } else if (/gsap/i.test(signals)) {
        await configureLibraries(/scroll/i.test(signals) ? 'scroll' : 'gsap')
      }
    }
  } catch {
    // 작성한 코드는 원본 조회 실패와 관계없이 사용할 수 있다.
  } finally {
    referenceLoading.value = false
  }
}

async function configureLibraries(preset: string): Promise<void> {
  if (!draft.value) return
  const libraries: PracticeLibrary[] = preset === 'none' ? [] : ['gsap@3.15.0']
  if (preset === 'scroll' || preset === 'smoother') libraries.push('gsap-scrolltrigger@3.15.0')
  if (preset === 'smoother') libraries.push('gsap-scrollsmoother@3.15.0')
  draft.value.libraries = libraries
  draft.value.librariesConfigured = true
  saveStatus.value = 'saving'
  if (!(await persist())) return
  if (!compactLayout.value || workspaceTab.value === 'preview') execute()
}

function reviewResource(kind: keyof PracticeResources, url: string): void {
  resourceKind.value = kind
  resourceInput.value = url
  resourceError.value = ''
  resourcesOpen.value = true
}

async function addResource(): Promise<void> {
  if (!draft.value || !pendingResource.value) return
  const kind = resourceKind.value
  const url = pendingResource.value.url
  if (resources.value[kind].includes(url)) {
    resourceError.value = '이미 추가한 주소입니다.'
    return
  }
  if (resources.value[kind].length >= 20) {
    resourceError.value = '종류별로 최대 20개까지 추가할 수 있습니다.'
    return
  }
  draft.value.resources = { ...resources.value, [kind]: [...resources.value[kind], url] }
  resourceInput.value = ''
  resourceError.value = ''
  saveStatus.value = 'saving'
  if (!(await persist())) return
  if (!compactLayout.value || workspaceTab.value === 'preview') execute()
}

async function removeResource(kind: keyof PracticeResources, url: string): Promise<void> {
  if (!draft.value) return
  draft.value.resources = {
    ...resources.value,
    [kind]: resources.value[kind].filter((item) => item !== url),
  }
  saveStatus.value = 'saving'
  if (!(await persist())) return
  if (!compactLayout.value || workspaceTab.value === 'preview') execute()
}

function changeLibraries(event: Event): void {
  void configureLibraries((event.target as HTMLSelectElement).value)
}

function snapshot(): PracticeCode {
  return { html: code.html, css: code.css, javascript: code.javascript }
}

async function persist(): Promise<boolean> {
  if (!draft.value) return false
  const savedCode = snapshot()
  const savedTitle = title.value.trim() || '새 연습'
  const task = saveQueue
    .catch(() => undefined)
    .then(async () => {
      if (!draft.value) return
      const next: PracticeDraft = {
        ...draft.value,
        title: savedTitle,
        code: savedCode,
        updatedAt: new Date().toISOString(),
      }
      await saveDraft(next)
      draft.value = next
    })
  saveQueue = task
  try {
    await task
    if (
      savedTitle === (title.value.trim() || '새 연습') &&
      JSON.stringify(savedCode) === JSON.stringify(snapshot())
    ) {
      saveStatus.value = 'saved'
    }
    return true
  } catch {
    saveStatus.value = 'error'
    autoRun.value = false
    return false
  }
}

async function run(): Promise<void> {
  if (runTimer) clearTimeout(runTimer)
  if (saveTimer) clearTimeout(saveTimer)
  if (compactLayout.value) workspaceTab.value = 'preview'
  if (!(await persist())) return
  execute()
}

function onCodePenSubmit(): void {
  exportHint.value = true
  void persist()
}

function openPreview(): void {
  workspaceTab.value = 'preview'
  if (!frameDocument.value) void run()
}

function onCompactChange(event: MediaQueryListEvent): void {
  compactLayout.value = event.matches
  if (event.matches && workspaceTab.value !== 'preview') stopPreview()
  if (!event.matches && !frameDocument.value && ready) execute()
}

function stopPreview(): void {
  frameDocument.value = ''
  previewStatus.value = 'idle'
  clearExecutionTimers()
}

function openCode(): void {
  workspaceTab.value = 'code'
  if (compactLayout.value) stopPreview()
}

function openReference(): void {
  workspaceTab.value = 'reference'
  if (compactLayout.value) stopPreview()
}

function setEditorWidth(value: number): void {
  editorWidth.value = Math.min(65, Math.max(35, Math.round(value)))
  writeSetting('kwak-motion:practice-editor-width', String(editorWidth.value))
}

function onDividerPointerDown(event: PointerEvent): void {
  if (!panels.value) return
  event.preventDefault()
  const move = (pointer: PointerEvent) => {
    if (!panels.value) return
    const bounds = panels.value.getBoundingClientRect()
    setEditorWidth(((pointer.clientX - bounds.left) / bounds.width) * 100)
  }
  const end = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    stopDragging = null
  }
  stopDragging?.()
  stopDragging = end
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end, { once: true })
}

function onDividerKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowLeft') setEditorWidth(editorWidth.value - 5)
  else if (event.key === 'ArrowRight') setEditorWidth(editorWidth.value + 5)
  else if (event.key === 'Home') setEditorWidth(35)
  else if (event.key === 'End') setEditorWidth(65)
  else return
  event.preventDefault()
}

function execute(): void {
  clearExecutionTimers()
  activeRunId = crypto.randomUUID()
  runCode = snapshot()
  lastHeartbeat = Date.now()
  receivedHeartbeat = false
  logs.value = []
  previewStatus.value = 'running'
  frameDocument.value = buildPracticeDocument(
    runCode,
    activeRunId,
    draft.value?.libraries ?? [],
    resources.value,
  )
  frameKey.value += 1
  watchdog = setInterval(() => {
    if (Date.now() - lastHeartbeat < 5_000) return
    previewStatus.value = 'timeout'
    frameDocument.value = ''
    environmentFailures.value += 1
    if (environmentFailures.value >= 3) {
      autoRun.value = false
      writeSetting('kwak-motion:practice-auto-run', 'off')
    }
    clearExecutionTimers()
  }, 1_000)
}

function onPreviewMessage(event: MessageEvent): void {
  if (event.source !== frame.value?.contentWindow) return
  const message = parsePracticeMessage(event.data, activeRunId)
  if (!message) return
  lastHeartbeat = Date.now()
  if (message.type === 'heartbeat') {
    receivedHeartbeat = true
    return
  }
  if (message.type === 'ready') {
    if (previewStatus.value !== 'code-error') previewStatus.value = 'ready'
    stableTimer = setTimeout(() => void rememberGoodRun(message.runId), 2_000)
    return
  }
  logs.value = [...logs.value.slice(-49), { type: message.type, message: message.message }]
  if (message.type === 'error') {
    previewStatus.value = 'code-error'
    showConsole.value = true
    if (stableTimer) clearTimeout(stableTimer)
  }
}

async function rememberGoodRun(runId: string): Promise<void> {
  if (
    runId !== activeRunId ||
    previewStatus.value !== 'ready' ||
    !receivedHeartbeat ||
    !draft.value
  )
    return
  environmentFailures.value = 0
  const goodCode = { ...runCode }
  const task = saveQueue
    .catch(() => undefined)
    .then(async () => {
      if (!draft.value) return
      const next: PracticeDraft = { ...draft.value, lastGoodCode: goodCode }
      await saveDraft(next)
      draft.value = next
    })
  saveQueue = task
  try {
    await task
  } catch {
    saveStatus.value = 'error'
  }
}

function toggleAutoRun(): void {
  autoRun.value = !autoRun.value
  writeSetting('kwak-motion:practice-auto-run', autoRun.value ? 'on' : 'off')
}

function normalizeTitle(): void {
  if (!title.value.trim()) title.value = '새 연습'
  if (draft.value) {
    setPageMeta(title.value, '이 브라우저에 저장되는 자유 연습 공간입니다.', route.path, false)
  }
}

async function restore(codeToRestore: PracticeCode | null, label: string): Promise<void> {
  if (!codeToRestore || !window.confirm(`${label}로 바꾸시겠어요? 현재 코드는 덮어쓰게 됩니다.`))
    return
  if (!(await persist())) return
  const previousCode = snapshot()
  const task = saveQueue
    .catch(() => undefined)
    .then(async () => {
      if (!draft.value) return
      const next: PracticeDraft = { ...draft.value, recoveryCode: previousCode }
      await saveDraft(next)
      draft.value = next
    })
  saveQueue = task
  try {
    await task
  } catch {
    saveStatus.value = 'error'
    return
  }
  Object.assign(code, codeToRestore)
  void run()
}

function onVisibilityChange(): void {
  if (document.hidden && saveStatus.value !== 'saved') void persist()
}

function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (saveStatus.value === 'saved') return
  event.preventDefault()
  event.returnValue = ''
}

function clearExecutionTimers(): void {
  if (watchdog) clearInterval(watchdog)
  if (stableTimer) clearTimeout(stableTimer)
  watchdog = null
  stableTimer = null
}

function clearTimers(): void {
  if (saveTimer) clearTimeout(saveTimer)
  if (runTimer) clearTimeout(runTimer)
  clearExecutionTimers()
}

function openFullscreen(): void {
  void frame.value?.requestFullscreen()
}

function toggleExportCode(): void {
  showExportCode.value = !showExportCode.value
}

async function copyCode(tab: CodeTab): Promise<void> {
  try {
    await navigator.clipboard.writeText(code[tab])
    copiedTab.value = tab
  } catch {
    copiedTab.value = null
  }
}
</script>

<template>
  <main id="main-content" class="practice-workspace" :class="`workspace-${workspaceTab}`">
    <section v-if="loading" class="practice-loading" role="status">
      연습 공간을 불러오는 중입니다.
    </section>
    <section v-else-if="error" class="practice-loading">
      <h1>연습 공간을 열 수 없습니다.</h1>
      <p>{{ error }}</p>
      <RouterLink to="/practice">연습 목록으로</RouterLink>
    </section>
    <template v-else-if="draft">
      <header class="practice-toolbar">
        <div class="practice-heading">
          <RouterLink to="/practice" aria-label="연습 목록으로">←</RouterLink>
          <div>
            <span
              >자유 연습{{ draft.libraries?.includes('gsap@3.15.0') ? ' · GSAP 3.15.0' : ''
              }}{{ draft.libraries?.includes('gsap-scrolltrigger@3.15.0') ? ' · ScrollTrigger' : ''
              }}{{
                draft.libraries?.includes('gsap-scrollsmoother@3.15.0') ? ' · ScrollSmoother' : ''
              }}</span
            >
            <h1><input v-model="title" aria-label="연습 이름" @blur="normalizeTitle" /></h1>
          </div>
        </div>
        <div class="practice-actions">
          <label class="practice-library-select">
            라이브러리
            <select :value="libraryPreset" @change="changeLibraries">
              <option value="none">사용 안 함</option>
              <option value="gsap">GSAP</option>
              <option value="scroll">GSAP + ScrollTrigger</option>
              <option value="smoother">GSAP + ScrollTrigger + ScrollSmoother</option>
            </select>
          </label>
          <span class="practice-save-status" role="status">
            {{
              saveStatus === 'saved' ? '저장됨' : saveStatus === 'saving' ? '저장 중' : '저장 실패'
            }}
          </span>
          <button type="button" :aria-pressed="autoRun" @click="toggleAutoRun">
            자동 실행 {{ autoRun ? '켜짐' : '꺼짐' }}
          </button>
          <button class="practice-run" type="button" @click="run">Run</button>
          <button type="button" @click="restore(draft.initialCode ?? blankCode, '처음 코드')">
            초기화
          </button>
          <button
            v-if="lastGoodAvailable"
            type="button"
            @click="restore(draft.lastGoodCode, '마지막 정상 코드')"
          >
            정상 코드 복구
          </button>
          <button
            v-if="recoveryAvailable"
            type="button"
            @click="restore(draft.recoveryCode ?? null, '이전 코드')"
          >
            이전 코드 복구
          </button>
          <form
            :action="codePenPrefillUrl"
            method="post"
            target="_blank"
            rel="noopener noreferrer"
            @submit="onCodePenSubmit"
          >
            <input type="hidden" name="data" :value="codePenPayload" />
            <button type="submit">CodePen으로 보내기</button>
          </form>
          <button type="button" @click="toggleExportCode">코드 복사</button>
          <button
            type="button"
            :aria-expanded="resourcesOpen"
            @click="resourcesOpen = !resourcesOpen"
          >
            외부 리소스
          </button>
        </div>
      </header>
      <section v-if="resourcesOpen" class="practice-resources" aria-label="외부 리소스 설정">
        <h2>라이브러리·이미지 추가</h2>
        <p>
          원본 CodePen에서 확인한 JS·CSS·이미지 주소를 입력하세요. JavaScript는 목록 순서대로
          불러옵니다.
        </p>
        <form @submit.prevent="addResource">
          <label
            >종류
            <select v-model="resourceKind">
              <option v-for="(label, kind) in resourceLabels" :key="kind" :value="kind">
                {{ label }}
              </option>
            </select>
          </label>
          <label
            >리소스 URL
            <input v-model="resourceInput" type="url" placeholder="https://" required />
          </label>
          <div v-if="pendingResource" class="practice-resource-review" role="status">
            <strong>도메인 · {{ pendingResource.domain }}</strong>
            <p>{{ pendingResource.url }}</p>
            <p>추가하면 이 주소에 접속합니다. 외부 스크립트는 현재 연습 코드를 읽을 수 있습니다.</p>
          </div>
          <button type="submit" :disabled="!pendingResource">확인한 리소스 추가</button>
        </form>
        <p v-if="resourceInput && !pendingResource">유효한 HTTPS 주소를 입력해주세요.</p>
        <p v-if="resourceError" role="alert">{{ resourceError }}</p>
        <div v-for="(label, kind) in resourceLabels" :key="kind">
          <h3>{{ label }}</h3>
          <p v-if="resources[kind].length === 0">추가한 리소스가 없습니다.</p>
          <ul v-else>
            <li v-for="url in resources[kind]" :key="url">
              <span>{{ url }}</span>
              <button type="button" :aria-label="`${url} 제거`" @click="removeResource(kind, url)">
                제거
              </button>
            </li>
          </ul>
        </div>
      </section>
      <section
        v-if="detectedResources.length"
        class="practice-resource-candidates"
        aria-label="코드에서 발견한 외부 리소스"
      >
        <h2>코드에서 발견한 외부 리소스</h2>
        <p>주소를 확인하고 추가하면 연습 화면에서 사용할 수 있습니다.</p>
        <ul>
          <li v-for="item in detectedResources" :key="item.kind + item.url">
            <span>{{ resourceLabels[item.kind] }} · {{ item.url }}</span>
            <button type="button" @click="reviewResource(item.kind, item.url)">주소 확인</button>
          </li>
        </ul>
      </section>
      <div v-if="exportHint" class="practice-export-hint" role="status">
        <span
          >CodePen 새 창이 열리지 않거나 오류가 보이면 현재 코드를 복사해 직접 붙여넣으세요.</span
        >
        <button type="button" @click="toggleExportCode">복사 가능한 코드 보기</button>
        <button type="button" aria-label="CodePen 안내 닫기" @click="exportHint = false">
          닫기
        </button>
      </div>
      <div v-if="saveStatus === 'error'" class="practice-save-error" role="alert">
        브라우저에 코드를 저장하지 못했습니다. 코드를 복사해 보관한 뒤 다시 시도하거나 저장 없이
        실행하세요.
        <button type="button" @click="persist">다시 저장</button>
        <button type="button" @click="execute">저장 없이 한 번 실행</button>
      </div>
      <div v-if="environmentFailures >= 3" class="practice-save-error" role="alert">
        실행 화면이 연속 3회 응답하지 않아 자동 실행을 껐습니다. 코드는 보존됐습니다. Run을 눌러
        다시 시도하세요.
      </div>
      <div class="practice-mobile-tabs" role="tablist" aria-label="연습 화면">
        <button
          v-if="draft.referenceSlug"
          type="button"
          role="tab"
          :aria-selected="workspaceTab === 'reference'"
          @click="openReference"
        >
          원본
        </button>
        <button type="button" role="tab" :aria-selected="workspaceTab === 'code'" @click="openCode">
          코드
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="workspaceTab === 'preview'"
          @click="openPreview"
        >
          실행 화면
        </button>
      </div>
      <div
        ref="panels"
        class="practice-panels"
        :class="{ 'with-reference': draft.referenceSlug }"
        :style="{
          gridTemplateColumns: `minmax(0, ${editorWidth}fr) 10px minmax(0, ${100 - editorWidth}fr)`,
        }"
      >
        <section v-if="draft.referenceSlug" class="practice-original" aria-label="원본 참고">
          <div class="practice-original-heading">
            <h2>원본 예제</h2>
            <template v-if="reference">
              <a :href="reference.source.canonicalUrl" target="_blank" rel="noopener noreferrer">
                CodePen에서 열기
              </a>
              <p>
                {{ reference.source.creatorName }} ·
                <a
                  v-if="reference.source.licenseEvidenceUrl"
                  :href="reference.source.licenseEvidenceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ reference.source.licenseCode }}</a
                >
                <template v-else>{{ reference.source.licenseCode }}</template>
              </p>
            </template>
          </div>
          <details v-if="reference" class="practice-original-resources">
            <summary>원본 라이브러리 확인</summary>
            <p v-if="reference.tags.technology?.length">
              예제 기술 태그 · {{ reference.tags.technology.join(', ') }}
            </p>
            <p>원본의 외부 JS·CSS 목록과 버전은 아직 확인되지 않았습니다.</p>
            <a :href="reference.source.canonicalUrl" target="_blank" rel="noopener noreferrer">
              원본 CodePen에서 리소스 확인
            </a>
            <p>GSAP은 상단에서 선택하고, 다른 라이브러리와 이미지는 외부 리소스에 추가하세요.</p>
          </details>
          <template v-if="reference && (!compactLayout || workspaceTab === 'reference')">
            <section class="practice-original-pane">
              <h3>원본 코드</h3>
              <iframe
                title="원본 코드"
                :src="referenceCodeUrl"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerpolicy="strict-origin-when-cross-origin"
              />
            </section>
            <section class="practice-original-pane">
              <h3>원본 실행 화면</h3>
              <iframe
                title="원본 실행 화면"
                :src="reference.preview.embedUrl"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerpolicy="strict-origin-when-cross-origin"
              />
            </section>
          </template>
          <p v-else-if="!reference" role="status" class="practice-original-status">
            {{ referenceLoading ? '원본을 불러오는 중입니다.' : '원본을 불러오지 못했습니다.' }}
          </p>
        </section>
        <section class="practice-editor" aria-label="코드 편집기">
          <div class="practice-code-tabs" role="tablist" aria-label="코드 파일">
            <strong v-if="draft.referenceSlug">내 코드</strong>
            <button
              v-for="tab in ['html', 'css', 'javascript'] as const"
              :key="tab"
              type="button"
              role="tab"
              :aria-selected="codeTab === tab"
              @click="codeTab = tab"
            >
              {{ tab === 'javascript' ? 'JS' : tab.toUpperCase() }}
            </button>
          </div>
          <details v-if="draft.kitVersionId" class="practice-kit-info">
            <summary>연습 환경</summary>
            <p>자체 제작 시작 코드 {{ draft.kitVersionId }}</p>
            <p v-if="draft.kitAuthor && draft.kitLicenseCode">
              {{ draft.kitAuthor }} · {{ draft.kitLicenseCode }}
            </p>
            <p v-if="draft.libraries?.includes('gsap@3.15.0')">내장된 GSAP 3.15.0</p>
            <p v-if="draft.libraries?.includes('gsap-scrolltrigger@3.15.0')">
              ScrollTrigger 플러그인도 내장되어 있습니다.
            </p>
          </details>
          <label :for="`practice-${codeTab}`" class="practice-editor-label"
            >{{ codeTab === 'javascript' ? 'JavaScript' : codeTab.toUpperCase() }} 코드</label
          >
          <textarea
            v-if="codeTab === 'html'"
            id="practice-html"
            v-model="code.html"
            spellcheck="false"
            aria-label="HTML 코드"
          />
          <textarea
            v-else-if="codeTab === 'css'"
            id="practice-css"
            v-model="code.css"
            spellcheck="false"
            aria-label="CSS 코드"
          />
          <textarea
            v-else
            id="practice-javascript"
            v-model="code.javascript"
            spellcheck="false"
            aria-label="JavaScript 코드"
          />
        </section>
        <div
          class="practice-divider"
          role="separator"
          :aria-label="
            draft.referenceSlug ? '원본과 내 연습 폭 조절' : '편집기와 실행 화면 폭 조절'
          "
          aria-orientation="vertical"
          :aria-valuenow="editorWidth"
          aria-valuemin="35"
          aria-valuemax="65"
          tabindex="0"
          @pointerdown="onDividerPointerDown"
          @keydown="onDividerKeydown"
        />
        <section class="practice-result" aria-label="내 실행 화면">
          <div class="practice-result-heading">
            <div>
              <strong>내 실행 화면</strong
              ><span :class="`status-${previewStatus}`">{{ statusLabel }}</span>
            </div>
            <button type="button" @click="openFullscreen">전체 화면</button>
          </div>
          <div class="practice-frame-wrap">
            <iframe
              v-if="frameDocument"
              :key="frameKey"
              ref="frame"
              title="내 코드 실행 화면"
              :srcdoc="frameDocument"
              sandbox="allow-scripts"
              referrerpolicy="no-referrer"
              allow="fullscreen"
            />
            <p v-else>Run을 눌러 다시 실행하세요.</p>
          </div>
          <div class="practice-console">
            <button type="button" :aria-expanded="showConsole" @click="showConsole = !showConsole">
              Console {{ logs.length }}
            </button>
            <div v-if="showConsole" class="practice-console-content" role="log">
              <p v-if="logs.length === 0">출력된 메시지가 없습니다.</p>
              <p v-for="(entry, index) in logs" :key="index" :class="`console-${entry.type}`">
                {{ entry.message }}
              </p>
            </div>
          </div>
        </section>
      </div>
      <aside v-if="showExportCode" class="practice-export" aria-label="코드 복사">
        <div>
          <h2>현재 코드 복사</h2>
          <button type="button" @click="showExportCode = false">닫기</button>
        </div>
        <p>CodePen 새 창이 열리지 않으면 아래 코드를 직접 복사할 수 있습니다.</p>
        <div v-for="tab in ['html', 'css', 'javascript'] as const" :key="tab">
          <label :for="`practice-copy-${tab}`">{{
            tab === 'javascript' ? 'JS' : tab.toUpperCase()
          }}</label>
          <button type="button" @click="copyCode(tab)">
            {{ copiedTab === tab ? '복사됨' : '복사' }}
          </button>
          <textarea :id="`practice-copy-${tab}`" readonly :value="code[tab]" />
        </div>
      </aside>
      <p class="practice-local-note">
        코드는 이 브라우저에만 저장됩니다. 브라우저 데이터를 삭제하면 사라질 수 있습니다.
        <strong>CodePen으로 보내기</strong>를 누르면 현재 코드가 CodePen으로 전송됩니다.
      </p>
    </template>
  </main>
</template>
