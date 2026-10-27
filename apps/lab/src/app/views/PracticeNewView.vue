<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createDraft } from '@/features/practice/drafts'
import type { PracticeKitPayload } from '@/shared/practice'
import type { ApiSuccess, ExampleDetail } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const route = useRoute()
const router = useRouter()
const error = ref('')
const referenceSlug = ref<string | null>(null)
const referenceTitle = ref('새 연습')

onMounted(async () => {
  setPageMeta('새 연습', '새 코드 연습 공간을 준비합니다.', route.path, false)
  const slug = typeof route.query.reference === 'string' ? route.query.reference : null
  try {
    let title = '새 연습'
    let starter:
      | { code: PracticeKitPayload['code']; versionId: string; author: string; licenseCode: string }
      | undefined
    if (slug) {
      const response = await fetch(`/api/v1/examples/${encodeURIComponent(slug)}`)
      if (!response.ok) throw new Error('참고 예제를 찾을 수 없습니다.')
      const example = ((await response.json()) as ApiSuccess<ExampleDetail>).data
      title = `${example.title} 연습`
      referenceSlug.value = slug
      referenceTitle.value = title
      if (example.practiceKitReady) {
        const kitResponse = await fetch(`/api/v1/examples/${encodeURIComponent(slug)}/practice-kit`)
        if (!kitResponse.ok)
          throw new Error('시작 코드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        const kit = ((await kitResponse.json()) as ApiSuccess<PracticeKitPayload>).data
        starter = {
          code: kit.code,
          versionId: kit.versionId,
          author: kit.provenance.author,
          licenseCode: kit.provenance.licenseCode,
        }
      }
    }
    const draft = await createDraft(title, slug, starter)
    await router.replace({ name: 'practice-draft', params: { id: draft.id } })
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '연습 공간을 만들지 못했습니다.'
  }
})

async function startBlank(): Promise<void> {
  try {
    const draft = await createDraft(referenceTitle.value, referenceSlug.value)
    await router.replace({ name: 'practice-draft', params: { id: draft.id } })
  } catch {
    error.value = '빈 연습 공간도 만들지 못했습니다. 브라우저 저장소를 확인해주세요.'
  }
}
</script>

<template>
  <main id="main-content" class="page narrow-page">
    <p v-if="!error" class="status-message" role="status">연습 공간을 준비하는 중입니다.</p>
    <section v-else class="status-message error">
      <h1>연습 공간을 만들지 못했습니다.</h1>
      <p>{{ error }}</p>
      <button v-if="referenceSlug" class="primary-action" type="button" @click="startBlank">
        빈 코드로 시작
      </button>
      <RouterLink class="secondary-action" to="/practice">연습 목록으로</RouterLink>
    </section>
  </main>
</template>
