<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import type { ApiSuccess } from '@/shared/examples'

const emit = defineEmits<{ unpublished: [] }>()

interface ReportItem {
  id: string
  entryId: string
  slug: string
  title: string
  entryStatus: string
  embedUrl: string | null
  reasonCode: string
  note: string | null
  status: string
  reportCount: number
  adminNote: string | null
  createdAt: string
  resolvedAt: string | null
}

const reasonLabels: Record<string, string> = {
  'not-working': '실행 안 됨',
  'source-unavailable': '원본 접근 불가',
  inappropriate: '부적절한 내용',
  'removal-request': '삭제 요청',
  other: '기타',
}
const filter = ref<'open' | 'closed'>('open')
const items = ref<ReportItem[]>([])
const counts = ref({ open: 0, closed: 0 })
const selectedId = ref('')
const selected = computed(() => items.value.find((item) => item.id === selectedId.value))
const adminNote = ref('')
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const localHeaders = { 'X-Local-Access-Email': 'owner@local.test' }

onMounted(load)

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`/api/v1/admin/example-reports?status=${filter.value}`, {
      headers: localHeaders,
    })
    if (!response.ok) throw new Error('신고 목록을 불러오지 못했습니다.')
    const body = (await response.json()) as ApiSuccess<{
      counts: { open: number; closed: number }
      items: ReportItem[]
    }>
    items.value = body.data.items
    counts.value = body.data.counts
    if (!items.value.some((item) => item.id === selectedId.value)) {
      selectedId.value = items.value[0]?.id ?? ''
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '신고 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function decide(action: 'dismiss' | 'unpublish'): Promise<void> {
  if (!selected.value || adminNote.value.trim().length < 3) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const response = await fetch(`/api/v1/admin/example-reports/${selected.value.id}/resolve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...localHeaders },
      body: JSON.stringify({ action, note: adminNote.value.trim() }),
    })
    if (!response.ok) {
      const body = (await response.json()) as { error?: { message?: string } }
      throw new Error(body.error?.message ?? '신고를 처리하지 못했습니다.')
    }
    adminNote.value = ''
    notice.value =
      action === 'unpublish' ? '예제 공개를 중지하고 신고를 처리했습니다.' : '신고를 닫았습니다.'
    if (action === 'unpublish') emit('unpublished')
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '신고를 처리하지 못했습니다.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="triage-panel example-reports-panel" aria-label="예제 문제 신고">
    <div class="report-panel-heading">
      <div>
        <h2>
          예제 문제 신고 <strong>{{ counts.open }}</strong>
        </h2>
        <p>신고를 확인한 뒤 예제를 공개 중지하거나 신고를 닫으세요.</p>
      </div>
      <label>
        신고 상태
        <select v-model="filter" aria-label="신고 상태" @change="load">
          <option value="open">미처리</option>
          <option value="closed">처리 완료</option>
        </select>
      </label>
    </div>
    <p v-if="error" class="admin-notice error" role="alert">{{ error }}</p>
    <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
    <p v-if="loading">신고를 불러오는 중입니다.</p>
    <p v-else-if="!items.length">
      {{ filter === 'open' ? '미처리 신고가 없습니다.' : '처리한 신고가 없습니다.' }}
    </p>
    <div v-else class="report-review-layout">
      <label>
        신고된 예제
        <select v-model="selectedId" aria-label="신고된 예제">
          <option v-for="item in items" :key="item.id" :value="item.id">
            {{ item.title }} · {{ reasonLabels[item.reasonCode] }} ({{ item.reportCount }})
          </option>
        </select>
      </label>
      <div v-if="selected" class="report-review-detail">
        <p>
          <strong>{{ selected.title }}</strong> · {{ reasonLabels[selected.reasonCode] }} ·
          {{ selected.reportCount }}건
        </p>
        <p>접수: {{ selected.createdAt }} · 예제 상태: {{ selected.entryStatus }}</p>
        <p v-if="selected.note">신고 내용: {{ selected.note }}</p>
        <a :href="`/examples/${selected.slug}`" target="_blank" rel="noopener noreferrer"
          >공개 상세 열기</a
        >
        <div v-if="filter === 'open' && selected.embedUrl" class="admin-preview-stage">
          <iframe
            :key="selected.id"
            :src="selected.embedUrl"
            :title="`${selected.title} 신고 검토 실행 화면`"
            referrerpolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
        <template v-if="filter === 'open'">
          <label for="report-admin-note">처리 근거</label>
          <textarea
            id="report-admin-note"
            v-model="adminNote"
            maxlength="500"
            rows="2"
            placeholder="직접 확인한 결과를 기록하세요."
          />
          <div class="preview-decision">
            <button
              type="button"
              :disabled="busy || adminNote.trim().length < 3"
              @click="decide('unpublish')"
            >
              {{ selected.entryStatus === 'published' ? '예제 공개 중지' : '처리 완료' }}
            </button>
            <button
              type="button"
              :disabled="busy || adminNote.trim().length < 3"
              @click="decide('dismiss')"
            >
              신고 닫기
            </button>
          </div>
        </template>
        <p v-else>처리 결과: {{ selected.status }} · {{ selected.adminNote }}</p>
      </div>
    </div>
  </section>
</template>
