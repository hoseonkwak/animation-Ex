import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'

import type { ExampleCard } from '@/shared/examples'

import PreviewCard from './PreviewCard.vue'

const example: ExampleCard = {
  id: 'example-one',
  slug: 'example-one',
  title: '예제',
  summary: '실행 오류 격리 검사',
  origin: 'original-pen',
  difficulty: 'beginner',
  featured: false,
  preview: {
    kind: 'codepen',
    penId: 'abc',
    embedUrl: 'https://codepen.io/example/embed/abc',
  },
  tags: {},
  publishedAt: '2026-09-16T00:00:00.000Z',
}

describe('PreviewCard', () => {
  it('썸네일을 유지하고 클릭한 뒤에만 큰 미리보기에서 실제 코드를 실행한다', async () => {
    const wrapper = mount(PreviewCard, {
      props: { example, active: false },
      global: { stubs: { Teleport: true, RouterLink: true } },
    })

    expect(wrapper.get('.preview-thumbnail img').attributes('src')).toBe(
      'https://codepen.io/example/pen/abc/image/large.png',
    )
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.emitted('request')).toBeUndefined()

    await wrapper.get('.preview-thumbnail').trigger('click')
    expect(wrapper.emitted('request')?.[0]).toEqual(['example-one', true])

    await wrapper.setProps({ active: true })
    await nextTick()
    expect(wrapper.find('.preview-thumbnail').exists()).toBe(true)
    expect((wrapper.get('dialog').element as HTMLDialogElement).open).toBe(true)
    expect(wrapper.get('iframe').attributes('src')).toBe(example.preview.embedUrl)
    expect(wrapper.get('iframe').attributes('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-forms allow-popups',
    )
    expect(wrapper.get('iframe').attributes('referrerpolicy')).toBe(
      'strict-origin-when-cross-origin',
    )

    await wrapper.get('[aria-label="미리보기 닫기"]').trigger('click')
    expect(wrapper.emitted('release')?.[0]).toEqual(['example-one'])
    await wrapper.setProps({ active: false })
    expect(wrapper.get('.preview-thumbnail').exists()).toBe(true)
    expect(wrapper.find('iframe').exists()).toBe(false)
    wrapper.unmount()
  })

  it('썸네일 로딩에 실패해도 실행 버튼을 유지한다', async () => {
    const wrapper = mount(PreviewCard, { props: { example, active: false } })
    await wrapper.get('.preview-thumbnail img').trigger('error')
    expect(wrapper.get('.thumbnail-fallback').text()).toBe(example.title)
    await wrapper.get('.preview-thumbnail').trigger('click')
    expect(wrapper.emitted('request')?.[0]).toEqual(['example-one', true])
    wrapper.unmount()
  })

  it('iframe 오류를 모달에서 보여주고 다시 시도할 수 있다', async () => {
    const failed = mount(PreviewCard, {
      props: { example, active: true },
      global: { stubs: { Teleport: true, RouterLink: true } },
    })

    await failed.get('iframe').trigger('error')

    expect(failed.get('.example-card').attributes('data-preview-state')).toBe('error')
    expect(failed.get('[role="alert"]').text()).toContain('미리보기를 실행하지 못했습니다')
    await failed.get('[role="alert"] button').trigger('click')
    expect(failed.get('.example-card').attributes('data-preview-state')).toBe('loading')
    failed.unmount()
  })
})
