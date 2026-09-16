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
