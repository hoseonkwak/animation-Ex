import { computed, reactive } from 'vue'

export type LibraryList = 'saved' | 'practiceLater'
interface StoredItem {
  slug: string
  savedAt: string
}
interface LibraryState {
  saved: StoredItem[]
  practiceLater: StoredItem[]
  ready: boolean
  showStorageNotice: boolean
}

const keys: Record<LibraryList, string> = {
  saved: 'kwak-motion:saved:v1',
  practiceLater: 'kwak-motion:practice-later:v1',
}
const state = reactive<LibraryState>({
  saved: [],
  practiceLater: [],
  ready: false,
  showStorageNotice: false,
})

function read(key: string): StoredItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown
    if (!Array.isArray(value)) return []
    return value.filter(
      (item): item is StoredItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as StoredItem).slug === 'string' &&
        typeof (item as StoredItem).savedAt === 'string',
    )
  } catch {
    return []
  }
}

function initialize(): void {
  if (state.ready || typeof localStorage === 'undefined') return
  state.saved = read(keys.saved)
  state.practiceLater = read(keys.practiceLater)
  state.ready = true
}

function persist(list: LibraryList): void {
  localStorage.setItem(keys[list], JSON.stringify(state[list]))
}

function has(list: LibraryList, slug: string): boolean {
  initialize()
  return state[list].some((item) => item.slug === slug)
}

function toggle(list: LibraryList, slug: string): boolean {
  initialize()
  const index = state[list].findIndex((item) => item.slug === slug)
  if (index >= 0) {
    state[list].splice(index, 1)
    persist(list)
    return false
  }
  state[list].unshift({ slug, savedAt: new Date().toISOString() })
  persist(list)
  if (!localStorage.getItem('kwak-motion:storage-notice-seen')) {
    state.showStorageNotice = true
    localStorage.setItem('kwak-motion:storage-notice-seen', 'true')
  }
  return true
}

function remove(list: LibraryList, slug: string): void {
  initialize()
  state[list] = state[list].filter((item) => item.slug !== slug)
  persist(list)
}

export function useLibraryLists() {
  initialize()
  return {
    state,
    savedCount: computed(() => state.saved.length),
    has,
    toggle,
    remove,
    dismissNotice: () => (state.showStorageNotice = false),
  }
}
