import { RouterView, createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Documentation from '../views/Documentation.vue'
import Tr from '@/i18n/translation'


const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if(savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    } else {
      return { top: 0 }
    }
  },
  routes: [
    {
      path: '/:locale/',
      // redirect: '/en/',
      meta: { title: 'Internet Health Report' },
      component: RouterView,
      beforeEnter: Tr.routeMiddleware,
      children: [
        {
          path: '',
          name: 'home',
          component: Home
        },
        {
          path: 'global-report',
          name: 'global-report',
          component: Home
        },
        {
          path: 'networks',
          name: 'networks',
          component: Home
        },
        {
          path: 'documentation',
          name: 'documentation',
          component: Documentation
        }
      ]
    }
  ]
})

export default router
