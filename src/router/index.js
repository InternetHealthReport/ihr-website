import { RouterView, createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Documentation from '../views/Documentation.vue'
import Contact from '../views/Contact.vue'
import Api from '../views/Api.vue'
import MetisHome from '../views/MetisHome.vue'
import MetisSelection from '../views/MetisSelection.vue'
import MetisDeployment from '../views/MetisDeployment.vue'
import ROV from '../views/ROV.vue'
import Corona from '../views/Corona.vue'
import Networks from '../views/Networks.vue'
import Countries from '../views/Countries.vue'
import PageNotFound from '../views/PageNotFound.vue'
import GlobalReport from '../views/GlobalReport.vue'
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
      if (from && Object.keys(to.query).length) {
        if (to.fullPath.split('?')[0] == from.fullPath.split('?')[0]) {
          return
        }
      }
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
          component: GlobalReport
        },
        {
          path: 'networks/:asn?',
          name: 'networks',
          component: Networks
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
          component: Countries
        },
        {
          path: 'rov',
          name: 'rov',
          component: ROV
        },
        {
          path: 'covid19',
          name: 'covid19',
          component: Corona
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
    },
    {
      path: '/:pathMatch(.*)',
      name: 'page-not-found',
      component: PageNotFound
    }
  ]
})

export default router
