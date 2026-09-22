<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PreviewCard from '@/features/preview/PreviewCard.vue'
import { createPreviewScheduler } from '@/features/preview/previewScheduler'
import type { ApiSuccess, ExampleCard, ExamplesPayload, TagAxis } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const route = useRoute()
const router = useRouter()
const scheduler = createPreviewScheduler(2)
const examples = ref<ExampleCard[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const errorMessage = ref('')
const nextCursor = ref<string | null>(null)
const searchInput = ref(queryValue('q'))
let requestVersion = 0

onMounted(() =>
  setPageMeta(
    'Explore',
    '기술, 트리거와 적용 영역으로 실행 가능한 웹 애니메이션을 탐색하세요.',
    '/explore',
  ),
)

const filterGroups: Array<{
  axis: TagAxis
  label: string
  options: Array<{ key: string; label: string }>
}> = [
  { axis: 'technology', label: '기술', options: [{ key: 'gsap', label: 'GSAP' }] },
  {
    axis: 'trigger',
    label: '트리거',
    options: [
      { key: 'load', label: '로드' },
      { key: 'hover', label: '호버' },
      { key: 'pointer', label: '포인터' },
      { key: 'drag', label: '드래그' },
      { key: 'scroll', label: '스크롤' },
    ],
  },
  {
    axis: 'motion',
    label: '모션',
    options: [
      { key: 'slide', label: '슬라이드' },
      { key: 'scale', label: '스케일' },
      { key: 'reveal', label: '리빌' },
      { key: 'drag', label: '드래그 이동' },
      { key: 'morph', label: '모핑' },
      { key: 'draw', label: '그리기' },
      { key: 'color', label: '색상 전환' },
    ],
  },
  {
    axis: 'section',
    label: '영역',
    options: [
      { key: 'hero', label: '히어로' },
      { key: 'card', label: '카드' },
      { key: 'gallery', label: '갤러리' },
      { key: 'text', label: '텍스트' },
      { key: 'background', label: '배경' },
    ],
  },
  {
    axis: 'technique',
    label: '기법',
    options: [
      { key: 'timeline', label: '타임라인' },
      { key: 'stagger', label: '스태거' },
      { key: 'scroll-trigger', label: 'ScrollTrigger' },
      { key: 'scroll-smoother', label: 'ScrollSmoother' },
      { key: 'draggable', label: 'Draggable' },
      { key: 'morph-svg', label: 'MorphSVG' },
      { key: 'draw-svg', label: 'DrawSVG' },
    ],
  },
  {
    axis: 'difficulty',
    label: '난이도',
    options: [
      { key: 'beginner', label: '입문' },
      { key: 'intermediate', label: '중급' },
      { key: 'advanced', label: '고급' },
    ],
  },
]

const activeFilterCount = computed(() =>
  filterGroups.reduce((count, group) => count + selectedValues(group.axis).length, 0),
)

watch(
  () => route.fullPath,
  async () => {
    searchInput.value = queryValue('q')
    scheduler.reset()
    await loadExamples(false)
  },
  { immediate: true },
)

function queryValue(name: string): string {
  const value = route.query[name]
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

function selectedValues(axis: TagAxis): string[] {
  return queryValue(axis)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function apiSearchParams(cursor?: string): URLSearchParams {
  const params = new URLSearchParams()
  for (const name of [
    'q',
    'technology',
    'trigger',
    'motion',
    'section',
    'technique',
    'difficulty',
    'sort',
  ]) {
    const value = queryValue(name)
    if (value) params.set(name, value)
  }
  params.set('limit', '12')
  if (cursor) params.set('cursor', cursor)
  return params
}

async function loadExamples(append: boolean): Promise<void> {
  const version = ++requestVersion
  if (append) loadingMore.value = true
  else loading.value = true
  errorMessage.value = ''
  try {
    const cursor = append ? (nextCursor.value ?? undefined) : undefined
    const response = await fetch(`/api/v1/examples?${apiSearchParams(cursor)}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = (await response.json()) as ApiSuccess<ExamplesPayload>
    if (version !== requestVersion) return
    examples.value = append ? [...examples.value, ...body.data.items] : body.data.items
    nextCursor.value = body.data.nextCursor
  } catch {
    if (version !== requestVersion) return
    errorMessage.value = '예제를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    if (version === requestVersion) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

function updateQuery(values: Record<string, string | undefined>): void {
  const query = { ...route.query }
  for (const [key, value] of Object.entries(values)) {
    if (value) query[key] = value
    else delete query[key]
  }
  void router.push({ query })
}

function submitSearch(): void {
  const value = searchInput.value.trim()
  if (value.length === 1) {
    errorMessage.value = '검색어는 두 글자 이상 입력해주세요.'
    return
  }
  updateQuery({ q: value || undefined })
}

function applySuggestedSearch(value: string): void {
  searchInput.value = value
  submitSearch()
}

function toggleFilter(axis: TagAxis, key: string): void {
  const selected = selectedValues(axis)
  const next = selected.includes(key)
    ? selected.filter((value) => value !== key)
    : [...selected, key]
  updateQuery({ [axis]: next.length ? next.join(',') : undefined })
}

function clearFilters(): void {
  const values: Record<string, undefined> = {}
  for (const group of filterGroups) values[group.axis] = undefined
  updateQuery(values)
}
</script>

<template>
  <main id="main-content" class="page explore-page">
    <section class="hero explore-intro">
      <div class="explore-copy">
        <p class="eyebrow">예제 탐색</p>
        <h1>원하는 애니메이션을<br />찾아보세요.</h1>
        <p class="description">
          기술과 적용 영역으로 원하는 예제를 찾고, 썸네일을 눌러 실행 화면을 확인하세요.
        </p>
      </div>
      <form class="hero-search" role="search" @submit.prevent="submitSearch">
        <label for="motion-search">애니메이션 검색</label>
        <div class="search-control">
          <input
            id="motion-search"
            v-model="searchInput"
            type="search"
            placeholder="스크롤할 때 이미지가 펼쳐지는 효과"
          />
          <button type="submit">검색</button>
        </div>
        <div class="suggested-searches" aria-label="추천 검색어">
          <button type="button" @click="applySuggestedSearch('GSAP')">GSAP</button>
          <button type="button" @click="applySuggestedSearch('스크롤')">Scroll Reveal</button>
          <button type="button" @click="applySuggestedSearch('카드')">Interactive Card</button>
        </div>
      </form>
    </section>

    <section class="examples-section" aria-labelledby="examples-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">전체 예제</p>
          <h2 id="examples-heading">실행 가능한 예제</h2>
        </div>
        <div class="result-tools">
          <p aria-live="polite">{{ examples.length }}개의 결과</p>
          <label for="result-sort">정렬</label>
          <select
            id="result-sort"
            :value="queryValue('sort') || 'latest'"
            @change="updateQuery({ sort: ($event.target as HTMLSelectElement).value })"
          >
            <option value="latest">최신순</option>
            <option value="featured">추천순</option>
            <option value="difficulty">난이도순</option>
          </select>
        </div>
      </div>

      <div class="explore-layout">
        <aside class="filter-panel" aria-label="예제 필터">
          <div class="filter-header">
            <strong
              >필터<span v-if="activeFilterCount"> {{ activeFilterCount }}</span></strong
            >
            <button v-if="activeFilterCount" type="button" @click="clearFilters">초기화</button>
          </div>
          <fieldset v-for="group in filterGroups" :key="group.axis">
            <legend>{{ group.label }}</legend>
            <button
              v-for="option in group.options"
              :key="option.key"
              type="button"
              class="filter-chip"
              :class="{ selected: selectedValues(group.axis).includes(option.key) }"
              :aria-pressed="selectedValues(group.axis).includes(option.key)"
              @click="toggleFilter(group.axis, option.key)"
            >
              {{ option.label }}
            </button>
          </fieldset>
        </aside>

        <div class="results-panel">
          <p v-if="loading" class="status-message" role="status">예제를 불러오는 중입니다.</p>
          <div v-else-if="errorMessage" class="status-message error" role="alert">
            <p>{{ errorMessage }}</p>
            <button type="button" @click="loadExamples(false)">다시 시도</button>
          </div>
          <div v-else-if="examples.length === 0" class="status-message empty-state">
            <h3>조건에 맞는 예제가 없습니다.</h3>
            <p>검색어를 바꾸거나 선택한 필터를 초기화해보세요.</p>
            <button type="button" @click="clearFilters">필터 초기화</button>
          </div>
          <div v-else class="example-grid" data-testid="example-grid">
            <PreviewCard
              v-for="example in examples"
              :key="example.id"
              :example="example"
              :active="scheduler.activeIds.value.includes(example.id)"
              @request="scheduler.request"
              @release="scheduler.release"
            />
          </div>
          <button
            v-if="nextCursor"
            type="button"
            class="load-more"
            :disabled="loadingMore"
            @click="loadExamples(true)"
          >
            {{ loadingMore ? '불러오는 중' : '다음 결과 불러오기' }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
