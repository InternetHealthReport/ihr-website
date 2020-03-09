import Vue from "vue";
import Router from "vue-router";
import Home from "@/views/Home";
import GlobalReport from "@/views/GlobalReport";
import API from "@/views/Api";
import Contact from "@/views/Contact";
import Countries from "@/views/Countries";
import Networks from "@/views/Networks";
import SignUp from "@/views/user/SignUp";
import AccountActivation from "@/views/user/AccountActivation";
import PersonalPage from "@/views/user/PersonalPage";
import ResetPassword from "@/views/user/ResetPassword";
import Documentation from "@/views/Documentation";
import VueScrollTo from 'vue-scrollto';

Vue.use(Router);

const routerBase = "/:locale/";
const DEFAULT_LOCALE = "en-us";

export default new Router({
  mode: "history", //TODO https://router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations
  scrollBehavior: (to) => {
    if (to.hash) {
      VueScrollTo.scrollTo(to.hash, 700);
      return {
        selector: to.hash,
        offset: { x: 0, y: 50 },
      };
    }
    return { x: 0, y: 0 };
  },
  routes: [
    {
      path: "/",
      redirect: "/en-us/",
      meta:{ title: "Internet Health Report"}
    },
    {
      name: "home",
      path: routerBase,
      component: Home,
      meta:{ title: "IHR"}
    },
    {
      name: "global_report",
      path: `${routerBase}global_report`,
      component: GlobalReport,
      meta:{ title: "Global Report - IHR"}
    },
    {
      name: "contact",
      path: `${routerBase}contact`,
      component: Contact,
      meta:{ title: 'Contact - IHR'}
    },
    {
      name: "countries",
      path: `${routerBase}countries`,
      component: Countries,
      meta:{ title: 'Country Report - IHR'}
    },
    {
      name: "networks",
      path: `${routerBase}networks/:asn`,
      component: Networks,
      meta:{ title: 'Network Report - IHR'}
    },
    {
      name: "old_as_and_ixp",
      path: "/ihr/:asn/asn/",
      redirect: to => {
        //ihr/:asn/asn/
        const { hash, params, query } = to;
        return {
          name: "networks",
          query: query,
          params: {
            locale: DEFAULT_LOCALE,
            asn: params.asn,
            hash
          }
        };
      }
    },
    {
      name: "api",
      path: `${routerBase}api/`,
      component: API,
      meta:{ title: 'API - IHR'}
    },
    {
      name: "sign_up",
      path: `${routerBase}sign_up`,
      component: SignUp,
      meta:{ title: 'Sign Up - IHR'}
    },
    {
      name: "account_activation",
      path: `${routerBase}account_activation`,
      component: AccountActivation,
      meta:{ title: 'Account Activation - IHR'}
    },
    {
      name: "reset_password",
      path: `${routerBase}reset_password`,
      component: ResetPassword,
      meta:{ title: 'Reset Password - IHR'}
    },
    {
      name: "personal_page",
      path: `${routerBase}personal_page`,
      component: PersonalPage,
      meta:{ title: 'Personnal Page - IHR'}
    },
    {
      name: "documentation",
      path: `${routerBase}documentation`,
      component: Documentation,
      meta:{ title: 'Documentation - IHR'}
    },
  ]
});
