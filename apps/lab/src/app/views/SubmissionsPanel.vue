<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { ApiSuccess } from '@/shared/examples'

interface Submission {
  id: string
  submittedUrl: string
  note: string | null
  status: string
  createdAt: string
  entrySlug: string | null
}
const labels: Record<string, string> = {
  received: '접수 대기',
  linked: '등록된 주소',
  rejected: '제외됨',
}
const filter = ref('all')
const page = ref(0)
const items = ref<Submission[]>([])
const total = ref(0)
const pending = ref(0)
const loading = ref(false)
const error = ref('')
let requestVersion = 0

async function load(reset = false): Promise<void> {
  if (reset) page.value = 0
  const version = ++requestVersion
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(
      `/api/v1/admin/submissions?status=${filter.value}&page=${page.value}`,
      {
        headers: { 'X-Local-Access-Email': 'owner@local.test' },
      },
    )
    if (!response.ok) throw new Error('URL 제보를 불러오지 못했습니다.')
    const body = (await response.json()) as ApiSuccess<{
      items: Submission[]
      total: number
      counts: { received: number }
    }>
    if (version !== requestVersion) return
    items.value = body.data.items
    total.value = body.data.total
    pending.value = body.data.counts.received
  } catch (cause) {
    if (version === requestVersion)
      error.value = cause instanceof Error ? cause.message : '조회 실패'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
function changePage(direction: number): void {
  page.value += direction
  void load()
}
onMounted(() => void load())
</script>

<template>
  <section id="url-submissions" class="triage-panel" aria-label="URL 제보 접수함">
    <div class="report-panel-heading">
      <h2>
        URL 제보 <strong>{{ pending }}</strong>
      </h2>
      <label
        >제보 상태
        <select v-model="filter" @change="load(true)">
          <option value="all">전체</option>
          <option v-for="(label, status) in labels" :key="status" :value="status">
            {{ label }}
          </option>
        </select>
      </label>
      <button type="button" :disabled="loading" @click="load()">제보 새로고침</button>
    </div>
    <p>
      새 예제 URL 제보를 확인하는 접수함입니다. 실행 문제·삭제 요청은 예제 문제 신고에서 확인하세요.
    </p>
    <p v-if="error" class="admin-notice error" role="alert">{{ error }}</p>
    <p v-if="loading">제보를 불러오는 중입니다.</p>
    <p v-else-if="!items.length">접수된 URL 제보가 없습니다.</p>
    <ul v-else class="submission-inbox">
      <li v-for="item in items" :key="item.id">
        <div>
          <strong>{{ labels[item.status] ?? item.status }}</strong> ·
          <time>{{ new Date(item.createdAt).toLocaleString('ko-KR') }}</time>
        </div>
        <a :href="item.submittedUrl" target="_blank" rel="noopener noreferrer">{{
          item.submittedUrl
        }}</a>
        <p v-if="item.note">{{ item.note }}</p>
        <RouterLink v-if="item.entrySlug" :to="`/examples/${item.entrySlug}`"
          >등록된 예제 보기</RouterLink
        >
      </li>
    </ul>
    <div v-if="total > 50" class="preview-decision">
      <button type="button" :disabled="page === 0 || loading" @click="changePage(-1)">
        이전 제보
      </button>
      <span>{{ page + 1 }} / {{ Math.ceil(total / 50) }}</span>
      <button type="button" :disabled="(page + 1) * 50 >= total || loading" @click="changePage(1)">
        다음 제보
      </button>
    </div>
  </section>
</template>
