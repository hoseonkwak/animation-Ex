<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { setPageMeta } from '@/app/pageMeta'
import VirtualExampleGrid from '@/features/preview/VirtualExampleGrid.vue'
import { createPreviewScheduler } from '@/features/preview/previewScheduler'
import type { DiscoveryPayload } from '@/shared/discovery'
import type { ApiSuccess, ExampleCard, ExamplesPayload } from '@/shared/examples'

const scheduler = createPreviewScheduler(2)
const examples = ref<ExampleCard[]>([])
const discovery = ref<DiscoveryPayload>({
  totalCount: 0,
  sections: [],
  patterns: [],
  collections: [],
})
const loading = ref(true)
const error = ref('')
const nextCursor = ref<string | null>(null)
const loadingMore = ref(false)
const loadMoreError = ref('')

onMounted(async () => {
  setPageMeta(
    'Kwak Motion Lab',
    '카테고리별로 웹 애니메이션 예제를 찾고 실제 코드 실행 화면으로 확인하세요.',
    '/',
  )

  try {
    const [exampleResponse, discoveryResponse] = await Promise.all([
      fetch('/api/v1/examples?sort=featured&limit=12'),
      fetch('/api/v1/discovery'),
    ])
    if (!exampleResponse.ok || !discoveryResponse.ok) throw new Error('load failed')
    const page = ((await exampleResponse.json()) as ApiSuccess<ExamplesPayload>).data
    examples.value = page.items
    nextCursor.value = page.nextCursor
    discovery.value = ((await discoveryResponse.json()) as ApiSuccess<DiscoveryPayload>).data
  } catch {
    error.value = '예제를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
})

async function loadMore(): Promise<void> {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  loadMoreError.value = ''
  try {
    const params = new URLSearchParams({ sort: 'featured', limit: '12', cursor: nextCursor.value })
    const response = await fetch(`/api/v1/examples?${params}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const page = ((await response.json()) as ApiSuccess<ExamplesPayload>).data
    examples.value = [...examples.value, ...page.items]
    nextCursor.value = page.nextCursor
  } catch {
    loadMoreError.value = '다음 예제를 불러오지 못했습니다.'
  } finally {
    loadingMore.value = false
  }
}
</script>

<template>
  <main id="main-content" class="page liquid-home">
    <header class="home-title">
      <h1>웹 애니메이션 예제</h1>
      <p>카테고리를 고르고, 썸네일을 눌러 실제 코드 실행 화면을 확인할 수 있어요.</p>
    </header>

    <section class="category-browser" aria-labelledby="category-title">
      <div class="home-section-heading">
        <h2 id="category-title">카테고리</h2>
        <RouterLink to="/sections">전체 보기</RouterLink>
      </div>
      <nav class="category-list" aria-label="애니메이션 카테고리">
        <RouterLink class="category-pill category-pill-all" to="/explore">
          <span>전체</span><strong>{{ discovery.totalCount }}</strong>
        </RouterLink>
        <RouterLink
          v-for="section in discovery.sections"
          :key="section.key"
          class="category-pill"
          :to="{ path: '/explore', query: { section: section.key } }"
        >
          <span>{{ section.label }}</span
          ><strong>{{ section.count }}</strong>
        </RouterLink>
      </nav>
    </section>

    <section class="home-examples" aria-labelledby="examples-title">
      <div class="home-section-heading">
        <div>
          <h2 id="examples-title">예제</h2>
          <p>원하는 예제를 누르면 그 자리에서 실행됩니다.</p>
        </div>
        <RouterLink to="/explore">모든 예제 보기</RouterLink>
      </div>

      <p v-if="loading" class="status-message">예제를 불러오는 중입니다.</p>
      <div v-else-if="error" class="status-message error" role="alert">{{ error }}</div>
      <template v-else>
        <VirtualExampleGrid
          :items="examples"
          :active-ids="scheduler.activeIds.value"
          :has-more="Boolean(nextCursor)"
          :loading-more="loadingMore"
          :load-error="loadMoreError"
          home
          auto-load
          @load-more="loadMore"
          @request="scheduler.request"
          @release="scheduler.release"
        />
        <div v-if="loadMoreError" class="feed-error" role="alert">
          {{ loadMoreError }}
          <button type="button" @click="loadMore">다시 시도</button>
        </div>
      </template>
    </section>
  </main>
</template>
