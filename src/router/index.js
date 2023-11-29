import { createRouter, createWebHistory } from 'vue-router'
import Header from '../views/Header.vue'
import Footer from '../views/Footer.vue'
import Home from '../views/Home.vue'
import Tr from '@/i18n/translation'


const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes: [
    {
      path: '/:locale?',
      // redirect: '/en/',
      meta: { title: 'Internet Health Report' },
      beforeEnter: Tr.routeMiddleware,
      children: [
        {
          path: '',
          name: 'home',
          components: {
            header: Header,
            footer: Footer,
            default: Home
          }
        },
        {
          path: 'global-report',
          name: 'global-report',
          components: {
            default: Home
          }
        },
        {
          path: 'networks',
          name: 'networks',
          components: {
            default: Home
          }
        },
        {
          path: 'documentation',
          name: 'documentation',
          components: {
            default: Home
          }
        }
      ]
    }
  ]
})

export default router
