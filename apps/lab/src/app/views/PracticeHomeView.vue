<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { listDrafts, type PracticeDraft } from '@/features/practice/drafts'
import { setPageMeta } from '@/app/pageMeta'

const drafts = ref<PracticeDraft[]>([])
const invalidCount = ref(0)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  setPageMeta('자유 연습', '코드를 직접 바꾸고 실행하며 애니메이션을 연습하세요.', '/practice')
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
