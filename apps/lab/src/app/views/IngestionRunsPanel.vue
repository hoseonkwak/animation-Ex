<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { IngestionRun } from '@/shared/admin'

const props = defineProps<{
  runs: IngestionRun[]
  loading: boolean
  error: string
}>()
const emit = defineEmits<{ refresh: [] }>()

const clock = ref(new Date())
let clockTimer: number | undefined
const kstDay = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const kstHour = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const kstTimestamp = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const scheduledRuns = computed(() =>
  props.runs.filter((run) => run.trigger === 'schedule' && run.sourceName === 'WSSS'),
)
const latestScheduled = computed(() => scheduledRuns.value[0] ?? null)
const recentRuns = computed(() => props.runs.slice(0, 7))
const todayHasNoRun = computed(() => {
  if (props.loading || props.error) return false
  if (kstHour.format(clock.value) < '10:37') return false
  const today = kstDay.format(clock.value)
  return !scheduledRuns.value.some((run) => kstDay.format(new Date(run.startedAt)) === today)
})

function formatTime(value: string): string {
  return kstTimestamp.format(new Date(value))
}

function statusLabel(run: IngestionRun): string {
  if (run.status === 'success')
    return run.acceptedCount === 0 ? '정상 완료 · 신규 0건' : '정상 완료'
  if (run.status === 'partial') return '일부 실패'
  if (run.status === 'failed') return '실패'
  if (run.status === 'paused-limit') return '무료 한도로 중지'
  return '진행 중'
}

onMounted(() => {
  clockTimer = window.setInterval(() => {
    clock.value = new Date()
  }, 60_000)
})
onBeforeUnmount(() => window.clearInterval(clockTimer))
</script>

<template>
  <section class="ingestion-report" aria-label="수집 결과">
    <div class="ingestion-report-heading">
      <div>
        <h2>수집 결과</h2>
        <p>WSSS 예약 수집의 마지막 실행과 최근 기록입니다.</p>
      </div>
      <div class="ingestion-report-actions">
        <button type="button" :disabled="loading" @click="emit('refresh')">새로고침</button>
        <a
          href="https://github.com/hoseonkwak/animation-Ex/actions/workflows/wsss-ingestion.yml"
          target="_blank"
          rel="noopener noreferrer"
          >GitHub 실행 기록</a
        >
      </div>
    </div>

    <p v-if="loading && !runs.length">수집 기록을 확인하는 중입니다.</p>
    <p v-if="error" class="ingestion-report-error" role="alert">{{ error }}</p>
    <div v-if="latestScheduled" class="ingestion-latest" :data-status="latestScheduled.status">
      <div>
        <span>최근 예약 실행</span>
        <strong>{{ statusLabel(latestScheduled) }}</strong>
        <time :datetime="latestScheduled.startedAt"
          >{{ formatTime(latestScheduled.startedAt) }} KST</time
        >
      </div>
      <div class="ingestion-counts">
        <span
          >신규 <strong>{{ latestScheduled.acceptedCount }}</strong></span
        >
        <span
          >중복 <strong>{{ latestScheduled.duplicateCount }}</strong></span
        >
        <span
          >실패 <strong>{{ latestScheduled.failedCount }}</strong></span
        >
      </div>
      <p v-if="latestScheduled.failureCode">원인 코드: {{ latestScheduled.failureCode }}</p>
    </div>
    <p v-else-if="!loading && !error">예약 수집 기록이 아직 없습니다.</p>
    <p v-if="todayHasNoRun" class="ingestion-report-pending">
      오늘 10:37 이후 예약 실행 기록이 아직 없습니다. GitHub 실행 기록에서 지연·실패 여부를
      확인하세요.
    </p>

    <details v-if="recentRuns.length" class="ingestion-history">
      <summary>최근 실행 {{ recentRuns.length }}건 보기</summary>
      <div class="ingestion-history-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">실행 시각 (KST)</th>
              <th scope="col">출처·방식</th>
              <th scope="col">상태</th>
              <th scope="col">신규</th>
              <th scope="col">중복</th>
              <th scope="col">실패</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in recentRuns" :key="run.id">
              <td>
                <time :datetime="run.startedAt">{{ formatTime(run.startedAt) }}</time>
              </td>
              <td>{{ run.sourceName }} · {{ run.trigger === 'schedule' ? '예약' : '수동' }}</td>
              <td>
                {{ statusLabel(run) }}<small v-if="run.failureCode">{{ run.failureCode }}</small>
              </td>
              <td>{{ run.acceptedCount }}</td>
              <td>{{ run.duplicateCount }}</td>
              <td>{{ run.failedCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </section>
</template>
