import { readonly, ref } from 'vue'

export function createPreviewScheduler(limit = 2) {
  const activeIds = ref<string[]>([])

  function request(id: string, priority = false): boolean {
    if (activeIds.value.includes(id)) return true
    if (activeIds.value.length < limit) {
      activeIds.value = [...activeIds.value, id]
      return true
    }
    if (!priority) return false

    activeIds.value = [...activeIds.value.slice(1), id]
    return true
  }

  function release(id: string): void {
    activeIds.value = activeIds.value.filter((activeId) => activeId !== id)
  }

  function reset(): void {
    activeIds.value = []
  }

  return { activeIds: readonly(activeIds), request, release, reset }
}
