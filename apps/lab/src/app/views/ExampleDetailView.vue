<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import PreviewCard from '@/features/preview/PreviewCard.vue'
import { useLibraryLists } from '@/features/library/useLibraryLists'
import { createPreviewScheduler } from '@/features/preview/previewScheduler'
import type { ApiSuccess, ExampleCard, ExampleDetail, ExamplesPayload } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const route = useRoute()
const library = useLibraryLists()
const scheduler = createPreviewScheduler(2)
const item = ref<ExampleDetail | null>(null)
const related = ref<ExampleCard[]>([])
const loading = ref(true)
const status = ref<404 | 410 | null>(null)
const error = ref('')
const frameKey = ref(0)
const frame = ref<HTMLIFrameElement>()
const slug = computed(() => String(route.params.slug ?? ''))
const saved = computed(() => library.has('saved', slug.value))
const practiceLater = computed(() => library.has('practiceLater', slug.value))

onMounted(load)

async function load(): Promise<void> {
  try {
    const response = await fetch(`/api/v1/examples/${encodeURIComponent(slug.value)}`)
    if (response.status === 410) {
      status.value = 410
      setPageMeta('공개가 중지된 예제', '현재 이용할 수 없는 예제입니다.', route.path, false)
      return
    }
    if (response.status === 404) {
      status.value = 404
      setPageMeta('예제를 찾을 수 없습니다', '요청한 예제를 찾을 수 없습니다.', route.path, false)
      return
    }
    if (!response.ok) throw new Error('load failed')
    item.value = ((await response.json()) as ApiSuccess<ExampleDetail>).data
    setPageMeta(item.value.title, item.value.summary, route.path)
    const section = item.value.tags.section?.[0]
    if (section) {
      const relatedResponse = await fetch(`/api/v1/examples?section=${section}&limit=4`)
      if (relatedResponse.ok) {
        related.value = ((await relatedResponse.json()) as ApiSuccess<ExamplesPayload>).data.items
          .filter((entry) => entry.id !== item.value?.id)
          .slice(0, 3)
      }
    }
  } catch {
    error.value = '예제를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function difficultyLabel(value: ExampleDetail['difficulty']): string {
  return { beginner: '입문', intermediate: '중급', advanced: '고급' }[value]
}

function openFullscreen(): void {
  void frame.value?.requestFullscreen()
}
</script>

<template>
  <main id="main-content" class="page detail-page">
    <p v-if="loading" class="status-message">예제를 불러오는 중입니다.</p>
    <section v-else-if="status === 410" class="status-page">
      <p class="eyebrow">410 · UNAVAILABLE</p>
      <h1>현재 이용할 수 없는 예제입니다.</h1>
      <p>운영 정책 또는 원본 상태 변경으로 공개가 중지됐습니다.</p>
      <RouterLink class="primary-action" to="/explore">Explore로 이동</RouterLink>
    </section>
    <section v-else-if="status === 404" class="status-page">
      <p class="eyebrow">404 · NOT FOUND</p>
      <h1>예제를 찾을 수 없습니다.</h1>
      <RouterLink class="primary-action" to="/explore">Explore로 이동</RouterLink>
    </section>
    <div v-else-if="error" class="status-message error">
      <p>{{ error }}</p>
      <button type="button" @click="load">다시 시도</button>
    </div>
    <template v-else-if="item">
      <nav class="breadcrumb" aria-label="현재 위치">
        <RouterLink to="/explore">Explore</RouterLink><span>/</span><span>{{ item.title }}</span>
      </nav>
      <header class="detail-header">
        <div>
          <p class="eyebrow">LIVE CODE EXAMPLE</p>
          <h1>{{ item.title }}</h1>
          <p class="description">{{ item.summary }}</p>
        </div>
        <div class="detail-actions">
          <button type="button" :aria-pressed="saved" @click="library.toggle('saved', slug)">
            {{ saved ? '저장됨' : '저장' }}
          </button>
          <button
            type="button"
            :aria-pressed="practiceLater"
            @click="library.toggle('practiceLater', slug)"
          >
            {{ practiceLater ? '연습 목록에 추가됨' : '나중에 연습' }}
          </button>
        </div>
      </header>
      <ul class="tag-list detail-tags">
        <li>{{ difficultyLabel(item.difficulty) }}</li>
        <li v-for="tag in Object.values(item.tags).flat()" :key="tag">{{ tag }}</li>
      </ul>

      <section class="detail-preview" aria-labelledby="preview-title">
        <div class="block-heading">
          <h2 id="preview-title">실행 화면</h2>
          <div class="preview-actions">
            <button type="button" @click="frameKey++">다시 실행</button
            ><button type="button" @click="openFullscreen">전체 화면</button
            ><a :href="item.source.canonicalUrl" target="_blank" rel="noopener noreferrer"
              >CodePen에서 열기</a
            >
          </div>
        </div>
        <div class="detail-frame">
          <iframe
            :key="frameKey"
            ref="frame"
            :title="`${item.title} CodePen 실행 화면`"
            :src="item.preview.embedUrl"
            allowfullscreen
          />
        </div>
      </section>

      <div class="detail-columns">
        <section>
          <p class="eyebrow">OVERVIEW</p>
          <h2>이 예제에서 볼 점</h2>
          <p>{{ item.summary }}</p>
          <p v-if="item.tags.trigger?.length">트리거: {{ item.tags.trigger.join(', ') }}</p>
          <p v-if="item.tags.technique?.length">기법: {{ item.tags.technique.join(', ') }}</p>
          <p v-if="item.patterns.length">
            관련 Pattern: {{ item.patterns.map((pattern) => pattern.title).join(', ') }}
          </p>
        </section>
        <section class="source-panel">
          <p class="eyebrow">SOURCE & LICENSE</p>
          <h2>출처</h2>
          <p v-if="item.originalTitle">원본 제목: {{ item.originalTitle }}</p>
          <p>Created by {{ item.source.creatorName }}</p>
          <p>{{ item.source.licenseCode }} 라이선스 정보는 원본 링크에서 확인할 수 있습니다.</p>
          <a :href="item.source.licenseEvidenceUrl" target="_blank" rel="noopener noreferrer"
            >원본과 라이선스 확인</a
          >
        </section>
      </div>

      <section v-if="related.length" class="content-block">
        <div class="block-heading"><h2>관련 예제</h2></div>
        <div class="example-grid related-grid">
          <PreviewCard
            v-for="example in related"
            :key="example.id"
            :example="example"
            :active="scheduler.activeIds.value.includes(example.id)"
            @request="scheduler.request"
            @release="scheduler.release"
          />
        </div>
      </section>
    </template>
  </main>
</template>
