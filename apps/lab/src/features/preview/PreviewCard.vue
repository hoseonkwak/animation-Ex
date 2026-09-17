<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useLibraryLists } from '@/features/library/useLibraryLists'
import type { ExampleCard } from '@/shared/examples'

const props = defineProps<{
  example: ExampleCard
  active: boolean
}>()
const library = useLibraryLists()
const saved = computed(() => library.has('saved', props.example.slug))

const emit = defineEmits<{
  request: [id: string, priority: boolean]
  release: [id: string]
}>()

const root = ref<HTMLElement>()
const frameState = ref<'idle' | 'loading' | 'running' | 'paused' | 'error'>('idle')
const thumbnailFailed = ref(false)
let observer: IntersectionObserver | undefined

const codePenUrl = computed(
  () => props.example.preview.embedUrl.replace('/embed/', '/pen/').split('?')[0],
)
const thumbnailUrl = computed(() => `${codePenUrl.value}/image/large.png`)

watch(
  () => props.active,
  (active) => {
    frameState.value = active ? 'loading' : frameState.value === 'idle' ? 'idle' : 'paused'
  },
  { immediate: true },
)

onMounted(() => {
  if (!root.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry && !entry.isIntersecting && props.active) {
        emit('release', props.example.id)
        frameState.value = 'paused'
      }
    },
    { threshold: 0.05 },
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  emit('release', props.example.id)
})

function run(): void {
  frameState.value = 'loading'
  emit('request', props.example.id, true)
}

function pause(): void {
  emit('release', props.example.id)
  frameState.value = 'paused'
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
      <iframe
        v-if="active"
        :title="`${example.title} CodePen 실행 화면`"
        :src="example.preview.embedUrl"
        allowfullscreen
        data-testid="codepen-preview"
        @load="frameState = 'running'"
        @error="frameState = 'error'"
      />
      <button
        v-else
        class="preview-thumbnail"
        type="button"
        :aria-label="`${example.title} 실행 화면 보기`"
        @click="run"
      >
        <img
          v-if="!thumbnailFailed"
          :src="thumbnailUrl"
          alt=""
          loading="lazy"
          decoding="async"
          @error="thumbnailFailed = true"
        />
        <span v-else class="thumbnail-fallback">{{ example.title }}</span>
        <span class="thumbnail-label">예제 썸네일</span>
        <span class="thumbnail-action"><span aria-hidden="true">▶</span> 실행 화면 보기</span>
      </button>
      <span v-if="active" class="preview-live-badge">● 실제 코드</span>
      <div v-if="active && frameState === 'loading'" class="preview-loading" role="status">
        Preview를 불러오는 중입니다.
      </div>
      <div v-if="frameState === 'error'" class="preview-error" role="alert">
        <p>Preview를 실행하지 못했습니다.</p>
        <button type="button" @click="run">다시 실행</button>
      </div>
      <div class="preview-toolbar">
        <button v-if="active" type="button" @click="pause">일시정지</button>
        <a :href="codePenUrl" target="_blank" rel="noopener noreferrer">CodePen 열기</a>
      </div>
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span>{{ difficultyLabel(example.difficulty) }}</span>
        <span v-if="example.featured">추천</span>
      </div>
      <h3>
        <a :href="`/examples/${example.slug}`">{{ example.title }}</a>
      </h3>
      <p>{{ example.summary }}</p>
      <button
        class="save-button"
        type="button"
        :aria-pressed="saved"
        @click="library.toggle('saved', example.slug)"
      >
        {{ saved ? '저장됨' : '저장' }}
      </button>
      <ul class="tag-list" aria-label="예제 태그">
        <li v-for="tag in Object.values(example.tags).flat()" :key="tag">{{ tag }}</li>
      </ul>
    </div>
  </article>
</template>
