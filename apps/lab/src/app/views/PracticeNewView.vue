<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createDraft } from '@/features/practice/drafts'
import type { ApiSuccess, ExampleDetail } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const route = useRoute()
const router = useRouter()
const error = ref('')

onMounted(async () => {
  setPageMeta('새 연습', '새 코드 연습 공간을 준비합니다.', route.path, false)
  const slug = typeof route.query.reference === 'string' ? route.query.reference : null
  try {
    let title = '새 연습'
    if (slug) {
      const response = await fetch(`/api/v1/examples/${encodeURIComponent(slug)}`)
      if (!response.ok) throw new Error('참고 예제를 찾을 수 없습니다.')
      const example = ((await response.json()) as ApiSuccess<ExampleDetail>).data
      title = `${example.title} 연습`
    }
    const draft = await createDraft(title, slug)
    await router.replace({ name: 'practice-draft', params: { id: draft.id } })
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '연습 공간을 만들지 못했습니다.'
  }
})
</script>

<template>
  <main id="main-content" class="page narrow-page">
    <p v-if="!error" class="status-message" role="status">연습 공간을 준비하는 중입니다.</p>
    <section v-else class="status-message error">
      <h1>연습 공간을 만들지 못했습니다.</h1>
      <p>{{ error }}</p>
      <RouterLink class="secondary-action" to="/practice">연습 목록으로</RouterLink>
    </section>
  </main>
</template>
