<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { setPageMeta } from '@/app/pageMeta'
import PreviewCard from '@/features/preview/PreviewCard.vue'
import { createPreviewScheduler } from '@/features/preview/previewScheduler'
import type { DiscoveryPayload } from '@/shared/discovery'
import type { ApiSuccess, ExampleCard, ExamplesPayload } from '@/shared/examples'

const scheduler = createPreviewScheduler(2)
const examples = ref<ExampleCard[]>([])
const discovery = ref<DiscoveryPayload>({ sections: [], patterns: [], collections: [] })
const loading = ref(true)
const error = ref('')

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
    examples.value = ((await exampleResponse.json()) as ApiSuccess<ExamplesPayload>).data.items
    discovery.value = ((await discoveryResponse.json()) as ApiSuccess<DiscoveryPayload>).data
  } catch {
    error.value = '예제를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
})
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
          <span>전체</span><strong>{{ examples.length }}+</strong>
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
      <div v-else class="example-grid home-example-grid" data-testid="home-example-grid">
        <PreviewCard
          v-for="example in examples"
          :key="example.id"
          :example="example"
          :active="scheduler.activeIds.value.includes(example.id)"
          @request="scheduler.request"
          @release="scheduler.release"
        />
      </div>
    </section>
  </main>
</template>
