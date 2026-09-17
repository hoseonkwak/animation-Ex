<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const featuredExample = computed(
  () =>
    examples.value.find((example) => example.slug === 'interactive-card-hover') ??
    examples.value[0],
)
const otherExamples = computed(() =>
  examples.value.filter((example) => example.id !== featuredExample.value?.id),
)

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

function requestFeaturedPreview(id: string): void {
  scheduler.request(id, true)
}
</script>

<template>
  <main id="main-content" class="page home-landing">
    <section class="landing-hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="eyebrow">웹 애니메이션 예제 라이브러리</p>
        <h1 id="home-title">웹 애니메이션 예제,<br /><em>여기서 찾아보세요.</em></h1>
        <p class="description">
          스크롤, 슬라이드, 버튼 효과를 태그로 찾고 실제 움직임을 바로 볼 수 있어요. 마음에 드는
          예제는 CodePen에서 코드를 열어보세요.
        </p>
        <div class="hero-actions">
          <RouterLink class="primary-action" to="/explore"
            >예제 둘러보기 <span aria-hidden="true">↗</span></RouterLink
          >
          <a class="secondary-action" href="#how-it-works">이용 방법 보기</a>
        </div>
        <p class="hero-caption">가입 없이 무료로 둘러볼 수 있어요.</p>
      </div>
      <div class="hero-gallery">
        <div class="gallery-topline">
          <span>대표 예제</span><span>썸네일을 누르면 실제 코드로 실행돼요</span>
        </div>
        <PreviewCard
          v-if="featuredExample"
          :example="featuredExample"
          :active="scheduler.activeIds.value.includes(featuredExample.id)"
          @request="requestFeaturedPreview"
          @release="scheduler.release"
        />
        <div v-else class="gallery-empty" aria-hidden="true">KM<span>✳</span></div>
        <p class="gallery-bottomline">
          썸네일을 눌러 움직임을 확인하고 CodePen에서 코드를 열어보세요.
        </p>
      </div>
    </section>

    <section id="how-it-works" class="quick-guide" aria-labelledby="quick-guide-title">
      <div class="quick-guide-intro">
        <p class="eyebrow">처음 오셨나요?</p>
        <h2 id="quick-guide-title">이렇게 둘러보세요</h2>
      </div>
      <ol>
        <li>
          <span>1</span><strong>찾아보기</strong>
          <p>태그와 적용 영역으로 원하는 효과를 찾으세요.</p>
        </li>
        <li>
          <span>2</span><strong>움직임 보기</strong>
          <p>실제 코드로 실행된 화면을 바로 확인하세요.</p>
        </li>
        <li>
          <span>3</span><strong>코드 열어보기</strong>
          <p>CodePen에서 구현 코드를 살펴보세요.</p>
        </li>
      </ol>
    </section>

    <form class="main-search" role="search" @submit.prevent="submitSearch">
      <div class="search-intro">
        <label for="home-search">찾고 싶은 애니메이션이 있나요?</label>
      </div>
      <div class="search-control">
        <input
          id="home-search"
          v-model="search"
          type="search"
          placeholder="예: 스크롤 효과, 버튼 호버, 슬라이드"
        />
        <button type="submit">찾기</button>
      </div>
    </form>

    <p v-if="loading" class="status-message">콘텐츠를 불러오는 중입니다.</p>
    <p v-else-if="error" class="status-message error">{{ error }}</p>
    <template v-else>
      <section class="content-block live-block" aria-labelledby="recent-title">
        <div class="block-heading">
          <div>
            <p class="eyebrow">추천 예제</p>
            <h2 id="recent-title">움직이는 예제를 더 살펴보세요</h2>
          </div>
          <RouterLink to="/explore">모든 예제 보기 ↗</RouterLink>
        </div>
        <p class="section-lede">썸네일로 예제를 고르고, 눌러서 실제 움직임을 확인하세요.</p>
        <div class="example-grid compact-grid">
          <PreviewCard
            v-for="example in otherExamples"
            :key="example.id"
            :example="example"
            :active="scheduler.activeIds.value.includes(example.id)"
            @request="scheduler.request"
            @release="scheduler.release"
          />
        </div>
      </section>

      <section class="content-block section-index-block" aria-labelledby="sections-title">
        <div class="block-heading">
          <div>
            <p class="eyebrow">적용 영역별 탐색</p>
            <h2 id="sections-title">어디에 쓸 애니메이션인가요?</h2>
          </div>
          <RouterLink to="/sections">전체 영역 보기 ↗</RouterLink>
        </div>
        <div class="section-card-grid">
          <RouterLink
            v-for="(section, index) in discovery.sections"
            :key="section.key"
            :to="`/sections/${section.key}`"
            class="section-card"
          >
            <span class="section-index">0{{ index + 1 }}</span>
            <strong>{{ section.label }}</strong>
            <p>{{ section.description }}</p>
            <span class="section-count"
              >{{ section.count }}개 예제 <span aria-hidden="true">↗</span></span
            >
          </RouterLink>
        </div>
      </section>

      <section class="content-block collection-block" aria-labelledby="collections-title">
        <div class="block-heading">
          <div>
            <p class="eyebrow">주제별 모음</p>
            <h2 id="collections-title">추천 컬렉션</h2>
          </div>
        </div>
        <div class="feature-grid collection-grid">
          <article
            v-for="(collection, index) in discovery.collections"
            :key="collection.slug"
            class="feature-card"
          >
            <p>컬렉션 0{{ index + 1 }}</p>
            <h3>{{ collection.title }}</h3>
            <p>{{ collection.description }}</p>
            <RouterLink
              :to="`/explore?q=${encodeURIComponent(collection.title.split(' ')[0] ?? '')}`"
            >
              {{ collection.items.length }}개 예제 살펴보기 <span aria-hidden="true">↗</span>
            </RouterLink>
          </article>
        </div>
      </section>

      <section class="content-block pattern-block" aria-labelledby="patterns-title">
        <div class="block-heading">
          <div>
            <p class="eyebrow">애니메이션 패턴</p>
            <h2 id="patterns-title">자주 쓰는 움직임</h2>
          </div>
        </div>
        <div class="pattern-list">
          <article v-for="(pattern, index) in discovery.patterns" :key="pattern.slug">
            <span>0{{ index + 1 }}</span>
            <h3>{{ pattern.title }}</h3>
            <p>{{ pattern.summary }}</p>
            <strong>{{ pattern.count }}개 예제</strong>
          </article>
        </div>
      </section>
    </template>

    <section class="submission-cta">
      <div>
        <p class="eyebrow">함께 모으는 라이브러리</p>
        <h2>좋은 애니메이션을 발견했나요?</h2>
        <p>주소를 알려주시면 실제 실행과 출처를 확인한 뒤 라이브러리에 정리합니다.</p>
      </div>
      <RouterLink class="primary-action" to="/submit">URL 제보하기</RouterLink>
    </section>
  </main>
</template>
