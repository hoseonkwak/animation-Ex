<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createDraft, listDrafts, type PracticeDraft } from '@/features/practice/drafts'
import type { PracticeKitPayload } from '@/shared/practice'
import type { ApiSuccess, ExampleDetail } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const route = useRoute()
const router = useRouter()
const error = ref('')
const referenceSlug = ref<string | null>(null)
const referenceTitle = ref('새 연습')
const referenceExample = ref<ExampleDetail | null>(null)
const existingDraft = ref<PracticeDraft | null>(null)
const loading = ref(true)

onMounted(async () => {
  setPageMeta('새 연습', '새 코드 연습 공간을 준비합니다.', route.path, false)
  const slug = typeof route.query.reference === 'string' ? route.query.reference : null
  try {
    if (slug) {
      const response = await fetch(`/api/v1/examples/${encodeURIComponent(slug)}`)
      if (!response.ok) throw new Error('참고 예제를 찾을 수 없습니다.')
      const example = ((await response.json()) as ApiSuccess<ExampleDetail>).data
      referenceExample.value = example
      referenceSlug.value = slug
      referenceTitle.value = `${example.title} 연습`
      const { drafts } = await listDrafts()
      existingDraft.value = drafts.find((draft) => draft.referenceSlug === slug) ?? null
      if (existingDraft.value) {
        loading.value = false
        return
      }
    }
    await startNew()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '연습 공간을 만들지 못했습니다.'
  } finally {
    loading.value = false
  }
})

async function startNew(): Promise<void> {
  error.value = ''
  loading.value = true
  try {
    const example = referenceExample.value
    const slug = referenceSlug.value
    let starter:
      | {
          code: PracticeKitPayload['code']
          versionId: string
          author: string
          licenseCode: string
          libraries: PracticeKitPayload['libraries']
        }
      | undefined
    if (example?.practiceKitReady && slug) {
      const response = await fetch(`/api/v1/examples/${encodeURIComponent(slug)}/practice-kit`)
      if (!response.ok)
        throw new Error('시작 코드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      const kit = ((await response.json()) as ApiSuccess<PracticeKitPayload>).data
      starter = {
        code: kit.code,
        versionId: kit.versionId,
        author: kit.provenance.author,
        licenseCode: kit.provenance.licenseCode,
        libraries: kit.libraries,
      }
    }
    const draft = await createDraft(referenceTitle.value, slug, starter)
    await router.replace({ name: 'practice-draft', params: { id: draft.id } })
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '연습 공간을 만들지 못했습니다.'
  } finally {
    loading.value = false
  }
}

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
    <p v-if="loading" class="status-message" role="status">연습 공간을 준비하는 중입니다.</p>
    <section v-else-if="error" class="status-message error">
      <h1>연습 공간을 만들지 못했습니다.</h1>
      <p>{{ error }}</p>
      <button v-if="referenceSlug" class="primary-action" type="button" @click="startBlank">
        빈 코드로 시작
      </button>
      <RouterLink class="secondary-action" to="/practice">연습 목록으로</RouterLink>
    </section>
    <section v-else-if="existingDraft" class="status-message">
      <h1>이 예제를 연습한 기록이 있어요.</h1>
      <p>
        {{ existingDraft.title }} · {{ new Date(existingDraft.updatedAt).toLocaleString('ko-KR') }}
      </p>
      <p>이어서 하면 작성한 코드를 그대로 사용합니다. 새로 시작하면 별도 초안이 만들어집니다.</p>
      <RouterLink
        class="primary-action"
        :to="{ name: 'practice-draft', params: { id: existingDraft.id } }"
        >이어서 연습</RouterLink
      >
      <button class="secondary-action" type="button" @click="startNew">새로 시작</button>
    </section>
  </main>
</template>
