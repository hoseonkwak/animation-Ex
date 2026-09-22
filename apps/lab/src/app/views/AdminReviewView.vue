<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { CandidateDetail, CandidateListPayload, CandidateStatus } from '@/shared/admin'
import type { ApiSuccess } from '@/shared/examples'

const queue = ref<CandidateListPayload>({ items: [], counts: {} })
const selected = ref<CandidateDetail | null>(null)
const status = ref<CandidateStatus>('review')
const previewFilter = ref('all')
const viewport = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const busy = ref(false)
const notice = ref('')
const error = ref('')
const operations = ref<{
  environment: string
  ingestionPaused: boolean
  usage: { level: 'normal' | 'warning' | 'paused'; maximumRatio: number }
} | null>(null)
const reasonCode = ref('missing-metadata')
const decisionNote = ref('')
const form = reactive({
  sourceTitle: '',
  publicTitle: '',
  summary: '',
  slug: '',
  difficulty: 'intermediate',
  featured: false,
  interactionNote: '',
  creatorName: '',
  licenseCode: '',
  licenseEvidenceUrl: '',
  tagIds: [] as string[],
})
const localHeaders = { 'X-Local-Access-Email': 'owner@local.test' }
const frameWidth = computed(
  () => ({ desktop: '100%', tablet: '768px', mobile: '390px' })[viewport.value],
)
const approvalIssues = computed(() => {
  const issues: string[] = []
  if (!selected.value?.previewChecked) issues.push('현재 Pen 실행 확인이 필요합니다.')
  if (!form.publicTitle || !form.summary || !form.slug)
    issues.push('공개 제목·요약·slug가 필요합니다.')
  if (!form.creatorName || !form.licenseCode || !form.licenseEvidenceUrl)
    issues.push('출처와 라이선스 정보가 필요합니다.')
  const tags = selected.value?.tags.filter((tag) => form.tagIds.includes(tag.id)) ?? []
  if (!tags.some((tag) => tag.axis === 'technology' || tag.axis === 'section'))
    issues.push('기술 또는 영역 태그가 필요합니다.')
  return issues
})

onMounted(() => {
  void loadQueue()
  void loadOperations()
})

async function api<T>(path: string, init: Parameters<typeof fetch>[1] = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...localHeaders, ...init.headers },
  })
  const body = (await response.json()) as ApiSuccess<T> & { error?: { message: string } }
  if (!response.ok) throw new Error(body.error?.message ?? `HTTP ${response.status}`)
  return body.data
}

function changeStatus(value: string): void {
  status.value = value as CandidateStatus
  void loadQueue()
}

function changeViewport(value: string): void {
  if (value === 'desktop' || value === 'tablet' || value === 'mobile') viewport.value = value
}

function showError(cause: unknown): void {
  error.value = cause instanceof Error ? cause.message : '요청을 처리하지 못했습니다.'
}

async function loadOperations(): Promise<void> {
  try {
    operations.value = await api('/api/v1/admin/operations')
  } catch (cause) {
    showError(cause)
  }
}

async function loadQueue(): Promise<void> {
  busy.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ status: status.value, sort: 'oldest' })
    if (previewFilter.value !== 'all') params.set('preview', previewFilter.value)
    queue.value = await api(`/api/v1/admin/candidates?${params}`)
    if (!queue.value.items.some((item) => item.id === selected.value?.id)) {
      const first = queue.value.items[0]
      const detail = first
        ? await api<CandidateDetail>(`/api/v1/admin/candidates/${first.id}`)
        : null
      selected.value = detail
      if (detail) fillForm(detail)
    }
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
  }
}

async function selectCandidate(id: string): Promise<void> {
  busy.value = true
  try {
    const detail = await api<CandidateDetail>(`/api/v1/admin/candidates/${id}`)
    selected.value = detail
    fillForm(detail)
    notice.value = ''
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
  }
}

function fillForm(item: CandidateDetail): void {
  Object.assign(form, {
    sourceTitle: item.sourceTitle,
    publicTitle: item.publicTitle,
    summary: item.summary,
    slug: item.slug,
    difficulty: item.difficulty,
    featured: item.featured,
    interactionNote: item.interactionNote,
    creatorName: item.creatorName ?? '',
    licenseCode: item.licenseCode ?? '',
    licenseEvidenceUrl: item.licenseEvidenceUrl ?? '',
    tagIds: item.tags.filter((tag) => tag.confirmed).map((tag) => tag.id),
  })
}

