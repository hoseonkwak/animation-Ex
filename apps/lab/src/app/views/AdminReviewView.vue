<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type {
  CandidateDetail,
  CandidateListPayload,
  CandidateStatus,
  CandidateTriagePayload,
  TriageBucket,
} from '@/shared/admin'
import type { ApiSuccess } from '@/shared/examples'
import { isReviewTagAxis } from '@/shared/reviewTags'
import { pickReviewShortlist } from '@/shared/reviewShortlist'

type ReviewFilter = TriageBucket | 'all' | 'hero' | 'shortlist'

const queue = ref<CandidateListPayload>({ items: [], counts: {} })
const triage = ref<CandidateTriagePayload | null>(null)
const triageFilter = ref<ReviewFilter>('shortlist')
const skippedIds = ref<Set<string>>(new Set())
const queuePage = ref(0)
const pageSize = 50
const selected = ref<CandidateDetail | null>(null)
const authState = ref<'checking' | 'authenticated' | 'anonymous'>('checking')
const status = ref<CandidateStatus>('review')
const previewFilter = ref('all')
const viewport = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const busy = ref(false)
const notice = ref('')
const error = ref('')
const approvalFeedback = ref('')
const operations = ref<{
  environment: string
  ingestionPaused: boolean
  usage: { level: 'normal' | 'warning' | 'paused'; maximumRatio: number }
} | null>(null)
const autoPublication = ref<{
  paused: boolean
  batches: Array<{
    id: string
    status: string
    sampleCandidateId: string
    sampleTitle: string
    publishedCount: number
    failureCode: string | null
    createdAt: string
  }>
  lastRun: null | {
    status: string
    examinedCount: number
    passedCount: number
    failureCode: string | null
    startedAt: string
  }
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
const authMessage = new URLSearchParams(window.location.search).get('auth')
const frameWidth = computed(
  () => ({ desktop: '100%', tablet: '768px', mobile: '390px' })[viewport.value],
)
const shortlist = computed(() => pickReviewShortlist(triage.value?.items ?? [], skippedIds.value))
const reviewItems = computed(() => {
  const items = (triage.value?.items ?? []).filter((item) => {
    if (previewFilter.value === 'checked' && !item.previewChecked) return false
    if (previewFilter.value === 'unchecked' && item.previewChecked) return false
    return true
  })
  if (triageFilter.value === 'shortlist') return pickReviewShortlist(items, skippedIds.value)
  return items.filter((item) => {
    if (triageFilter.value === 'hero' && !item.heroSignal) return false
    if (
      triageFilter.value !== 'all' &&
      triageFilter.value !== 'hero' &&
      item.bucket !== triageFilter.value
    )
      return false
    return true
  })
})
const visibleItems = computed(() =>
  status.value === 'review'
    ? reviewItems.value.slice(queuePage.value * pageSize, (queuePage.value + 1) * pageSize)
    : queue.value.items,
)
const approvalIssues = computed(() => {
  const issues: string[] = []
  if (!selected.value?.penKey) issues.push('CodePen 원본 주소를 확인해야 합니다.')
  if (selected.value?.previewCheck?.result === 'fail')
    issues.push('기존 실행 실패가 있어 정상 실행을 다시 확인해야 합니다.')
  if (!form.publicTitle || !form.summary || !form.slug)
    issues.push('공개 제목·요약·slug가 필요합니다.')
  if (!form.creatorName || !form.licenseCode || !form.licenseEvidenceUrl)
    issues.push('출처와 라이선스 정보가 필요합니다.')
  const tags = selected.value?.tags.filter((tag) => form.tagIds.includes(tag.id)) ?? []
  if (!tags.some((tag) => isReviewTagAxis(tag.axis)))
    issues.push('탐색에 사용할 애니메이션 태그가 필요합니다.')
  return issues
})

onMounted(async () => {
  await loadSession()
  if (authState.value === 'authenticated') {
    await Promise.all([loadQueue(), loadOperations(), loadAutoPublication()])
  }
})

async function loadSession(): Promise<void> {
  try {
    const response = await fetch('/api/v1/auth/session', { headers: localHeaders })
    const body = (await response.json()) as ApiSuccess<{ authenticated: boolean }>
    authState.value = response.ok && body.data.authenticated ? 'authenticated' : 'anonymous'
  } catch (cause) {
    authState.value = 'anonymous'
    showError(cause)
  }
}

async function logout(): Promise<void> {
  await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...localHeaders },
  })
  authState.value = 'anonymous'
  queue.value = { items: [], counts: {} }
  selected.value = null
}

