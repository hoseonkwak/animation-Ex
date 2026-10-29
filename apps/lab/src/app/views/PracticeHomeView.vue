<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { listDrafts, type PracticeDraft } from '@/features/practice/drafts'
import PreviewCard from '@/features/preview/PreviewCard.vue'
import { createPreviewScheduler } from '@/features/preview/previewScheduler'
import type { ApiSuccess, ExampleCard, ExamplesPayload } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const scheduler = createPreviewScheduler(2)
const drafts = ref<PracticeDraft[]>([])
const invalidCount = ref(0)
const loading = ref(true)
const error = ref('')
const kits = ref<ExampleCard[]>([])
const kitLoading = ref(true)
const kitError = ref('')
const nextCursor = ref<string | null>(null)

onMounted(async () => {
  setPageMeta('자유 연습', '코드를 직접 바꾸고 실행하며 애니메이션을 연습하세요.', '/practice')
  void loadKits(false)
  try {
    const result = await listDrafts()
    drafts.value = result.drafts
    invalidCount.value = result.invalidCount
  } catch {
    error.value = '이 브라우저의 연습 기록을 읽지 못했습니다.'
  } finally {
    loading.value = false
  }
})

async function loadKits(append: boolean): Promise<void> {
  kitLoading.value = true
  kitError.value = ''
  try {
    const params = new URLSearchParams({ practiceReady: 'true', limit: '12' })
    if (append && nextCursor.value) params.set('cursor', nextCursor.value)
    const response = await fetch(`/api/v1/examples?${params}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = (await response.json()) as ApiSuccess<ExamplesPayload>
    kits.value = append ? [...kits.value, ...body.data.items] : body.data.items
    nextCursor.value = body.data.nextCursor
  } catch {
    kitError.value = '연습 Kit 목록을 불러오지 못했습니다. 다시 시도해주세요.'
  } finally {
    kitLoading.value = false
  }
}
</script>

<template>
  <main id="main-content" class="page practice-home">
    <header class="page-header">
      <p class="eyebrow">PRACTICE</p>
      <h1>직접 만들고 실행하세요.</h1>
      <p class="description">HTML·CSS·JavaScript를 바꾸면 결과가 바로 실행됩니다.</p>
      <div class="hero-actions">
        <RouterLink class="primary-action" to="/practice/new">새 연습 시작</RouterLink>
        <RouterLink class="secondary-action" to="/explore">예제에서 시작</RouterLink>
      </div>
    </header>
    <section class="practice-kit-section" aria-labelledby="practice-kit-title">
      <div class="block-heading"><h2 id="practice-kit-title">시작 코드가 있는 예제</h2></div>
      <p>썸네일로 예제를 고르고, 직접 만든 시작 코드로 연습해보세요.</p>
      <p v-if="kitLoading && kits.length === 0" class="status-message" role="status">
        연습 Kit을 불러오는 중입니다.
      </p>
      <div v-else-if="kitError" class="status-message error" role="alert">
        <p>{{ kitError }}</p>
        <button type="button" @click="loadKits(Boolean(kits.length))">다시 시도</button>
      </div>
      <p v-else-if="kits.length === 0" class="status-message">
        준비된 시작 코드가 없습니다. 빈 코드로 연습하거나 다른 예제를 참고해보세요.
      </p>
      <div v-if="kits.length" class="example-grid practice-kit-grid">
        <PreviewCard
          v-for="example in kits"
          :key="example.id"
          :example="example"
          :active="scheduler.activeIds.value.includes(example.id)"
          practice
          @request="scheduler.request"
          @release="scheduler.release"
        />
      </div>
      <button
        v-if="nextCursor && !kitError"
        class="load-more"
        type="button"
        :disabled="kitLoading"
        @click="loadKits(true)"
      >
        {{ kitLoading ? '불러오는 중' : 'Kit 더 보기' }}
      </button>
    </section>
    <section aria-labelledby="recent-practice-title">
      <div class="block-heading"><h2 id="recent-practice-title">최근 연습</h2></div>
      <p v-if="invalidCount > 0" class="status-message error" role="alert">
        손상된 연습 기록 {{ invalidCount }}개를 표시하지 않았습니다. 브라우저 저장 데이터는 삭제하지
        않았습니다.
      </p>
      <p v-if="loading" class="status-message">연습 기록을 불러오는 중입니다.</p>
      <p v-else-if="error" class="status-message error">{{ error }}</p>
      <p v-else-if="drafts.length === 0" class="status-message">
        아직 작성한 코드가 없습니다. 새 연습을 시작하거나 예제 상세에서 연습하기를 눌러보세요.
      </p>
      <div v-else class="practice-draft-grid">
        <article v-for="draft in drafts" :key="draft.id" class="practice-draft-card">
          <h3>
            <RouterLink :to="`/practice/drafts/${draft.id}`">{{ draft.title }}</RouterLink>
          </h3>
          <p>{{ new Date(draft.updatedAt).toLocaleString('ko-KR') }}에 수정</p>
          <RouterLink :to="`/practice/drafts/${draft.id}`">이어서 연습하기</RouterLink>
        </article>
      </div>
    </section>
    <p class="practice-storage-note">
      작성한 코드는 이 브라우저에만 저장됩니다. 브라우저 데이터를 삭제하면 사라질 수 있습니다.
    </p>
  </main>
</template>
