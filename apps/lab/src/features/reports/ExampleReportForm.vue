<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{ slug: string }>()
const reasonCode = ref('not-working')
const note = ref('')
const token = ref('')
const submitting = ref(false)
const received = ref(false)
const error = ref('')
const local = computed(() => location.hostname === 'localhost' || location.hostname === '127.0.0.1')
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

onMounted(() => {
  if (local.value) {
    token.value = 'local-test-token'
    return
  }
  if (!siteKey) return
  const render = () =>
    window.turnstile?.render('#example-report-turnstile', {
      sitekey: siteKey,
      callback: (value: string) => (token.value = value),
    })
  if (window.turnstile) {
    render()
    return
  }
  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.onload = render
  document.head.append(script)
})

async function submit(): Promise<void> {
  submitting.value = true
  error.value = ''
  try {
    const response = await fetch(`/api/v1/examples/${encodeURIComponent(props.slug)}/reports`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        reasonCode: reasonCode.value,
        note: note.value,
        turnstileToken: token.value,
      }),
    })
    if (!response.ok) {
      const body = (await response.json()) as { error?: { message?: string } }
      throw new Error(body.error?.message ?? '신고를 접수하지 못했습니다.')
    }
    received.value = true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '신고를 접수하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section
    id="report-example"
    class="example-report-section content-block"
    aria-labelledby="report-title"
  >
    <div class="block-heading">
      <div>
        <h2 id="report-title">예제에 문제가 있나요?</h2>
        <p>실행 오류나 원본 접근 문제를 알려주시면 확인 후 공개 중지 여부를 결정합니다.</p>
      </div>
    </div>
    <div v-if="received" class="success-panel" role="status">
      <h3>신고를 접수했습니다.</h3>
      <p>관리자가 실제 실행 화면과 신고 내용을 확인합니다.</p>
    </div>
    <form v-else class="submission-form example-report-form" @submit.prevent="submit">
      <label for="report-reason">문제 유형</label>
      <select id="report-reason" v-model="reasonCode" required>
        <option value="not-working">실행되지 않아요</option>
        <option value="source-unavailable">원본을 열 수 없어요</option>
        <option value="inappropriate">부적절한 내용이 있어요</option>
        <option value="removal-request">삭제를 요청해요</option>
        <option value="other">다른 문제예요</option>
      </select>
      <label for="report-note">
        자세한 설명 <span>{{ reasonCode === 'removal-request' ? '필수' : '선택' }}</span>
      </label>
      <textarea
        id="report-note"
        v-model="note"
        rows="3"
        maxlength="500"
        :required="reasonCode === 'removal-request'"
        :minlength="reasonCode === 'removal-request' ? 10 : undefined"
        placeholder="어떤 부분에서 문제가 생겼는지 알려주세요."
      />
      <div v-if="local" class="local-turnstile">로컬 개발 환경의 사람 확인을 사용합니다.</div>
      <div v-else-if="siteKey" id="example-report-turnstile" />
      <p v-else class="status-message error">사람 확인 기능이 준비되지 않았습니다.</p>
      <p>신고만으로 예제가 자동 삭제되지는 않습니다.</p>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button class="secondary-action" type="submit" :disabled="submitting || !token">
        {{ submitting ? '접수 중' : '문제 신고하기' }}
      </button>
    </form>
  </section>
</template>
