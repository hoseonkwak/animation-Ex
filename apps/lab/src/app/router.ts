import { createRouter, createWebHistory } from 'vue-router'

import AdminReviewView from '@/app/views/AdminReviewView.vue'
import HomeView from '@/app/views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? undefined
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/admin/review',
      name: 'admin-review',
      component: AdminReviewView,
    },
  ],
})
