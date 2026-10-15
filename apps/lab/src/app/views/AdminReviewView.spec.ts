import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import AdminReviewView from './AdminReviewView.vue'

describe('AdminReviewView', () => {
  it('승인 조건이 부족하면 버튼에서 이유를 안내하고 공개 요청을 보내지 않는다', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      let data: unknown

      if (url.endsWith('/auth/session')) {
        data = { authenticated: true }
      } else if (url.endsWith('/admin/candidates/triage')) {
        data = {
          items: [
            {
              id: 'candidate-1',
              sourceTitle: 'GSAP 예제',
              sourceCategory: 'GSAP',
              creatorName: 'Author',
              priorityScore: 50,
              createdAt: '2026-10-15T00:00:00.000Z',
              previewChecked: false,
              heroSignal: false,
              bucket: 'missing-info',
              reasons: ['제목·요약·slug 보완'],
            },
          ],
          counts: { review: 1 },
          bucketCounts: {
            hero: 0,
            ready: 0,
            'preview-needed': 0,
            'missing-info': 1,
            duplicate: 0,
            'invalid-url': 0,
            'known-failure': 0,
          },
        }
      } else if (url.endsWith('/admin/candidates/candidate-1')) {
        data = {
          id: 'candidate-1',
          status: 'review',
          sourceTitle: 'GSAP 예제',
          sourceCategory: 'GSAP',
          creatorName: 'Author',
          priorityScore: 50,
          version: 1,
          createdAt: '2026-10-15T00:00:00.000Z',
          previewChecked: false,
          tags: [],
          publicTitle: '',
          summary: '',
          slug: '',
          difficulty: 'intermediate',
          featured: false,
          interactionNote: '',
          canonicalUrl: 'https://codepen.io/author/pen/example',
          penId: 'example',
          penKey: 'author/example',
          embedUrl: '',
          licenseCode: 'MIT',
          licenseEvidenceUrl: 'https://codepen.io/author/pen/example',
          lastCheckedAt: null,
          previewCheck: null,
          reviewHistory: [],
        }
      } else if (url.endsWith('/admin/operations')) {
        data = {
          environment: 'local',
          ingestionPaused: false,
          usage: { level: 'normal', maximumRatio: 0 },
        }
      } else {
        throw new Error(`예상하지 못한 요청: ${url}`)
      }

      return Promise.resolve(Response.json({ data, meta: { requestId: 'test' } }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AdminReviewView)
    await flushPromises()

    expect(wrapper.text()).toContain('승인 전 필요한 작업')
    await wrapper.get('button.approve').trigger('click')

    expect(wrapper.get('[role="alert"]').text()).toContain('승인 전에 아래 조건을 완료해 주세요.')
    expect(wrapper.text()).toContain('현재 Pen 실행 확인이 필요합니다.')
    expect(fetchMock.mock.calls.every(([url]) => !String(url).endsWith('/approve'))).toBe(true)
  })
})
