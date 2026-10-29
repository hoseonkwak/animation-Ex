<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import PreviewCard from './PreviewCard.vue'
import type { ExampleCard } from '@/shared/examples'

const props = defineProps<{
  index: number
  items: ExampleCard[]
  columns: number
  home: boolean
  activeIds: readonly string[]
}>()

const emit = defineEmits<{
  height: [index: number, height: number]
  request: [id: string, priority: boolean]
  release: [id: string]
}>()

const root = ref<HTMLElement>()
let observer: ResizeObserver | undefined

function measure(): void {
  if (root.value) emit('height', props.index, Math.ceil(root.value.getBoundingClientRect().height))
}

onMounted(() => {
  if (!root.value) return
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(root.value)
  }
})

watch(
  () => props.index,
  () => void nextTick(measure),
  { flush: 'post' },
)

onBeforeUnmount(() => observer?.disconnect())

function forwardRequest(id: string, priority: boolean): void {
  emit('request', id, priority)
}

function forwardRelease(id: string): void {
  emit('release', id)
}
</script>

<template>
  <div
    ref="root"
    class="example-grid virtual-example-row"
    :class="{ 'home-example-grid': home }"
    :data-grid-columns="home ? undefined : columns"
    :data-row-index="index"
    :data-testid="index === 0 ? (home ? 'home-example-grid' : 'example-grid') : undefined"
  >
    <PreviewCard
      v-for="example in items"
      :key="example.id"
      :example="example"
      :active="activeIds.includes(example.id)"
      @request="forwardRequest"
      @release="forwardRelease"
    />
  </div>
</template>
