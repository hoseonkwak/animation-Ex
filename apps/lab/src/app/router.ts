import { createRouter, createWebHistory } from 'vue-router'

import AboutView from '@/app/views/AboutView.vue'
import AdminReviewView from '@/app/views/AdminReviewView.vue'
import ExampleDetailView from '@/app/views/ExampleDetailView.vue'
import ExploreView from '@/app/views/ExploreView.vue'
import HomeView from '@/app/views/HomeView.vue'
import NotFoundView from '@/app/views/NotFoundView.vue'
import PracticeHomeView from '@/app/views/PracticeHomeView.vue'
import PracticeNewView from '@/app/views/PracticeNewView.vue'
import PracticeWorkspaceView from '@/app/views/PracticeWorkspaceView.vue'
import SavedView from '@/app/views/SavedView.vue'
import SectionDetailView from '@/app/views/SectionDetailView.vue'
import SectionsView from '@/app/views/SectionsView.vue'
import SubmitView from '@/app/views/SubmitView.vue'
import { setPageMeta } from '@/app/pageMeta'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/explore', name: 'explore', component: ExploreView },
    { path: '/sections', name: 'sections', component: SectionsView },
    { path: '/sections/:slug', name: 'section-detail', component: SectionDetailView },
    { path: '/examples/:slug', name: 'example-detail', component: ExampleDetailView },
    { path: '/saved', name: 'saved', component: SavedView },
    { path: '/submit', name: 'submit', component: SubmitView },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/practice', name: 'practice-home', component: PracticeHomeView },
    { path: '/practice/new', name: 'practice-new', component: PracticeNewView },
    {
      path: '/practice/drafts/:id',
      name: 'practice-draft',
      component: PracticeWorkspaceView,
      meta: { practiceWorkspace: true },
    },
    {
      path: '/admin/review',
      name: 'admin-review',
      component: AdminReviewView,
      meta: { admin: true },
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.afterEach((to) => {
  if (to.meta.admin) setPageMeta('관리자 검수', '관리자 전용 검수 화면입니다.', to.path, false)
})
