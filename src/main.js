import Vue from "vue";
import App from "@/App.vue";
import router from "@/router";
import "@/quasar";
import i18n from "@/locales/i18n";
import { IhrApi } from "@/plugins/IhrApi";

Vue.config.productionTip = false;

//plugins
Vue.use(IhrApi);

new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount("#app");
