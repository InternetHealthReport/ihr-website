import Vue from "vue";
import App from "@/App.vue";
import router from "@/router";
import "@/quasar";
import VueResizeText from "vue-resize-text";
import i18n from "@/locales/i18n";
import { IhrApi } from "@/plugins/IhrApi";
import LibraryDelayer from "@/plugins/LibraryDelayer";
import "@/styles/main.styl";

//external plugin
Vue.use(VueResizeText);

// internal plugins
Vue.use(IhrApi);
Vue.use(LibraryDelayer, {
  libraries: {
    ripe_widget_api: "https://stat.ripe.net/widgets/widget_api.js"
  }
});

new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount("#app");
