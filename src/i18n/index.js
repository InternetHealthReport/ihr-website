import { createI18n } from 'vue-i18n'
import axios from 'axios'

const i18n = async () => {
  const messages = (await axios.get('/locales/en.json')).data
  return createI18n({
    locale: import.meta.env.VITE_DEFAULT_LOCALE,
    fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE,
    legacy: false,
    globalInjection: true,
    warnHtmlMessage: false,
    messages: { en: messages }
  })
}

export default await i18n()