async function api<T>(path: string, init: Parameters<typeof fetch>[1] = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...localHeaders, ...init.headers },
  })
  const body = (await response.json()) as ApiSuccess<T> & { error?: { message: string } }
  if (!response.ok) {
    if (response.status === 401) authState.value = 'anonymous'
    throw new Error(body.error?.message ?? `HTTP ${response.status}`)
  }
  return body.data
}

function changeStatus(value: string): void {
  status.value = value as CandidateStatus
  queuePage.value = 0
  void loadQueue()
}

function changeTriageFilter(value: ReviewFilter): void {
  triageFilter.value = value
  queuePage.value = 0
  void selectFirstVisible()
}

function skipSelected(): void {
  if (!selected.value) return
  skippedIds.value = new Set([...skippedIds.value, selected.value.id])
  queuePage.value = 0
  void selectFirstVisible()
}

function resetSkipped(): void {
  skippedIds.value = new Set()
  queuePage.value = 0
  void selectFirstVisible()
}

function changePreviewFilter(): void {
  queuePage.value = 0
  if (status.value === 'review') void selectFirstVisible()
  else void loadQueue()
}

async function selectFirstVisible(): Promise<void> {
  const first = visibleItems.value[0]
  if (first) await selectCandidate(first.id)
  else selected.value = null
}

function changeQueuePage(delta: number): void {
  queuePage.value += delta
  void selectFirstVisible()
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

async function loadAutoPublication(): Promise<void> {
  try {
    autoPublication.value = await api('/api/v1/admin/auto-publication')
  } catch (cause) {
    showError(cause)
  }
}

async function toggleAutoPublication(paused: boolean): Promise<void> {
  busy.value = true
  try {
    autoPublication.value = await api('/api/v1/admin/auto-publication', {
      method: 'POST',
      body: JSON.stringify({ paused }),
    })
    notice.value = paused ? '자동 공개를 중지했습니다.' : '자동 공개 예약 실행을 허용했습니다.'
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
  }
}

async function rollbackAutoBatch(id: string): Promise<void> {
  busy.value = true
  try {
    autoPublication.value = await api(`/api/v1/admin/auto-publication/batches/${id}/rollback`, {
      method: 'POST',
    })
    notice.value = '자동 공개를 중지하고 이 묶음의 자동 공개 항목을 취소했습니다.'
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
  }
}

async function loadQueue(): Promise<void> {
  busy.value = true
  error.value = ''
  try {
    if (status.value === 'review') {
      const result = await api<CandidateTriagePayload>('/api/v1/admin/candidates/triage')
      triage.value = result
      queue.value = { items: [], counts: result.counts }
    } else {
      const params = new URLSearchParams({ status: status.value, sort: 'oldest' })
      if (previewFilter.value !== 'all') params.set('preview', previewFilter.value)
      queue.value = await api(`/api/v1/admin/candidates?${params}`)
    }
    if (!visibleItems.value.some((item) => item.id === selected.value?.id)) {
      const first = visibleItems.value[0]
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
  approvalFeedback.value = ''
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
    tagIds: item.tags
      .filter((tag) => tag.confirmed || (isReviewTagAxis(tag.axis) && tag.confidence >= 0.7))
      .map((tag) => tag.id),
  })
}

async function save(refreshQueue = true): Promise<void> {
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
    if (refreshQueue) await loadQueue()
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
    approvalFeedback.value = ''
    await loadQueue()
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
  }
}

