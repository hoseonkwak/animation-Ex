import { createRouter, createWebHistory } from 'vue-router'

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
  ],
})
