<script setup lang="ts">
import { onMounted } from 'vue'
import { setPageMeta } from '@/app/pageMeta'
onMounted(() =>
  setPageMeta(
    'About',
    'Kwak Motion Lab의 실행 원칙, 출처 정책과 브라우저 저장 방식을 안내합니다.',
    '/about',
  ),
)
</script>
<template>
  <main id="main-content" class="page narrow-page about-page">
    <header class="page-header">
      <p class="eyebrow">ABOUT</p>
      <h1>실제로 실행해보는 웹 모션 라이브러리</h1>
      <p class="description">
        Kwak Motion Lab은 웹 애니메이션을 기술과 적용 영역별로 찾고, 코드가 실행되는 화면으로
        확인하도록 돕습니다.
      </p>
    </header>
    <section>
      <h2>모든 Preview는 실제 코드로 실행됩니다.</h2>
      <p>
        이미지, GIF 또는 녹화 영상으로 움직임을 대신하지 않습니다. 현재 원본 CodePen 예제는 공식
        embed로 실행합니다.
      </p>
    </section>
    <section>
      <h2>제작자와 라이선스를 표시합니다.</h2>
      <p>
        원본 CodePen에는 제작자, Pen 주소와 확인 가능한 라이선스를 함께 표시합니다. WSSS 같은
        디렉터리는 발견 경로로만 내부에 보관합니다.
      </p>
    </section>
    <section>
      <h2>일반 웹 패턴은 새 코드로 다시 만듭니다.</h2>
      <p>
        참고 사이트의 로고, 문구와 독점 에셋을 복사하지 않고 샘플 텍스트, 이미지와 SVG를 사용해
        비슷한 움직임을 새로 제작합니다.
      </p>
    </section>
    <section>
      <h2>저장 목록은 이 브라우저에 있습니다.</h2>
      <p>
        회원가입 없이 저장한 예제와 나중에 연습할 목록을 사용할 수 있습니다. 브라우저 데이터를
        지우면 함께 사라질 수 있습니다.
      </p>
    </section>
    <section>
      <h2>좋은 사례를 함께 알려주세요.</h2>
      <p>URL 제보는 자동 공개되지 않으며 실행과 출처를 확인한 뒤 후보로 정리합니다.</p>
      <RouterLink class="primary-action" to="/submit">URL 제보하기</RouterLink>
    </section>
  </main>
</template>
