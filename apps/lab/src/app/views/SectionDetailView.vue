<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import PreviewCard from '@/features/preview/PreviewCard.vue'
import { createPreviewScheduler } from '@/features/preview/previewScheduler'
import type { DiscoveryPayload, SectionSummary } from '@/shared/discovery'
import type { ApiSuccess, ExampleCard, ExamplesPayload } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const route = useRoute()
const scheduler = createPreviewScheduler(2)
const section = ref<SectionSummary | null>(null)
const examples = ref<ExampleCard[]>([])
const loading = ref(true)
const error = ref('')
const key = computed(() => String(route.params.slug ?? ''))

onMounted(async () => {
  try {
    const [discoveryResponse, examplesResponse] = await Promise.all([
      fetch('/api/v1/discovery'),
      fetch(`/api/v1/examples?section=${encodeURIComponent(key.value)}&sort=featured&limit=24`),
    ])
    if (!discoveryResponse.ok || !examplesResponse.ok) throw new Error('load failed')
    const discovery = ((await discoveryResponse.json()) as ApiSuccess<DiscoveryPayload>).data
    section.value = discovery.sections.find((item) => item.key === key.value) ?? null
    examples.value = ((await examplesResponse.json()) as ApiSuccess<ExamplesPayload>).data.items
    if (section.value)
      setPageMeta(`${section.value.label} 애니메이션`, section.value.description, route.path)
    else
      setPageMeta(
        'Section을 찾을 수 없습니다',
        '요청한 적용 영역을 찾을 수 없습니다.',
        route.path,
        false,
      )
  } catch {
    error.value = 'Section 예제를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main id="main-content" class="page listing-page">
    <p v-if="loading" class="status-message">예제를 불러오는 중입니다.</p>
    <div v-else-if="error" class="status-message error">{{ error }}</div>
    <section v-else-if="!section" class="status-page">
      <p class="eyebrow">404 · NOT FOUND</p>
      <h1>Section을 찾을 수 없습니다.</h1>
      <RouterLink class="primary-action" to="/sections">Sections로 이동</RouterLink>
    </section>
    <template v-else>
      <header class="page-header">
        <p class="eyebrow">SECTION · {{ examples.length }} EXAMPLES</p>
        <h1>{{ section.label }}</h1>
        <p class="description">{{ section.description }}</p>
      </header>
      <div class="example-grid" data-testid="section-example-grid">
        <PreviewCard
          v-for="example in examples"
          :key="example.id"
          :example="example"
          :active="scheduler.activeIds.value.includes(example.id)"
          @request="scheduler.request"
          @release="scheduler.release"
        />
      </div>
    </template>
  </main>
</template>
