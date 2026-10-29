<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import VirtualExampleRow from './VirtualExampleRow.vue'
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

const root = ref<HTMLElement>()
const scrollTop = ref(0)
const viewportHeight = ref(900)
const viewportWidth = ref(1440)
const gridWidth = ref(960)
const listTop = ref(0)
const measuredHeights = ref<Record<number, number>>({})
let resizeObserver: ResizeObserver | undefined
let animationFrame = 0

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
const offsets = computed(() => {
  const positions = [0]
  for (let index = 0; index < rowCount.value; index += 1) {
    positions.push(
      positions[index]! + (measuredHeights.value[index] ?? estimatedHeight.value) + rowGap.value,
    )
  }
  return positions
})
const visibleRange = computed(() => {
  const positions = offsets.value
  const rows = rowCount.value
  const from = Math.max(0, scrollTop.value - listTop.value - 800)
  const to = Math.max(0, scrollTop.value + viewportHeight.value - listTop.value + 800)
  let low = 0
  let high = rows
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (positions[middle + 1]! <= from) low = middle + 1
    else high = middle
  }
  const start = low
  let end = start
  while (end < rows && positions[end]! < to) end += 1
  return { start, end: Math.min(rows, Math.max(end, start + 4)) }
})
const visibleRows = computed(() => {
  const rows: Array<{ slot: number; index: number; items: ExampleCard[] }> = []
  for (let index = visibleRange.value.start; index < visibleRange.value.end; index += 1) {
    const from = index * effectiveColumns.value
    rows.push({
      slot: index - visibleRange.value.start,
      index,
      items: props.items.slice(from, from + effectiveColumns.value),
    })
  }
  return rows
})
const topHeight = computed(() => offsets.value[visibleRange.value.start] ?? 0)
const bottomHeight = computed(
  () => (offsets.value[rowCount.value] ?? 0) - (offsets.value[visibleRange.value.end] ?? 0),
)

function syncViewport(): void {
  if (!root.value) return
  scrollTop.value = window.scrollY
  viewportHeight.value = window.innerHeight
  viewportWidth.value = window.innerWidth
  gridWidth.value = root.value.clientWidth
  listTop.value = root.value.getBoundingClientRect().top + window.scrollY
}

function scheduleViewportSync(): void {
  if (animationFrame) return
  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = 0
    syncViewport()
  })
}

function onRowHeight(index: number, height: number): void {
  if (height <= 0 || Math.abs((measuredHeights.value[index] ?? 0) - height) < 2) return
  measuredHeights.value = { ...measuredHeights.value, [index]: height }
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
  const loadedBottom = listTop.value + (offsets.value[rowCount.value] ?? 0)
  if (scrollTop.value + viewportHeight.value + 1100 >= loadedBottom) emit('loadMore')
}

function forwardRequest(id: string, priority: boolean): void {
  emit('request', id, priority)
}

function forwardRelease(id: string): void {
  emit('release', id)
}

onMounted(() => {
  syncViewport()
  window.addEventListener('scroll', scheduleViewportSync, { passive: true })
  window.addEventListener('resize', scheduleViewportSync)
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    resizeObserver = new ResizeObserver(scheduleViewportSync)
    resizeObserver.observe(root.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleViewportSync)
  window.removeEventListener('resize', scheduleViewportSync)
  resizeObserver?.disconnect()
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
})

watch(effectiveColumns, () => {
  measuredHeights.value = {}
  void nextTick(syncViewport)
})
watch(
  () => props.items.length,
  () => void nextTick(syncViewport),
)
watch(
  [scrollTop, viewportHeight, listTop, offsets, () => props.hasMore, () => props.loadingMore],
  maybeLoadMore,
  { flush: 'post' },
)
</script>

<template>
  <div ref="root" class="virtual-example-viewport" data-testid="virtual-example-viewport">
    <div class="virtual-example-spacer" :style="{ height: `${topHeight}px` }" aria-hidden="true" />
    <VirtualExampleRow
      v-for="row in visibleRows"
      :key="row.slot"
      :index="row.index"
      :items="row.items"
      :columns="columns"
      :home="home"
      :active-ids="activeIds"
      @height="onRowHeight"
      @request="forwardRequest"
      @release="forwardRelease"
    />
    <div
      class="virtual-example-spacer"
      :style="{ height: `${bottomHeight}px` }"
      aria-hidden="true"
    />
  </div>
</template>