async function approve(): Promise<void> {
  if (!selected.value) return
  if (approvalIssues.value.length) {
    approvalFeedback.value = '승인 전에 아래 조건을 완료해 주세요.'
    return
  }
  approvalFeedback.value = ''
  try {
    await save(false)
    const candidate = selected.value
    if (!candidate) return
    busy.value = true
    if (!candidate.previewChecked) {
      selected.value = await api(`/api/v1/admin/candidates/${candidate.id}/preview-checks`, {
        method: 'POST',
        body: JSON.stringify({
          result: 'pass',
          penKey: candidate.penKey,
          viewport: viewport.value,
          failureCodes: [],
        }),
      })
    }
    const checkedCandidate = selected.value
    if (!checkedCandidate) return
    const result = await api<{ slug: string }>(
      `/api/v1/admin/candidates/${checkedCandidate.id}/approve`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ version: checkedCandidate.version }),
      },
    )
    notice.value = `공개했습니다: /examples/${result.slug}`
    await Promise.all([loadQueue(), loadAutoPublication()])
  } catch (cause) {
    showError(cause)
    approvalFeedback.value = error.value
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
    await Promise.all([loadQueue(), loadAutoPublication()])
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
      <div class="admin-header-actions">
        <a href="/">공개 Explore 보기</a>
        <button v-if="authState === 'authenticated'" type="button" @click="logout">로그아웃</button>
      </div>
    </header>

    <section v-if="authState === 'checking'" class="admin-login-panel" aria-live="polite">
      <p class="eyebrow">OWNER ACCESS</p>
      <h2>관리자 세션을 확인하고 있습니다.</h2>
    </section>

    <section v-else-if="authState === 'anonymous'" class="admin-login-panel">
      <p class="eyebrow">OWNER ACCESS</p>
      <h2>GitHub로 관리자 로그인</h2>
      <p>등록된 소유자 GitHub 계정만 검수 화면에 접근할 수 있습니다.</p>
      <p v-if="authMessage === 'forbidden'" class="admin-notice error" role="alert">
        허용된 관리자 계정이 아닙니다.
      </p>
      <p v-else-if="authMessage === 'failed'" class="admin-notice error" role="alert">
        GitHub 로그인을 완료하지 못했습니다. 다시 시도해주세요.
      </p>
      <a class="admin-login-button" href="/api/v1/auth/github/start">GitHub로 계속하기</a>
    </section>

    <section v-else class="admin-stats" aria-label="검수 현황">
      <button
        v-for="item in ['review', 'needs-edit', 'duplicate', 'validation-failed']"
        :key="item"
        type="button"
        :class="{ active: status === item }"
        @click="changeStatus(item)"
      >
        <span>{{
          {
            review: '수집 후보',
            'needs-edit': '수정 필요',
            duplicate: '중복',
            'validation-failed': 'Preview 실패',
          }[item]
        }}</span
        ><strong>{{ queue.counts[item] ?? 0 }}</strong>
      </button>
    </section>
    <section
      v-if="authState === 'authenticated' && status === 'review' && triage"
      class="triage-panel"
      aria-label="자동 사전 분류"
    >
      <div>
        <h2>이번 검수에서 볼 예제</h2>
        <p>
          바로 확인할 만한 후보를 카테고리별로 최대 12개 골랐습니다. 모두 처리할 필요는 없습니다.
          실제 동작은 공개 전에 직접 확인해야 합니다.
        </p>
        <button v-if="skippedIds.size" type="button" class="reset-skipped" @click="resetSkipped">
          이번에 건너뛴 {{ skippedIds.size }}건 다시 보기
        </button>
      </div>
      <div class="triage-filters">
        <button
          v-for="filter in [
            { key: 'shortlist', label: '추천 검수', count: shortlist.length },
            { key: 'all', label: '전체', count: triage.items.length },
            { key: 'hero', label: 'Hero 후보', count: triage.bucketCounts.hero },
            { key: 'ready', label: '최종 확인', count: triage.bucketCounts.ready },
            {
              key: 'preview-needed',
              label: '실행 확인',
              count: triage.bucketCounts['preview-needed'],
            },
            { key: 'missing-info', label: '정보 보완', count: triage.bucketCounts['missing-info'] },
            { key: 'duplicate', label: '중복 의심', count: triage.bucketCounts.duplicate },
            { key: 'invalid-url', label: '주소 오류', count: triage.bucketCounts['invalid-url'] },
            {
              key: 'known-failure',
              label: '기존 실패',
              count: triage.bucketCounts['known-failure'],
            },
          ]"
          :key="filter.key"
          type="button"
          :class="{ active: triageFilter === filter.key }"
          @click="changeTriageFilter(filter.key as ReviewFilter)"
        >
          {{ filter.label }} <strong>{{ filter.count }}</strong>
        </button>
      </div>
    </section>
    <section
      v-if="authState === 'authenticated' && autoPublication"
      class="triage-panel"
      aria-label="자동 공개 운영"
    >
      <div>
        <h2>자동 공개</h2>
        <p>
          하루 최대 8개를 실제 실행 검사합니다. 같은 카테고리의 통과 묶음에서 표본 1개를 먼저
          확인하면 나머지는 다음 예약 실행에서 공개됩니다.
        </p>
        <p>
          상태 <strong>{{ autoPublication.paused ? '중지' : '예약 검사 허용' }}</strong>
          <span v-if="autoPublication.lastRun">
            · 최근 검사 {{ autoPublication.lastRun.status }} ({{
              autoPublication.lastRun.passedCount
            }}/{{ autoPublication.lastRun.examinedCount }})
            <span v-if="autoPublication.lastRun.failureCode">
              · {{ autoPublication.lastRun.failureCode }}</span
            >
          </span>
        </p>
        <button
          type="button"
          :disabled="busy"
          @click="toggleAutoPublication(!autoPublication.paused)"
        >
          {{ autoPublication.paused ? '예약 검사 재개' : '즉시 중지' }}
        </button>
      </div>
      <div v-for="batch in autoPublication.batches" :key="batch.id">
        <strong>{{ batch.status }}</strong>
        <p>표본: {{ batch.sampleTitle }}</p>
        <button
          v-if="batch.status === 'awaiting-sample'"
          type="button"
          :disabled="busy"
          @click="selectCandidate(batch.sampleCandidateId)"
        >
          표본 실행 화면 확인
        </button>
        <span v-if="batch.status === 'published'">자동 공개 {{ batch.publishedCount }}건</span>
        <button
          v-if="batch.status === 'published' || batch.status === 'awaiting-sample'"
          type="button"
          :disabled="busy"
          @click="rollbackAutoBatch(batch.id)"
        >
          묶음 중지·취소
        </button>
        <span v-if="batch.failureCode">{{ batch.failureCode }}</span>
      </div>
    </section>
    <section
      v-if="authState === 'authenticated' && operations"
      class="operations-status"
      aria-label="운영 상태"
    >
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
    <p v-if="authState === 'authenticated' && notice" class="admin-notice success" role="status">
      {{ notice }}
    </p>
    <p v-if="authState === 'authenticated' && error" class="admin-notice error" role="alert">
      {{ error }}
    </p>

    <section
      v-if="authState === 'authenticated'"
      class="review-workspace"
      aria-label="후보 검수 작업 공간"
    >
      <aside class="candidate-queue">
        <div class="queue-toolbar">
          <strong>Queue</strong
          ><select
            v-model="previewFilter"
            aria-label="Preview 확인 필터"
            @change="changePreviewFilter"
          >
            <option value="all">전체</option>
            <option value="unchecked">미확인</option>
            <option value="checked">확인 완료</option>
          </select>
        </div>
        <p v-if="busy && !visibleItems.length">후보를 불러오는 중입니다.</p>
        <p v-else-if="!visibleItems.length">이 조건의 후보가 없습니다.</p>
        <button
          v-for="candidate in visibleItems"
          :key="candidate.id"
          type="button"
          class="candidate-item"
          :class="{ selected: selected?.id === candidate.id }"
          @click="selectCandidate(candidate.id)"
        >
          <span class="candidate-category"
            >{{ candidate.sourceCategory ?? '미분류'
            }}<span v-if="'heroSignal' in candidate && candidate.heroSignal">
              · Hero 후보</span
            ></span
          ><strong>{{ candidate.sourceTitle }}</strong
          ><small
            >{{ candidate.creatorName ?? '작성자 없음' }} · 우선순위
            {{ candidate.priorityScore }}</small
          ><span class="candidate-warning">{{
            'reasons' in candidate
              ? candidate.reasons.join(' · ')
              : candidate.previewChecked
                ? '✓ 실행 확인'
                : '! 미리보기 미확인'
          }}</span>
        </button>
        <div v-if="status === 'review' && reviewItems.length > pageSize" class="queue-pagination">
          <button type="button" :disabled="queuePage === 0" @click="changeQueuePage(-1)">
            이전
          </button>
          <span>{{ queuePage + 1 }} / {{ Math.ceil(reviewItems.length / pageSize) }}</span>
          <button
            type="button"
            :disabled="(queuePage + 1) * pageSize >= reviewItems.length"
            @click="changeQueuePage(1)"
          >
            다음
          </button>
        </div>
      </aside>

      <section v-if="selected" class="live-review">
        <div class="preview-heading">
          <div>
            <p class="eyebrow">LIVE CODEPEN</p>
            <h2>{{ selected.sourceTitle }}</h2>
          </div>
          <a v-if="selected.penKey" :href="selected.canonicalUrl" target="_blank" rel="noreferrer"
            >원본 Pen 열기</a
          >
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
            v-if="selected.embedUrl"
            :key="selected.id"
            :src="selected.embedUrl"
            :style="{ width: frameWidth }"
            :title="`${selected.sourceTitle} by ${selected.creatorName} 실행 화면`"
            referrerpolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          <p v-else>CodePen 주소를 확인해야 실행 화면을 열 수 있습니다.</p>
        </div>
        <p class="interaction-note">
          {{ selected.interactionNote || '화면을 직접 조작해 동작을 확인하세요.' }}
        </p>
        <div class="preview-copy">
          <strong>{{ form.publicTitle }}</strong>
          <p>{{ form.summary }}</p>
        </div>
        <div v-if="approvalIssues.length" class="approval-issues">
          <strong>승인 전 필요한 작업</strong>
          <ul>
            <li v-for="issue in approvalIssues" :key="issue">{{ issue }}</li>
          </ul>
        </div>
        <p v-else class="approval-ready-note">
          실행 화면을 확인했다면 승인 버튼 한 번으로 확인 기록과 공개를 진행합니다.
        </p>
        <div class="preview-decision">
          <button
            v-if="status === 'review' && triageFilter === 'shortlist'"
            type="button"
            :disabled="busy"
            @click="skipSelected"
          >
            이번 검수에서 건너뛰기
          </button>
          <button
            v-if="selected.previewCheck?.result === 'fail'"
            type="button"
            class="pass"
            :disabled="busy || !selected.penKey"
            @click="recordPreview('pass')"
          >
            정상 실행 확인</button
          ><button
            type="button"
            :disabled="busy || !selected.penKey"
            @click="recordPreview('fail')"
          >
            실행 실패 기록</button
          ><button type="button" class="approve" :disabled="busy" @click="approve">
            승인 및 공개
          </button>
        </div>
        <p v-if="approvalFeedback" class="admin-notice error" role="alert">
          {{ approvalFeedback }}
        </p>
      </section>

      <form v-if="selected" class="edit-panel" @submit.prevent="save()">
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
            <option value="source-unavailable">원본 접근 불가</option>
            <option value="license-uncertain">라이선스 불확실</option>
            <option value="insufficient-quality">품질 부족</option>
            <option value="not-animation">애니메이션 아님</option>
            <option value="other">기타</option></select
          ><textarea v-model.trim="decisionNote" rows="2" placeholder="결정 근거를 입력하세요." />
          <div class="decision-actions">
            <button type="button" @click="decide('reject')">거절</button
            ><button type="button" @click="decide('merge')">중복</button
            ><button type="button" @click="decide('needs-edit')">수정 필요</button>
          </div>
        </div>
      </form>
      <div v-else class="empty-review">검수할 후보를 선택하세요.</div>
    </section>
  </main>
</template>
