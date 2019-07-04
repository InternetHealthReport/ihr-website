import VueI18n from "vue-i18n"
import eng from "./eng/general.js"
import ita from "./ita/general.js"

const messages = {
  en: eng,
  it: ita
};

export default ({ app, Vue }) => {
  Vue.use(VueI18n)
  app.i18n = new VueI18n({
    locale: "en",
    fallbackLocale: "en",
    messages
  })
}