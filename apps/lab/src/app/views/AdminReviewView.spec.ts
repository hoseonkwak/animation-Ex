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

    expect(wrapper.text()).toContain('추천 검수 0')
    await wrapper
      .findAll('.triage-filters button')
      .find((button) => button.text().includes('정보 보완'))!
      .trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('승인 전 필요한 작업')
    await wrapper.get('button.approve').trigger('click')

    expect(wrapper.get('[role="alert"]').text()).toContain('승인 전에 아래 조건을 완료해 주세요.')
    expect(wrapper.text()).toContain('탐색에 사용할 애니메이션 태그가 필요합니다.')
    expect(fetchMock.mock.calls.every(([url]) => !String(url).endsWith('/approve'))).toBe(true)
  })

  it('실행 화면을 본 후보는 승인 한 번에 문구 저장, 실행 확인, 공개를 순서대로 처리한다', async () => {
    const calls: string[] = []
    let published = false
    const detail = {
      id: 'candidate-2',
      status: 'review',
      sourceTitle: 'Scroll Demo',
      sourceCategory: 'Animation/GSAP',
      creatorName: 'Author',
      priorityScore: 50,
      version: 1,
      createdAt: '2026-10-15T00:00:00.000Z',
      previewChecked: false,
      previewCheck: null,
      tags: [
        {
          id: 'tag-gsap',
          axis: 'technology',
          key: 'gsap',
          confidence: 1,
          confirmed: false,
        },
      ],
      publicTitle: 'Scroll Demo',
      summary: '스크롤 애니메이션을 확인할 수 있는 예제입니다.',
      slug: 'pen-author-abc123',
      difficulty: 'intermediate',
      featured: false,
      interactionNote: '',
      canonicalUrl: 'https://codepen.io/author/pen/AbC123',
      penId: 'AbC123',
      penKey: 'author/AbC123',
      embedUrl: 'https://codepen.io/author/embed/AbC123?default-tab=result',
      licenseCode: 'MIT',
      licenseEvidenceUrl: 'https://codepen.io/author/pen/AbC123',
      lastCheckedAt: null,
      reviewHistory: [],
    }
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      let data: unknown
      if (url.endsWith('/auth/session')) data = { authenticated: true }
      else if (url.endsWith('/admin/operations'))
        data = {
          environment: 'local',
          ingestionPaused: false,
          usage: { level: 'normal', maximumRatio: 0 },
        }
      else if (url.endsWith('/admin/candidates/triage'))
        data = {
          items: published
            ? []
            : [
                {
                  id: 'candidate-2',
                  sourceTitle: 'Scroll Demo',
                  sourceCategory: 'Animation/GSAP',
                  creatorName: 'Author',
                  priorityScore: 50,
                  createdAt: '2026-10-15T00:00:00.000Z',
                  previewChecked: false,
                  heroSignal: false,
                  bucket: 'preview-needed',
                  reasons: ['실제 Preview 확인 필요'],
                },
              ],
          counts: { review: published ? 0 : 1 },
          bucketCounts: {},
        }
      else if (url.endsWith('/admin/candidates/candidate-2') && method === 'GET') data = detail
      else if (url.endsWith('/admin/candidates/candidate-2') && method === 'PATCH') {
        calls.push('save')
        const body = JSON.parse(String(init?.body)) as { tagIds: string[]; summary: string }
        expect(body.summary).toBe(detail.summary)
        expect(body.tagIds).toEqual(['tag-gsap'])
        data = { ...detail, version: 2 }
      } else if (url.endsWith('/preview-checks')) {
        calls.push('preview')
        data = { ...detail, version: 2, previewChecked: true }
      } else if (url.endsWith('/approve')) {
        calls.push('approve')
        published = true
        data = { slug: detail.slug }
      } else throw new Error(`예상하지 못한 요청: ${method} ${url}`)
      return Promise.resolve(Response.json({ data, meta: { requestId: 'test' } }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AdminReviewView)
    await flushPromises()
    expect(wrapper.text()).toContain('실행 화면을 확인했다면 승인 버튼 한 번으로')
    await wrapper.get('button.approve').trigger('click')
    await flushPromises()

    expect(calls).toEqual(['save', 'preview', 'approve'])
    expect(wrapper.text()).toContain('공개했습니다: /examples/pen-author-abc123')
  })
})
