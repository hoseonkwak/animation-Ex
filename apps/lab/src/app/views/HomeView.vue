<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { ApiSuccess, ExampleCard, ExamplesPayload } from '@/shared/examples'

const examples = ref<ExampleCard[]>([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/api/v1/examples?limit=3&sort=featured')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = (await response.json()) as ApiSuccess<ExamplesPayload>
    examples.value = body.data.items
  } catch {
    errorMessage.value = '예제를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
})

function difficultyLabel(difficulty: ExampleCard['difficulty']): string {
  return {
    beginner: '입문',
    intermediate: '중급',
    advanced: '고급',
  }[difficulty]
}
</script>

<template>
  <main id="main-content" class="home-view">
    <section class="hero">
      <p class="eyebrow">WEB MOTION REFERENCE</p>
      <h1>좋은 움직임을 찾고,<br />바로 실행해보세요.</h1>
      <p class="description">
        웹 애니메이션을 기술과 적용 영역별로 찾고 실제 코드 실행 화면으로 확인하세요.
      </p>
    </section>

    <section class="examples-section" aria-labelledby="examples-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">EXECUTABLE EXAMPLES</p>
          <h2 id="examples-heading">실행 가능한 예제</h2>
        </div>
        <p>데이터베이스에서 공개된 예제만 보여줍니다.</p>
      </div>

      <p v-if="loading" class="status-message" role="status">예제를 불러오는 중입니다.</p>
      <p v-else-if="errorMessage" class="status-message error" role="alert">
        {{ errorMessage }}
      </p>
      <div v-else class="example-grid" data-testid="example-grid">
        <article v-for="example in examples" :key="example.id" class="example-card">
          <div class="preview-frame">
            <iframe
              :title="`${example.title} CodePen 실행 화면`"
              :src="example.preview.embedUrl"
              loading="lazy"
              allowfullscreen
              data-testid="codepen-preview"
            />
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span>{{ difficultyLabel(example.difficulty) }}</span>
              <span v-if="example.featured">추천</span>
            </div>
            <h3>{{ example.title }}</h3>
            <p>{{ example.summary }}</p>
            <ul class="tag-list" aria-label="예제 태그">
              <li v-for="tag in Object.values(example.tags).flat()" :key="tag">
                {{ tag }}
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
