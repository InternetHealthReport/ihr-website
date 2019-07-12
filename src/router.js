import Vue from "vue";
import Router from "vue-router";
import Home from "@/views/Home";
import API from "@/views/Documentation";
import Contacts from "@/views/Contacts";
import Countries from "@/views/Countries";
import Documentation from "@/views/Documentation";
import Networks from "@/views/Networks";
import AsAndIxp from "@/views/AsAndIxp";

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
    },
    {
      name: "as_and_ixp",
      path: `${routerBase}as_and_ixp/:asn`,
      component: AsAndIxp
    }
  ]
});
