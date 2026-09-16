<script setup lang="ts">
import { onMounted } from 'vue'
import { setPageMeta } from '@/app/pageMeta'
onMounted(() =>
  setPageMeta(
    '페이지를 찾을 수 없습니다',
    '요청한 페이지를 찾을 수 없습니다.',
    location.pathname,
    false,
  ),
)
</script>
<template>
  <main id="main-content" class="page status-page">
    <p class="eyebrow">404 · NOT FOUND</p>
    <h1>페이지를 찾을 수 없습니다.</h1>
    <p>주소를 확인하거나 Explore에서 실행 가능한 예제를 찾아보세요.</p>
    <RouterLink class="primary-action" to="/explore">Explore로 이동</RouterLink>
  </main>
</template>
