import { RouterView, createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Documentation from '../views/Documentation.vue'
import Contact from '../views/Contact.vue'
import Api from '../views/Api.vue'
import MetisHome from '../views/MetisHome.vue'
import MetisSelection from '../views/MetisSelection.vue'
import MetisDeployment from '../views/MetisDeployment.vue'
import ROV from '../views/ROV.vue'
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
      path: '/:locale?',
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
          path: 'networks/:asn?',
          name: 'networks',
          component: Home
        },
        {
          path: 'documentation',
          name: 'documentation',
          component: Documentation
        },
        {
          path: 'contact',
          name: 'contact',
          component: Contact
        },
        {
          path: 'countries/:cc?',
          name: 'countries',
          component: Home
        },
        {
          path: 'rov',
          name: 'rov',
          component: ROV
        },
        {
          path: 'covid19',
          name: 'covid19',
          component: Home
        },
        {
          path: 'api',
          name: 'api',
          component: Api
        },
        {
          path: 'metis',
          name: 'metis',
          component: MetisHome,
        },
        {
          path: 'metis/selection',
          name: 'metis-selection',
          component: MetisSelection
        },
        {
          path: 'metis/deployment',
          name: 'metis-deployment',
          component: MetisDeployment
        }
      ]
    }
  ]
})

export default router
