import { RouterView, createRouter, createWebHistory } from 'vue-router'
import Tr from '@/i18n/translation'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
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
          component: () => import('../views/Home.vue')
        },
        {
          path: 'global-report',
          name: 'global-report',
          component: () => import('../views/GlobalReport.vue')
        },
        {
          path: 'network/:id?',
          name: 'network',
          component: () => import('../views/Networks.vue')
        },
        {
          path: 'prefix/:ip?/:length?',
          name: 'prefix',
          component: () => import('../views/Networks.vue')
        },
        {
          path: 'tag/:tag?',
          name: 'tag',
          component: () => import('../views/Tags.vue')
        },
        {
          path: 'hostname/:hostname?',
          name: 'hostname',
          component: () => import('../views/HostNames.vue')
        },
        {
          path: 'rank/:rank?',
          name: 'rank',
          component: () => import('../views/Ranks.vue')
        },
        {
          path: 'documentation',
          name: 'documentation',
          component: () => import('../views/Documentation.vue')
        },
        {
          path: 'contact',
          name: 'contact',
          component: () => import('../views/Contact.vue')
        },
        {
          path: 'country/:cc?',
          name: 'country',
          component: () => import('../views/Countries.vue')
        },
        {
          path: 'rov',
          name: 'rov',
          component: () => import('../views/ROV.vue')
        },
        {
          path: 'covid19',
          name: 'covid19',
          component: () => import('../views/Corona.vue')
        },
        {
          path: 'api',
          name: 'api',
          component: () => import('../views/Api.vue')
        },
        {
          path: 'metis',
          name: 'metis',
          component: () => import('../views/MetisHome.vue')
        },
        {
          path: 'metis/selection',
          name: 'metis-selection',
          component: () => import('../views/MetisSelection.vue')
        },
        {
          path: 'metis/deployment',
          name: 'metis-deployment',
          component: () => import('../views/MetisDeployment.vue')
        },
        {
          path: 'observable',
          name: 'observable',
          component: () => import('../views/Observable.vue')
        },
        {
          path: 'networks/:id?',
          redirect: (to) => {
            return {
              name: 'network',
              query: {
                ...to.query,
                active: 'monitoring'
              }
            }
          }
        },
        {
          path: 'countries/:cc?',
          redirect: (to) => {
            return {
              name: 'country',
              query: {
                ...to.query,
                active: 'monitoring'
              }
            }
          }
        },
        {
          path: 'network-topology',
          name: 'network-topology',
          component: () => import('../views/NetworkTopology.vue')
        },
        {
          path: 'bgp-monitor',
          name: 'bgp-monitor',
          component: () => import('../views/BGPMonitor.vue')
        },
        {
          path: 'traceroute-monitor',
          name: 'traceroute-monitor',
          component: () => import('../views/TracerouteVisualizationTool.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'page-not-found',
      component: () => import('../views/PageNotFound.vue')
    }
  ]
})

export default router
