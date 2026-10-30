<script setup lang="ts">
import { useWindowVirtualizer } from '@tanstack/vue-virtual'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import PreviewCard from './PreviewCard.vue'
import type { ExampleCard } from '@/shared/examples'

const props = withDefaults(
  defineProps<{
    items: ExampleCard[]
    columns?: 2 | 3 | 4
    home?: boolean
    autoLoad?: boolean
    activeIds: readonly string[]
    hasMore: boolean
    loadingMore: boolean
    loadError?: string
  }>(),
  { columns: 3, home: false, autoLoad: false, loadError: '' },
)

const emit = defineEmits<{
  loadMore: []
  request: [id: string, priority: boolean]
  release: [id: string]
}>()

const root = ref<HTMLElement | null>(null)
const viewportWidth = ref(1440)
const gridWidth = ref(960)
const scrollMargin = ref(0)

const effectiveColumns = computed(() => {
  if (props.home) {
    if (viewportWidth.value <= 767) return 1
    return viewportWidth.value <= 1023 ? 2 : 3
  }
  if (viewportWidth.value <= 639) return 1
  if (viewportWidth.value <= 767) return 2
  return props.columns
})
const rowGap = computed(() => (props.home ? 22 : 20))
const rowCount = computed(() => Math.ceil(props.items.length / effectiveColumns.value))
const estimatedHeight = computed(() => {
  const cardWidth = Math.max(
    160,
    (gridWidth.value - rowGap.value * (effectiveColumns.value - 1)) / effectiveColumns.value,
  )
  return Math.ceil(cardWidth * 0.625 + (props.home ? 155 : 245))
})

const virtualizer = useWindowVirtualizer<HTMLElement>(
  computed(() => ({
    count: rowCount.value,
    estimateSize: () => estimatedHeight.value,
    gap: rowGap.value,
    overscan: 8,
    scrollMargin: scrollMargin.value,
  })),
)
const visibleRows = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

function syncLayout(): void {
  if (!root.value) return
  viewportWidth.value = window.innerWidth
  gridWidth.value = root.value.clientWidth
  scrollMargin.value = root.value.getBoundingClientRect().top + window.scrollY
}

function measureRow(element: Element | ComponentPublicInstance | null): void {
  if (element instanceof HTMLElement) virtualizer.value.measureElement(element)
}

function maybeLoadMore(): void {
  if (
    !props.autoLoad ||
    !props.items.length ||
    !props.hasMore ||
    props.loadingMore ||
    props.loadError
  )
    return

  const loadedBottom = scrollMargin.value + totalSize.value
  if (window.scrollY + window.innerHeight + 1100 >= loadedBottom) emit('loadMore')
}

function forwardRequest(id: string, priority: boolean): void {
  emit('request', id, priority)
}

function forwardRelease(id: string): void {
  emit('release', id)
}

onMounted(() => {
  syncLayout()
  window.addEventListener('resize', syncLayout)
  void nextTick(maybeLoadMore)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncLayout)
})

watch(effectiveColumns, () => {
  void nextTick(() => virtualizer.value.measure())
})
watch(
  [visibleRows, totalSize, () => props.hasMore, () => props.loadingMore, () => props.loadError],
  maybeLoadMore,
  { flush: 'post' },
)
</script>

<template>
  <div
    ref="root"
    class="virtual-example-viewport"
    tabindex="-1"
    aria-label="예제 목록"
    data-testid="virtual-example-viewport"
    :style="{ height: `${totalSize}px`, position: 'relative' }"
  >
    <div
      v-for="(row, slotIndex) in visibleRows"
      :key="slotIndex"
      :ref="measureRow"
      class="example-grid virtual-example-row"
      :class="{ 'home-example-grid': home }"
      :data-index="row.index"
      :data-row-index="row.index"
      :data-grid-columns="home ? undefined : columns"
      :data-testid="row.index === 0 ? (home ? 'home-example-grid' : 'example-grid') : undefined"
      :style="{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${row.start - scrollMargin}px)`,
      }"
    >
      <PreviewCard
        v-for="(example, cardSlot) in items.slice(
          row.index * effectiveColumns,
          (row.index + 1) * effectiveColumns,
        )"
        :key="cardSlot"
        :example="example"
        :active="activeIds.includes(example.id)"
        @request="forwardRequest"
        @release="forwardRelease"
      />
    </div>
  </div>
</template>
