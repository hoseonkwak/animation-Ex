import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import HomeView from './HomeView.vue'

describe('HomeView', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ data: { items: [], nextCursor: null }, meta: { requestId: 'test' } }),
        ),
    )
  })

  it('P1-UX-05 한국어 제품 메시지를 표시한다', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: HomeView }],
    })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(HomeView, { global: { plugins: [router] } })

    expect(wrapper.get('h1').text()).toContain('좋은 움직임을 찾고')
    expect(wrapper.text()).toContain('실제 코드 실행 화면')
  })
})
