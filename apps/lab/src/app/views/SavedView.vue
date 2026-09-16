<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { useLibraryLists, type LibraryList } from '@/features/library/useLibraryLists'
import type { ApiSuccess, ExampleDetail } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

interface ResolvedItem {
  slug: string
  savedAt: string
  detail: ExampleDetail | null
  unavailable: boolean
}
const library = useLibraryLists()
const activeTab = ref<LibraryList>('saved')
const items = ref<ResolvedItem[]>([])
const loading = ref(false)
const sourceItems = computed(() => library.state[activeTab.value])

onMounted(() => {
  setPageMeta(
    'Saved',
    '이 브라우저에 저장한 예제와 나중에 연습할 예제를 확인하세요.',
    '/saved',
    false,
  )
})
watch([activeTab, sourceItems], load, { immediate: true, deep: true })

async function load(): Promise<void> {
  loading.value = true
  const list = [...sourceItems.value].sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  items.value = await Promise.all(
    list.map(async (stored) => {
      try {
        const response = await fetch(`/api/v1/examples/${encodeURIComponent(stored.slug)}`)
        if (!response.ok) return { ...stored, detail: null, unavailable: true }
        return {
          ...stored,
          detail: ((await response.json()) as ApiSuccess<ExampleDetail>).data,
          unavailable: false,
        }
      } catch {
        return { ...stored, detail: null, unavailable: true }
      }
    }),
  )
  loading.value = false
}
</script>

<template>
  <main id="main-content" class="page listing-page saved-page">
    <header class="page-header">
      <p class="eyebrow">YOUR LIBRARY</p>
      <h1>저장한 목록</h1>
      <p class="description">로그인 없이 현재 브라우저에 저장됩니다.</p>
    </header>
    <div class="tab-list" role="tablist" aria-label="저장 목록">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'saved'"
        @click="activeTab = 'saved'"
      >
        저장한 예제 {{ library.state.saved.length }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'practiceLater'"
        @click="activeTab = 'practiceLater'"
      >
        나중에 연습 {{ library.state.practiceLater.length }}
      </button>
    </div>
    <p v-if="loading" class="status-message">목록을 확인하는 중입니다.</p>
    <section v-else-if="items.length === 0" class="status-message empty-state">
      <h2>아직 저장한 예제가 없습니다.</h2>
      <p>Explore 또는 Section에서 마음에 드는 움직임을 저장해보세요.</p>
      <div class="hero-actions">
        <RouterLink class="primary-action" to="/explore">Explore</RouterLink
        ><RouterLink class="secondary-action" to="/sections">Sections</RouterLink>
      </div>
    </section>
    <div v-else class="saved-grid">
      <article
        v-for="item in items"
        :key="item.slug"
        class="saved-card"
        :class="{ unavailable: item.unavailable }"
      >
        <template v-if="item.detail"
          ><p class="eyebrow">{{ item.detail.difficulty }}</p>
          <h2>
            <RouterLink :to="`/examples/${item.slug}`">{{ item.detail.title }}</RouterLink>
          </h2>
          <p>{{ item.detail.summary }}</p></template
        >
        <template v-else
          ><p class="eyebrow">UNAVAILABLE</p>
          <h2>현재 이용할 수 없음</h2>
          <p>공개가 중지됐거나 원본 상태를 확인할 수 없습니다.</p></template
        >
        <button type="button" @click="library.remove(activeTab, item.slug)">목록에서 제거</button>
      </article>
    </div>
  </main>
</template>
