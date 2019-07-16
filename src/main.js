import Vue from "vue";
import App from "@/App.vue";
import router from "@/router";
import "@/quasar";
import i18n from "@/locales/i18n";
import { IhrApi } from "@/plugins/IhrApi";
import VueResizeText from "vue-resize-text";
import "@/styles/main.styl";

Vue.config.productionTip = false;

// internal plugins
Vue.use(IhrApi);

//external plugin
Vue.use(VueResizeText);

new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount("#app");
