import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import API from "./views/Documentation.vue";
import Contacts from "./views/Contacts.vue";
import Countries from "./views/Countries.vue";
import Documentation from "./views/Documentation.vue";
import Networks from "./views/Networks.vue";

Vue.use(Router);

const routerBase = "/:locale/";

export default new Router({
  routes: [
    {
      path: "/",
      redirect: "/en-us/"
    },
    {
      name: "home",
      path: routerBase,
      component: Home
    },
    {
      name: "api",
      path: `${routerBase}api`,
      component: API
    },
    {
      name: "contacts",
      path: `${routerBase}contacts`,
      component: Contacts
    },
    {
      name: "countries",
      path: `${routerBase}countries`,
      component: Countries
    },
    {
      name: "docs",
      path: `${routerBase}docs`,
      component: Documentation
    },
    {
      name: "networks",
      path: `${routerBase}networks`,
      component: Networks
    }
  ]
});
