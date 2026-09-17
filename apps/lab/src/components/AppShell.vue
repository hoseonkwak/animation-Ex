<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useLibraryLists } from '@/features/library/useLibraryLists'

const theme = ref<'light' | 'dark'>('light')
const menuOpen = ref(false)
const library = useLibraryLists()

onMounted(() => {
  const stored = localStorage.getItem('kwak-motion:theme')
  theme.value = stored === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme.value
})

function toggleTheme(): void {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem('kwak-motion:theme', theme.value)
}
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink class="brand" to="/" aria-label="Kwak Motion Lab 홈">
          <span class="brand-mark" aria-hidden="true">K<span>✳</span></span>
          <span>Kwak <strong>Motion Lab</strong></span>
        </RouterLink>
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="primary-navigation"
          @click="menuOpen = !menuOpen"
        >
          메뉴
        </button>
        <nav id="primary-navigation" :class="{ open: menuOpen }" aria-label="주요 메뉴">
          <RouterLink to="/explore" @click="menuOpen = false">예제 탐색</RouterLink>
          <RouterLink to="/sections" @click="menuOpen = false">영역별 보기</RouterLink>
          <RouterLink to="/about" @click="menuOpen = false">소개</RouterLink>
          <RouterLink to="/saved" @click="menuOpen = false">
            저장함<span v-if="library.savedCount.value"> {{ library.savedCount.value }}</span>
          </RouterLink>
          <button class="theme-switch" type="button" @click="toggleTheme">
            {{ theme === 'light' ? '다크' : '라이트' }}
          </button>
        </nav>
      </div>
    </header>
    <slot />
    <div v-if="library.state.showStorageNotice" class="storage-notice" role="status">
      <p>이 목록은 현재 브라우저에 저장됩니다. 브라우저 데이터를 삭제하면 함께 사라질 수 있어요.</p>
      <button type="button" @click="library.dismissNotice">확인</button>
    </div>
    <footer class="site-footer">
      <div>
        <strong>Kwak Motion Lab</strong>
        <p>웹 애니메이션을 실제 코드 실행 화면으로 탐색하는 라이브러리입니다.</p>
      </div>
      <nav aria-label="하단 메뉴">
        <RouterLink to="/explore">예제 탐색</RouterLink>
        <RouterLink to="/sections">영역별 보기</RouterLink>
        <RouterLink to="/submit">URL 제보</RouterLink>
        <RouterLink to="/about">출처 정책</RouterLink>
      </nav>
      <p>외부 CodePen 콘텐츠의 권리는 각 제작자에게 있습니다.</p>
    </footer>
  </div>
</template>
