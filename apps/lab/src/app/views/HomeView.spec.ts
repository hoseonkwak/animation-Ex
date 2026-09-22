import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import HomeView from './HomeView.vue'

const api = (input: RequestInfo | URL) => {
  const url = String(input)
  if (url.includes('/discovery')) {
    return Promise.resolve(
      Response.json({
        data: { sections: [], patterns: [], collections: [] },
        meta: { requestId: 'test' },
      }),
    )
  }
  return Promise.resolve(
    Response.json({ data: { items: [], nextCursor: null }, meta: { requestId: 'test' } }),
  )
}

describe('HomeView', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn(api)))

  it('P1-UX-05 한국어 제품 메시지를 표시한다', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: HomeView }],
    })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(HomeView, { global: { plugins: [router] } })

    expect(wrapper.get('h1').text()).toBe('웹 애니메이션 예제')
    expect(wrapper.get('#category-title').text()).toBe('카테고리')
    expect(wrapper.get('#examples-title').text()).toBe('예제')
    expect(wrapper.text()).toContain('실제 코드 실행 화면')
    expect(wrapper.find('a[href="/explore"]').exists()).toBe(true)
  })
})
