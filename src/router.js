import Vue from 'vue'
import Router from 'vue-router'
import Header from '@/views/Header'
import Footer from '@/views/Footer'
import Home from '@/views/Home'
import GlobalReport from '@/views/GlobalReport'
import API from '@/views/Api'
import Contact from '@/views/Contact'
import Countries from '@/views/Countries'
import Networks from '@/views/Networks'
import Corona from '@/views/Corona'
import ROV from '@/views/ROV'
import MetisHome from '@/views/MetisHome'
import MetisSelection from '@/views/MetisSelection'
import MetisDeployment from '@/views/MetisDeployment'
import SignUp from '@/views/user/SignUp'
import AccountActivation from '@/views/user/AccountActivation'
import PersonalPage from '@/views/user/PersonalPage'
import ResetPassword from '@/views/user/ResetPassword'
import Documentation from '@/views/Documentation'
import Bgplay from '@/components/ripe/Bgplay'
import PageNotFound from '@/views/PageNotFound'
import AS from '@/views/iyp/AS'
import IYP from '@/views/iyp/IYP'
import Country from '@/views/iyp/Country'
import IXP from '@/views/iyp/IXP'
import Tag from '@/views/iyp/Tag'
import DomainName from '@/views/iyp/DomainName'
import Prefix from '@/views/iyp/Prefix'

Vue.use(Router)

const routerBase = '/:locale/'
const DEFAULT_LOCALE = 'en-us'

