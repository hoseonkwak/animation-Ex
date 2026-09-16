<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { setPageMeta } from '@/app/pageMeta'

const url = ref('')
const note = ref('')
const token = ref('')
const submitting = ref(false)
const success = ref(false)
const error = ref('')
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
const local = computed(() => location.hostname === 'localhost' || location.hostname === '127.0.0.1')

onMounted(() => {
  setPageMeta(
    'URL 제보',
    '좋은 웹 애니메이션 URL을 제보해주세요. 검수 후 라이브러리에 정리합니다.',
    '/submit',
    false,
  )
  if (local.value) token.value = 'local-test-token'
  else if (siteKey) renderTurnstile(siteKey)
})

function renderTurnstile(key: string): void {
  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.onload = () =>
    window.turnstile?.render('#turnstile-widget', {
      sitekey: key,
      callback: (value: string) => (token.value = value),
    })
  document.head.append(script)
}

async function submit(): Promise<void> {
  submitting.value = true
  error.value = ''
  try {
    const response = await fetch('/api/v1/submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: url.value, note: note.value, turnstileToken: token.value }),
    })
    if (!response.ok) throw new Error('submit failed')
    success.value = true
    url.value = ''
    note.value = ''
  } catch {
    error.value = '접수하지 못했습니다. URL과 사람 확인을 점검한 뒤 다시 시도해주세요.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main id="main-content" class="page narrow-page">
    <header class="page-header">
      <p class="eyebrow">SUBMIT A REFERENCE</p>
      <h1>좋은 애니메이션을 발견했나요?</h1>
      <p class="description">
        CodePen이나 공개 웹페이지 주소를 알려주세요. 바로 공개하지 않고 실행, 출처와 라이선스를
        검수합니다.
      </p>
    </header>
    <section v-if="success" class="success-panel" role="status">
      <h2>제보를 접수했습니다.</h2>
      <p>같은 주소가 이미 있어도 개인정보 보호를 위해 동일한 접수 결과를 안내합니다.</p>
      <div class="hero-actions">
        <RouterLink class="primary-action" to="/">Home</RouterLink
        ><RouterLink class="secondary-action" to="/explore">Explore</RouterLink>
      </div>
      <button type="button" @click="success = false">다른 URL 제보</button>
    </section>
    <form v-else class="submission-form" @submit.prevent="submit">
      <label for="submitted-url">URL</label
      ><input
        id="submitted-url"
        v-model="url"
        type="url"
        required
        maxlength="2048"
        placeholder="https://codepen.io/... 또는 https://example.com/..."
      />
      <label for="submission-note">한 줄 설명 <span>선택</span></label
      ><textarea
        id="submission-note"
        v-model="note"
        maxlength="300"
        rows="4"
        placeholder="어떤 움직임이 인상적이었는지 알려주세요."
      />
      <div v-if="local" class="local-turnstile">로컬 개발 환경의 사람 확인을 사용합니다.</div>
      <div v-else-if="siteKey" id="turnstile-widget" />
      <p v-else class="status-message error">Turnstile 사이트 키가 설정되지 않았습니다.</p>
      <p>제보는 관리자 검수 후 후보로 등록되며 자동 공개되지 않습니다.</p>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button class="primary-action" type="submit" :disabled="submitting || !token">
        {{ submitting ? '접수 중' : '제보하기' }}
      </button>
    </form>
  </main>
</template>
