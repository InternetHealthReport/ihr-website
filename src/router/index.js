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
import PageNotFound from '../views/PageNotFound.vue'
import GlobalReport from '../views/GlobalReport.vue'
import Networks from '../views/Networks.vue'
import Tags from '../views/Tags.vue'
import HostNames from '../views/HostNames.vue'
import Countries from '../views/Countries.vue'
import Ranks from '../views/Ranks.vue'
import Tr from '@/i18n/translation'
import Observable from '../views/Observable.vue'
import NetworkTopology from '../views/NetworkTopology.vue'
import BGPMonitor from '../views/BGPMonitor.vue'
import TracerouteVisualizationTool from '../views/TracerouteVisualizationTool.vue'


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
          path: 'network/:id?',
          name: 'network',
          component: Networks
        },
        {
          path: 'prefix/:ip?/:length?',
          name: 'prefix',
          component: Networks
        },
        {
          path: 'tag/:tag?',
          name: 'tag',
          component: Tags
        },
        {
          path: 'hostname/:hostname?',
          name: 'hostname',
          component: HostNames
        },
        {
          path: 'rank/:rank?',
          name: 'rank',
          component: Ranks
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
          path: 'country/:cc?',
          name: 'country',
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
        },
        {
          path: 'observable',
          name: 'observable',
          component: Observable
        },
        {
          path: 'networks/:id?',
          redirect: to => {
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
          redirect: to => {
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
          component: NetworkTopology
        },
        {
          path: 'bgp-monitor',
          name: 'bgp-monitor',
          component: BGPMonitor
        },
        {
          path: 'traceroute-monitor',
          name: 'traceroute-monitor',
          component: TracerouteVisualizationTool
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'page-not-found',
      component: PageNotFound
    }
  ]
})

export default router
