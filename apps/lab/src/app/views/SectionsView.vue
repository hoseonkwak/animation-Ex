<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { DiscoveryPayload } from '@/shared/discovery'
import type { ApiSuccess } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const data = ref<DiscoveryPayload>({ sections: [], patterns: [], collections: [] })
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  setPageMeta(
    'Sections',
    'Hero, Gallery, Text 등 적용 영역별 웹 애니메이션을 탐색하세요.',
    '/sections',
  )
  try {
    const response = await fetch('/api/v1/discovery')
    if (!response.ok) throw new Error('load failed')
    data.value = ((await response.json()) as ApiSuccess<DiscoveryPayload>).data
  } catch {
    error.value = '적용 영역을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main id="main-content" class="page listing-page">
    <header class="page-header">
      <p class="eyebrow">BROWSE BY SECTION</p>
      <h1>어디에 적용할 움직임인가요?</h1>
      <p class="description">페이지의 역할과 위치를 기준으로 실행 가능한 예제를 모았습니다.</p>
    </header>
    <p v-if="loading" class="status-message">Sections를 불러오는 중입니다.</p>
    <p v-else-if="error" class="status-message error">{{ error }}</p>
    <div v-else class="section-card-grid large">
      <RouterLink
        v-for="section in data.sections"
        :key="section.key"
        :to="`/sections/${section.key}`"
        class="section-card"
      >
        <span>{{ section.count }}개 실행 예제</span>
        <h2>{{ section.label }}</h2>
        <p>{{ section.description }}</p>
      </RouterLink>
    </div>
  </main>
</template>
