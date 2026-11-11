<script lang="ts">
const openDialogs = new Set<HTMLDialogElement>()
let previousBodyOverflow = ''

function lockScroll(element: HTMLDialogElement): void {
  if (openDialogs.size === 0) previousBodyOverflow = document.body.style.overflow
  openDialogs.add(element)
  document.body.style.overflow = 'hidden'
}

function unlockScroll(element: HTMLDialogElement): void {
  if (!openDialogs.has(element)) return
  openDialogs.delete(element)
  if (openDialogs.size === 0) document.body.style.overflow = previousBodyOverflow
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useLibraryLists } from '@/features/library/useLibraryLists'
import type { ExampleCard } from '@/shared/examples'

const props = defineProps<{
  example: ExampleCard
  active: boolean
  practice?: boolean
}>()
const library = useLibraryLists()
const saved = computed(() => library.has('saved', props.example.slug))
const visibleTags = computed(() => [...new Set(Object.values(props.example.tags).flat())])

const emit = defineEmits<{
  request: [id: string, priority: boolean]
  release: [id: string]
}>()

const root = ref<HTMLElement>()
const dialog = ref<HTMLDialogElement>()
const closeButton = ref<HTMLButtonElement>()
const frameState = ref<'idle' | 'loading' | 'running' | 'paused' | 'error'>('idle')
const frameKey = ref(0)
const thumbnailFailed = ref(false)
const thumbnailFromCodePen = ref(false)
let trigger: HTMLElement | null = null
const codePenUrl = computed(
  () => props.example.preview.embedUrl.replace('/embed/', '/pen/').split('?')[0],
)
const thumbnailUrl = computed(() =>
  props.practice && !thumbnailFromCodePen.value
    ? `/practice-thumbnails/${props.example.slug}.png`
    : `${codePenUrl.value}/image/large.png`,
)

function onThumbnailError(): void {
  if (props.practice && !thumbnailFromCodePen.value) {
    thumbnailFromCodePen.value = true
    return
  }
  thumbnailFailed.value = true
}

watch(
  () => props.active,
  async (active) => {
    frameState.value = active ? 'loading' : frameState.value === 'idle' ? 'idle' : 'paused'
    await nextTick()
    if (active !== props.active) return
    const element = dialog.value
    if (!element) return
    if (active && !element.open) {
      lockScroll(element)
      if (typeof element.showModal === 'function') element.showModal()
      else element.setAttribute('open', '')
      closeButton.value?.focus()
    } else if (!active && element.open) {
      if (typeof element.close === 'function') element.close()
      else element.removeAttribute('open')
      unlockScroll(element)
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  },
  { immediate: true, flush: 'post' },
)

watch(
  () => props.example.id,
  (id, previousId) => {
    if (id === previousId) return
    if (root.value?.contains(document.activeElement)) {
      root.value.closest<HTMLElement>('.virtual-example-viewport')?.focus({ preventScroll: true })
    }
    emit('release', previousId)
    frameState.value = props.active ? 'loading' : 'idle'
    frameKey.value = 0
    thumbnailFailed.value = false
    thumbnailFromCodePen.value = false
  },
)

onBeforeUnmount(() => {
  if (dialog.value) unlockScroll(dialog.value)
  emit('release', props.example.id)
})

function run(event: MouseEvent): void {
  trigger = event.currentTarget as HTMLElement
  frameState.value = 'loading'
  emit('request', props.example.id, true)
}

function closePreview(): void {
  emit('release', props.example.id)
  frameState.value = 'paused'
}

function retry(): void {
  frameState.value = 'loading'
  frameKey.value += 1
}

function onDialogClick(event: MouseEvent): void {
  if (event.target === dialog.value) closePreview()
}

function difficultyLabel(difficulty: ExampleCard['difficulty']): string {
  return { beginner: '입문', intermediate: '중급', advanced: '고급' }[difficulty]
}
</script>

<template>
  <article
    ref="root"
    class="example-card"
    :data-example-id="example.id"
    :data-preview-state="frameState"
  >
    <div class="preview-frame">
      <button
        class="preview-thumbnail"
        type="button"
        :aria-label="`${example.title} 미리보기`"
        @click="run"
      >
        <img
          v-if="!thumbnailFailed"
          :src="thumbnailUrl"
          alt=""
          loading="lazy"
          decoding="async"
          @error="onThumbnailError"
        />
        <span v-else class="thumbnail-fallback">{{ example.title }}</span>
        <span class="thumbnail-label">예제 썸네일</span>
        <span class="thumbnail-action"><span aria-hidden="true">⤢</span> 미리보기</span>
      </button>
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span>{{ difficultyLabel(example.difficulty) }}</span>
        <span v-if="example.featured">추천</span>
        <span v-if="!example.runtimeVerified">실행 미확인</span>
      </div>
      <h3>
        <a :href="`/examples/${example.slug}`">{{ example.title }}</a>
      </h3>
      <p>{{ example.summary }}</p>
      <RouterLink
        v-if="practice"
        class="practice-card-action"
        :to="{ path: '/practice/new', query: { reference: example.slug } }"
        >시작 코드로 연습하기</RouterLink
      >
      <button
        v-if="!practice"
        class="save-button"
        type="button"
        :aria-pressed="saved"
        @click="library.toggle('saved', example.slug)"
      >
        {{ saved ? '저장됨' : '저장' }}
      </button>
      <ul class="tag-list" aria-label="예제 태그">
        <li v-for="tag in visibleTags" :key="tag">{{ tag }}</li>
      </ul>
    </div>
  </article>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="preview-modal"
      :aria-label="`${example.title} 미리보기`"
      @cancel.prevent="closePreview"
      @click="onDialogClick"
    >
      <div class="preview-modal-content">
        <header class="preview-modal-header">
          <div class="preview-modal-heading">
            <span>실제 코드 미리보기</span>
            <h2>{{ example.title }}</h2>
          </div>
          <div class="preview-modal-actions">
            <a :href="`/examples/${example.slug}`">상세 보기</a>
            <a :href="`/examples/${example.slug}#report-example`">문제 신고</a>
            <a :href="codePenUrl" target="_blank" rel="noopener noreferrer">CodePen 열기</a>
            <button
              ref="closeButton"
              type="button"
              aria-label="미리보기 닫기"
              @click="closePreview"
            >
              닫기
            </button>
          </div>
        </header>
        <div class="preview-modal-stage">
          <iframe
            v-if="active"
            :key="frameKey"
            :title="`${example.title} CodePen 실행 화면`"
            :src="example.preview.embedUrl"
            allow="fullscreen"
            allowfullscreen
            data-testid="codepen-preview"
            referrerpolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            @load="frameState = 'running'"
            @error="frameState = 'error'"
          />
          <div v-if="active && frameState === 'loading'" class="preview-loading" role="status">
            실행 화면을 불러오는 중입니다.
          </div>
          <div v-if="active && frameState === 'error'" class="preview-error" role="alert">
            <p>미리보기를 실행하지 못했습니다.</p>
            <button type="button" @click="retry">다시 시도</button>
          </div>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>
