import { mount } from '@vue/test-utils'
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
  it('썸네일을 보여주고 클릭할 때만 실제 Preview를 요청한다', async () => {
    const wrapper = mount(PreviewCard, { props: { example, active: false } })

    expect(wrapper.get('.preview-thumbnail img').attributes('src')).toBe(
      'https://codepen.io/example/pen/abc/image/large.png',
    )
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.emitted('request')).toBeUndefined()

    await wrapper.get('.preview-thumbnail').trigger('click')
    expect(wrapper.emitted('request')?.[0]).toEqual(['example-one', true])

    await wrapper.setProps({ active: true })
    expect(wrapper.find('.preview-thumbnail').exists()).toBe(false)
    expect(wrapper.get('iframe').attributes('src')).toBe(example.preview.embedUrl)
    expect(wrapper.get('iframe').attributes('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-forms allow-popups',
    )
    expect(wrapper.get('iframe').attributes('referrerpolicy')).toBe(
      'strict-origin-when-cross-origin',
    )

    await wrapper.get('.preview-toolbar button').trigger('click')
    await wrapper.setProps({ active: false })
    expect(wrapper.get('.preview-thumbnail').exists()).toBe(true)
  })

  it('썸네일 로딩에 실패해도 실행 버튼을 유지한다', async () => {
    const wrapper = mount(PreviewCard, { props: { example, active: false } })
    await wrapper.get('.preview-thumbnail img').trigger('error')
    expect(wrapper.get('.thumbnail-fallback').text()).toBe(example.title)
    await wrapper.get('.preview-thumbnail').trigger('click')
    expect(wrapper.emitted('request')?.[0]).toEqual(['example-one', true])
  })

  it('한 카드의 iframe 오류를 해당 카드 안에서 처리한다', async () => {
    const failed = mount(PreviewCard, { props: { example, active: true } })
    const healthy = mount(PreviewCard, {
      props: { example: { ...example, id: 'example-two' }, active: true },
    })

    await failed.get('iframe').trigger('error')

    expect(failed.attributes('data-preview-state')).toBe('error')
    expect(failed.get('[role="alert"]').text()).toContain('실행하지 못했습니다')
    expect(healthy.find('iframe').exists()).toBe(true)
  })
})
