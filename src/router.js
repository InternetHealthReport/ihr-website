import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import API from "./views/Documentation.vue";
import Contacts from "./views/Contacts.vue";
import Countries from "./views/Countries.vue";
import Documentation from "./views/Documentation.vue";
import Networks from "./views/Networks.vue";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      component: Home
    },
    {
      path: "/api",
      component: API
    },
    {
      path: "/contacts",
      component: Contacts
    },
    {
      path: "/countries",
      component: Countries
    },
    {
      path: "/docs",
      component: Documentation
    },
    {
      path: "/networks",
      component: Networks
    }
  ]
});
