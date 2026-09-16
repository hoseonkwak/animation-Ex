<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import PreviewCard from '@/features/preview/PreviewCard.vue'
import { createPreviewScheduler } from '@/features/preview/previewScheduler'
import type { DiscoveryPayload } from '@/shared/discovery'
import type { ApiSuccess, ExampleCard, ExamplesPayload } from '@/shared/examples'
import { setPageMeta } from '@/app/pageMeta'

const router = useRouter()
const scheduler = createPreviewScheduler(2)
const examples = ref<ExampleCard[]>([])
const discovery = ref<DiscoveryPayload>({ sections: [], patterns: [], collections: [] })
const search = ref('')
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  setPageMeta(
    'Kwak Motion Lab',
    '웹 애니메이션을 기술과 적용 영역별로 찾고 실제 코드 실행 화면으로 확인하세요.',
    '/',
  )
  try {
    const [exampleResponse, discoveryResponse] = await Promise.all([
      fetch('/api/v1/examples?featured=true&sort=featured&limit=4'),
      fetch('/api/v1/discovery'),
    ])
    if (!exampleResponse.ok || !discoveryResponse.ok) throw new Error('load failed')
    examples.value = ((await exampleResponse.json()) as ApiSuccess<ExamplesPayload>).data.items
    discovery.value = ((await discoveryResponse.json()) as ApiSuccess<DiscoveryPayload>).data
  } catch {
    error.value = '추천 콘텐츠를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})

function submitSearch(): void {
  const value = search.value.trim()
  void router.push(value ? { path: '/explore', query: { q: value } } : '/explore')
}
</script>

<template>
  <main id="main-content" class="page home-landing">
    <section class="landing-hero">
      <div>
        <p class="eyebrow">WEB MOTION REFERENCE</p>
        <h1>좋은 움직임을 찾고,<br />바로 실행해보세요.</h1>
        <p class="description">
          웹 애니메이션을 기술과 적용 영역별로 찾고 실제 코드 실행 화면으로 확인하세요.
        </p>
        <div class="hero-actions">
          <RouterLink class="primary-action" to="/explore">애니메이션 둘러보기</RouterLink>
          <RouterLink class="secondary-action" to="/submit">URL 제보</RouterLink>
        </div>
      </div>
      <PreviewCard
        v-if="examples[0]"
        :example="examples[0]"
        :active="scheduler.activeIds.value.includes(examples[0].id)"
        @request="scheduler.request"
        @release="scheduler.release"
      />
    </section>

    <form class="main-search" role="search" @submit.prevent="submitSearch">
      <label for="home-search">어떤 움직임을 찾고 있나요?</label>
      <div class="search-control">
        <input
          id="home-search"
          v-model="search"
          type="search"
          placeholder="GSAP Hero, Scroll Reveal"
        />
        <button type="submit">찾기</button>
      </div>
    </form>

    <p v-if="loading" class="status-message">콘텐츠를 불러오는 중입니다.</p>
    <p v-else-if="error" class="status-message error">{{ error }}</p>
    <template v-else>
      <section class="content-block" aria-labelledby="collections-title">
        <div class="block-heading">
          <div>
            <p class="eyebrow">CURATED</p>
            <h2 id="collections-title">추천 컬렉션</h2>
          </div>
        </div>
        <div class="feature-grid">
          <article
            v-for="collection in discovery.collections"
            :key="collection.slug"
            class="feature-card"
          >
            <p>{{ collection.items.length }}개 예제</p>
            <h3>{{ collection.title }}</h3>
            <p>{{ collection.description }}</p>
            <RouterLink
              :to="`/explore?q=${encodeURIComponent(collection.title.split(' ')[0] ?? '')}`"
              >살펴보기</RouterLink
            >
          </article>
        </div>
      </section>

      <section class="content-block" aria-labelledby="recent-title">
        <div class="block-heading">
          <div>
            <p class="eyebrow">LIVE PREVIEW</p>
            <h2 id="recent-title">추천 실행 예제</h2>
          </div>
          <RouterLink to="/explore">전체 보기</RouterLink>
        </div>
        <div class="example-grid compact-grid">
          <PreviewCard
            v-for="example in examples.slice(1)"
            :key="example.id"
            :example="example"
            :active="scheduler.activeIds.value.includes(example.id)"
            @request="scheduler.request"
            @release="scheduler.release"
          />
        </div>
      </section>

      <section class="content-block" aria-labelledby="sections-title">
        <div class="block-heading">
          <div>
            <p class="eyebrow">BY SECTION</p>
            <h2 id="sections-title">적용 영역으로 찾기</h2>
          </div>
          <RouterLink to="/sections">Sections</RouterLink>
        </div>
        <div class="section-card-grid">
          <RouterLink
            v-for="section in discovery.sections"
            :key="section.key"
            :to="`/sections/${section.key}`"
            class="section-card"
          >
            <strong>{{ section.label }}</strong
            ><span>{{ section.count }}개</span>
            <p>{{ section.description }}</p>
          </RouterLink>
        </div>
      </section>

      <section class="content-block" aria-labelledby="patterns-title">
        <div class="block-heading">
          <div>
            <p class="eyebrow">PATTERNS</p>
            <h2 id="patterns-title">자주 쓰는 움직임</h2>
          </div>
        </div>
        <div class="feature-grid">
          <article v-for="pattern in discovery.patterns" :key="pattern.slug" class="feature-card">
            <p>{{ pattern.count }}개 예제</p>
            <h3>{{ pattern.title }}</h3>
            <p>{{ pattern.summary }}</p>
          </article>
        </div>
      </section>
    </template>

    <section class="submission-cta">
      <div>
        <p class="eyebrow">COMMUNITY INPUT</p>
        <h2>좋은 애니메이션을 발견했나요?</h2>
        <p>주소를 알려주시면 실제 실행과 출처를 확인한 뒤 라이브러리에 정리합니다.</p>
      </div>
      <RouterLink class="primary-action" to="/submit">URL 제보하기</RouterLink>
    </section>
  </main>
</template>
