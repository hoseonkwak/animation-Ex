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

type CodeTab = keyof PracticeCode
type WorkspaceTab = 'code' | 'preview'
type PreviewStatus = 'idle' | 'running' | 'ready' | 'code-error' | 'timeout'

const route = useRoute()
const draft = ref<PracticeDraft | null>(null)
const title = ref('')
const reference = ref<ExampleDetail | null>(null)
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
const showReference = ref(false)
const referencePreviewLoaded = ref(false)
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
  compactQuery = window.matchMedia('(max-width: 1023px)')
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
  } catch {
    // 작성한 코드는 원본 조회 실패와 관계없이 사용할 수 있다.
  }
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
  if (event.matches && workspaceTab.value === 'code') stopPreview()
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
  frameDocument.value = buildPracticeDocument(runCode, activeRunId, draft.value?.libraries ?? [])
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

function toggleReference(): void {
  showExportCode.value = false
  showReference.value = !showReference.value
  if (!showReference.value) referencePreviewLoaded.value = false
}

function toggleExportCode(): void {
  showReference.value = false
  referencePreviewLoaded.value = false
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
              }}{{
                draft.libraries?.includes('gsap-scrolltrigger@3.15.0') ? ' · ScrollTrigger' : ''
              }}</span
            >
            <h1><input v-model="title" aria-label="연습 이름" @blur="normalizeTitle" /></h1>
          </div>
        </div>
        <div class="practice-actions">
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
          <button v-if="reference" type="button" @click="toggleReference">원본 참고</button>
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
        </div>
      </header>
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
        :style="{
          gridTemplateColumns: `minmax(0, ${editorWidth}fr) 10px minmax(0, ${100 - editorWidth}fr)`,
        }"
      >
        <section class="practice-editor" aria-label="코드 편집기">
          <div class="practice-code-tabs" role="tablist" aria-label="코드 파일">
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
          aria-label="편집기와 실행 화면 폭 조절"
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
      <aside v-if="showReference && reference" class="practice-reference" aria-label="원본 참고">
        <div>
          <h2>원본 참고</h2>
          <button type="button" @click="toggleReference">닫기</button>
        </div>
        <p>{{ reference.title }} · {{ reference.source.creatorName }}</p>
        <p>원본 라이선스: {{ reference.source.licenseCode }}</p>
        <a :href="reference.source.canonicalUrl" target="_blank" rel="noopener noreferrer"
          >원본 CodePen 열기</a
        >
        <a
          v-if="reference.source.licenseEvidenceUrl"
          :href="reference.source.licenseEvidenceUrl"
          target="_blank"
          rel="noopener noreferrer"
          >라이선스 근거</a
        >
        <p v-if="draft.kitVersionId">
          자체 제작 시작 코드 {{ draft.kitVersionId }}을 사용합니다. 원본 Pen 코드는 복사하지
          않았습니다.
        </p>
        <p v-if="draft.kitAuthor && draft.kitLicenseCode">
          시작 코드: {{ draft.kitAuthor }} · {{ draft.kitLicenseCode }}
        </p>
        <p v-if="draft.libraries?.includes('gsap@3.15.0')">
          이 연습에는 내장된 GSAP 3.15.0이 제공됩니다. CodePen으로 보낼 때는 같은 버전의 외부
          스크립트를 추가합니다.
        </p>
        <p v-if="draft.libraries?.includes('gsap-scrolltrigger@3.15.0')">
          ScrollTrigger 플러그인도 내장되어 있으며 CodePen에는 GSAP 코어 다음에 추가됩니다.
        </p>
        <p v-else>원본의 코드는 편집기에 복사하지 않았습니다.</p>
        <button v-if="!referencePreviewLoaded" type="button" @click="referencePreviewLoaded = true">
          원본 실행 화면 보기
        </button>
        <iframe
          v-else
          :title="`${reference.title} 원본 실행 화면`"
          :src="reference.preview.embedUrl"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerpolicy="strict-origin-when-cross-origin"
        />
      </aside>
      <aside
        v-if="showExportCode"
        class="practice-reference practice-export"
        aria-label="코드 복사"
      >
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
