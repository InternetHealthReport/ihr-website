import Vue from "vue";
import App from "@/App.vue";
import router from "@/router";
import "@/quasar";
import VueResizeText from "vue-resize-text";
import i18n from "@/locales/i18n";
import { IhrApi } from "@/plugins/IhrApi";
import LibraryDelayer from "@/plugins/LibraryDelayer";
import "@/styles/main.styl";
import "@/styles/ihr.style.styl";
import IhrStyle from "./plugins/IhrStyle";
import Fragment from "vue-fragment";

//external plugin
Vue.use(Fragment.Plugin);
Vue.use(VueResizeText);

// internal plugins
Vue.use(IhrApi);
Vue.use(LibraryDelayer, {
  libraries: {
    ripe_widget_api: "https://stat.ripe.net/widgets/widget_api.js",
    latencymon_widget: [
      "https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/latencymon/dev/libs/require.min.js",
      "https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/latencymon/latencymon-widget-main.js"
    ],
    tracemon_widget: [
      "https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/tracemon/dev/libs/require.min.js", //preload require
      "https://atlas.ripe.net/resource/tracemon/tracemon-widget-main.js"
    ],
    google_recaptcha:
      "https://www.google.com/recaptcha/api.js?onload=vueRecaptchaApiLoaded&render=explicit"
  }
});
Vue.use(IhrStyle);

new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount("#app");