export default new Router({
  //The serving HTTP server should handle this properly
  //see https://router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations
  //for apache use FallBackRessource
  mode: 'history',
  base: '/ihr/',
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        selector: to.hash,
        behavior: 'smooth',
      }
    } else {
      if (to.path === from.path) {
        return null
      } else {
        return { x: 0, y: 0 }
      }
    }
  },
  routes: [
    {
      path: '/',
      redirect: '/en-us/',
      meta: { title: 'Internet Health Report' },
    },
    {
      name: 'home',
      path: routerBase,
      components: {
        header: Header,
        footer: Footer,
        default: Home,
      },
      meta: { title: 'Internet Health Report' },
    },
    {
      name: 'global_report',
      path: `${routerBase}global_report`,
      components: {
        header: Header,
        footer: Footer,
        default: GlobalReport,
      },
      meta: { title: 'Global Report - IHR' },
    },
    {
      name: 'contact',
      path: `${routerBase}contact`,
      components: {
        header: Header,
        footer: Footer,
        default: Contact,
      },
      meta: { title: 'Contact - IHR' },
    },
    {
      name: 'countries',
      path: `${routerBase}countries/:cc?`,
      components: {
        header: Header,
        footer: Footer,
        default: Countries,
      },
      meta: { title: 'Country Report - IHR' },
    },
    {
      name: 'networks',
      path: `${routerBase}networks/:asn?`,
      components: {
        header: Header,
        footer: Footer,
        default: Networks,
      },
      meta: { title: 'Network Report - IHR' },
    },
    {
      name: 'rov',
      path: `${routerBase}rov`,
      params: {
        last: 1,
        date: '2021-06-28',
      },
      components: {
        header: Header,
        footer: Footer,
        default: ROV,
      },
      meta: { title: 'Route Origin Validation Report - IHR' },
    },
    {
      name: 'covid19',
      path: `${routerBase}covid19`,
      components: {
        header: Header,
        footer: Footer,
        default: Corona,
      },
      meta: { title: 'COVID19 Report - IHR' },
    },
    {
      name: 'old_as_and_ixp',
      path: '/ihr/:asn/asn/',
      redirect: to => {
        //ihr/:asn/asn/
        const { hash, params, query } = to
        return {
          name: 'networks',
          query: query,
          params: {
            locale: DEFAULT_LOCALE,
            asn: params.asn,
            hash,
          },
        }
      },
    },
    {
      name: 'api',
      path: `${routerBase}api/`,
      components: {
        header: Header,
        footer: Footer,
        default: API,
      },
      meta: { title: 'API - IHR' },
    },
    {
      name: 'sign_up',
      path: `${routerBase}sign_up`,
      components: {
        header: Header,
        footer: Footer,
        default: SignUp,
      },
      meta: { title: 'Sign Up - IHR' },
    },
    {
      name: 'account_activation',
      path: `${routerBase}account_activation`,
      components: {
        header: Header,
        footer: Footer,
        default: AccountActivation,
      },
      meta: { title: 'Account Activation - IHR' },
    },
    {
      name: 'reset_password',
      path: `${routerBase}reset_password`,
      components: {
        header: Header,
        footer: Footer,
        default: ResetPassword,
      },
      meta: { title: 'Reset Password - IHR' },
    },
    {
      name: 'personal_page',
      path: `${routerBase}personal_page`,
      components: {
        header: Header,
        footer: Footer,
        default: PersonalPage,
      },
      meta: { title: 'Personnal Page - IHR' },
    },
    {
      name: 'documentation',
      path: `${routerBase}documentation`,
      components: {
        header: Header,
        footer: Footer,
        default: Documentation,
      },
      meta: { title: 'Documentation - IHR' },
    },
    {
      name: 'PageNotFound',
      path: '*',
      component: PageNotFound,
    },
    {
      name: 'metis',
      path: `${routerBase}metis`,
      components: {
        header: Header,
        footer: Footer,
        default: MetisHome,
      },
      meta: { title: 'Metis - IHR' },
    },
    {
      name: 'metis_selection',
      path: `${routerBase}metis/selection`,
      components: {
        header: Header,
        footer: Footer,
        default: MetisSelection,
      },
      meta: { title: 'Metis Selection - IHR' },
    },
    {
      name: 'metis_deployment',
      path: `${routerBase}metis/deployment`,
      components: {
        header: Header,
        footer: Footer,
        default: MetisDeployment,
      },
      meta: { title: 'Metis Deployment - IHR' },
    },

    // Widgets
    {
      name: 'bgplay',
      path: '/widget/bgplay',
      component: Bgplay,
      props: route => ({
        asNumber: parseInt(route.query.asn),
        dateTime: new Date(route.query.date),
      }),
      meta: { title: 'BGPlay - IHR' },
    },

    // IYP
    {
      name: 'iyp',
      path: `${routerBase}iyp`,
      components: {
        header: Header,
        footer: Footer,
        default: IYP,
      },
      meta: { title: 'IYP - IHR' },
    },
    {
      name: 'iyp_asn',
      path: `${routerBase}iyp/asn/:asn`,
      components: {
        header: Header,
        footer: Footer,
        default: AS,
      },
      meta: { title: 'IYP ASN - IHR' },
    },
    {
      name: 'iyp_country',
      path: `${routerBase}iyp/country/:cc`,
      components: {
        header: Header,
        footer: Footer,
        default: Country,
      },
      meta: { title: 'IYP Country - IHR' },
    },
    {
      name: 'iyp_tag',
      path: `${routerBase}iyp/tag/:tag`,
      components: {
        header: Header,
        footer: Footer,
        default: Tag,
      },
      meta: { title: 'IYP Tag - IHR' },
    },
    {
      name: 'iyp_ixp',
      path: `${routerBase}iyp/ixp/:id`,
      components: {
        header: Header,
        footer: Footer,
        default: IXP,
      },
      meta: { title: 'IYP IXP - IHR' },
    },
    {
      name: 'iyp_prefix',
      path: `${routerBase}iyp/prefix/:host/:prefix_length`,
      components: {
        header: Header,
        footer: Footer,
        default: Prefix,
      },
      meta: { title: 'IYP Prefix - IHR' },
    },
    {
      name: 'iyp_domainname',
      path: `${routerBase}iyp/domainname/:domain`,
      components: {
        header: Header,
        footer: Footer,
        default: DomainName,
      },
      meta: { title: 'IYP Domain Name - IHR' },
    }
  ],
})