async function save(): Promise<void> {
  if (!selected.value) return
  busy.value = true
  try {
    const detail = await api<CandidateDetail>(`/api/v1/admin/candidates/${selected.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ version: selected.value.version, ...form }),
    })
    selected.value = detail
    fillForm(detail)
    notice.value = '변경사항을 저장했습니다.'
  } catch (cause) {
    showError(cause)
    throw cause
  } finally {
    busy.value = false
  }
}

async function recordPreview(result: 'pass' | 'fail'): Promise<void> {
  if (!selected.value) return
  busy.value = true
  try {
    selected.value = await api(`/api/v1/admin/candidates/${selected.value.id}/preview-checks`, {
      method: 'POST',
      body: JSON.stringify({
        result,
        penKey: selected.value.penKey,
        viewport: viewport.value,
        failureCodes: result === 'fail' ? ['broken-preview'] : [],
      }),
    })
    notice.value = result === 'pass' ? '실행 확인을 저장했습니다.' : '실행 실패를 기록했습니다.'
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
  }
}

async function approve(): Promise<void> {
  if (!selected.value || approvalIssues.value.length) return
  try {
    await save()
    if (!selected.value) return
    busy.value = true
    const result = await api<{ slug: string }>(
      `/api/v1/admin/candidates/${selected.value.id}/approve`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ version: selected.value.version }),
      },
    )
    notice.value = `공개했습니다: /examples/${result.slug}`
    await loadQueue()
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
  }
}

async function decide(decision: 'needs-edit' | 'merge' | 'reject'): Promise<void> {
  if (!selected.value || !decisionNote.value.trim()) {
    error.value = '결정 메모를 입력해주세요.'
    return
  }
  busy.value = true
  try {
    await api(`/api/v1/admin/candidates/${selected.value.id}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        version: selected.value.version,
        decision,
        reasonCode: decision === 'merge' ? 'duplicate-source' : reasonCode.value,
        note: decisionNote.value,
      }),
    })
    notice.value = '검수 결정을 저장했습니다.'
    decisionNote.value = ''
    await loadQueue()
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="admin-view">
    <header class="admin-header">
      <div>
        <p class="eyebrow">OWNER REVIEW</p>
        <h1>Candidate Inbox</h1>
      </div>
      <a href="/">공개 Explore 보기</a>
    </header>

    <section class="admin-stats" aria-label="검수 현황">
      <button
        v-for="item in ['review', 'needs-edit', 'duplicate', 'validation-failed']"
        :key="item"
        type="button"
        :class="{ active: status === item }"
        @click="changeStatus(item)"
      >
        <span>{{
          {
            review: '승인 대기',
            'needs-edit': '수정 필요',
            duplicate: '중복',
            'validation-failed': 'Preview 실패',
          }[item]
        }}</span
        ><strong>{{ queue.counts[item] ?? 0 }}</strong>
      </button>
    </section>
    <section v-if="operations" class="operations-status" aria-label="운영 상태">
      <span
        >환경 <strong>{{ operations.environment }}</strong></span
      >
      <span
        >무료 한도 <strong>{{ Math.round(operations.usage.maximumRatio * 100) }}%</strong></span
      >
      <span
        >상태 <strong>{{ operations.usage.level }}</strong></span
      >
      <span
        >수집 <strong>{{ operations.ingestionPaused ? '중지' : '허용' }}</strong></span
      >
    </section>
    <p v-if="notice" class="admin-notice success" role="status">{{ notice }}</p>
    <p v-if="error" class="admin-notice error" role="alert">{{ error }}</p>

    <section class="review-workspace" aria-label="후보 검수 작업 공간">
      <aside class="candidate-queue">
        <div class="queue-toolbar">
          <strong>Queue</strong
          ><select v-model="previewFilter" aria-label="Preview 확인 필터" @change="loadQueue">
            <option value="all">전체</option>
            <option value="unchecked">미확인</option>
            <option value="checked">확인 완료</option>
          </select>
        </div>
        <p v-if="busy && !queue.items.length">후보를 불러오는 중입니다.</p>
        <p v-else-if="!queue.items.length">이 상태의 후보가 없습니다.</p>
        <button
          v-for="candidate in queue.items"
          :key="candidate.id"
          type="button"
          class="candidate-item"
          :class="{ selected: selected?.id === candidate.id }"
          @click="selectCandidate(candidate.id)"
        >
          <span class="candidate-category">{{ candidate.sourceCategory ?? '미분류' }}</span
          ><strong>{{ candidate.sourceTitle }}</strong
          ><small
            >{{ candidate.creatorName ?? '작성자 없음' }} · 우선순위
            {{ candidate.priorityScore }}</small
          ><span class="candidate-warning">{{
            candidate.previewChecked ? '✓ 실행 확인' : '! 미리보기 미확인'
          }}</span>
        </button>
      </aside>

      <section v-if="selected" class="live-review">
        <div class="preview-heading">
          <div>
            <p class="eyebrow">LIVE CODEPEN</p>
            <h2>{{ selected.sourceTitle }}</h2>
          </div>
          <a :href="selected.canonicalUrl" target="_blank" rel="noreferrer">원본 Pen 열기</a>
        </div>
        <div class="viewport-controls">
          <button
            v-for="size in ['desktop', 'tablet', 'mobile']"
            :key="size"
            type="button"
            :class="{ active: viewport === size }"
            @click="changeViewport(size)"
          >
            {{ size }}
          </button>
        </div>
        <div class="admin-preview-stage">
          <iframe
            :key="selected.id"
            :src="selected.embedUrl"
            :style="{ width: frameWidth }"
            :title="`${selected.sourceTitle} by ${selected.creatorName} 실행 화면`"
            referrerpolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
        <p class="interaction-note">
          {{ selected.interactionNote || '화면을 직접 조작해 동작을 확인하세요.' }}
        </p>
        <div class="preview-decision">
          <button type="button" class="pass" :disabled="busy" @click="recordPreview('pass')">
            정상 실행 확인</button
          ><button type="button" :disabled="busy" @click="recordPreview('fail')">
            실행 실패 기록
          </button>
        </div>
      </section>

      <form v-if="selected" class="edit-panel" @submit.prevent="save">
        <h2>공개 정보</h2>
        <label>공개 제목<input v-model.trim="form.publicTitle" required /></label
        ><label>원본 제목<input v-model.trim="form.sourceTitle" required /></label
        ><label>한 줄 요약<textarea v-model.trim="form.summary" required rows="3" /></label
        ><label>Slug<input v-model.trim="form.slug" required pattern="[a-z0-9-]+" /></label>
        <label
          >난이도<select v-model="form.difficulty">
            <option value="beginner">입문</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select></label
        ><label class="checkbox"><input v-model="form.featured" type="checkbox" /> Featured</label
        ><label>상호작용 안내<textarea v-model.trim="form.interactionNote" rows="2" /></label>
        <h2>출처</h2>
        <label>작성자<input v-model.trim="form.creatorName" required /></label
        ><label>라이선스<input v-model.trim="form.licenseCode" required /></label
        ><label
          >확인 근거<input v-model.trim="form.licenseEvidenceUrl" type="url" required
        /></label>
        <h2>태그</h2>
        <div class="admin-tags">
          <label v-for="tag in selected.tags" :key="tag.id" :class="`tag-source-${tag.source}`"
            ><input v-model="form.tagIds" type="checkbox" :value="tag.id" />{{ tag.label }}
            <small>{{ tag.axis }} · {{ Math.round(tag.confidence * 100) }}%</small></label
          >
        </div>
        <button type="submit" class="save-button" :disabled="busy">
          {{ busy ? '저장 중' : '변경 저장' }}
        </button>
        <div class="decision-panel">
          <h2>검수 결정</h2>
          <select v-model="reasonCode" aria-label="결정 사유">
            <option value="missing-metadata">정보 보완</option>
            <option value="broken-preview">Preview 실패</option>
            <option value="license-uncertain">라이선스 불확실</option>
            <option value="insufficient-quality">품질 부족</option>
            <option value="not-animation">애니메이션 아님</option>
            <option value="other">기타</option></select
          ><textarea v-model.trim="decisionNote" rows="2" placeholder="결정 근거를 입력하세요." />
          <ul v-if="approvalIssues.length" class="approval-issues">
            <li v-for="issue in approvalIssues" :key="issue">{{ issue }}</li>
          </ul>
          <div class="decision-actions">
            <button type="button" @click="decide('reject')">거절</button
            ><button type="button" @click="decide('merge')">중복</button
            ><button type="button" @click="decide('needs-edit')">수정 필요</button
            ><button
              type="button"
              class="approve"
              :disabled="busy || approvalIssues.length > 0"
              @click="approve"
            >
              승인 및 공개
            </button>
          </div>
        </div>
      </form>
      <div v-else class="empty-review">검수할 후보를 선택하세요.</div>
    </section>
  </main>
</template>
