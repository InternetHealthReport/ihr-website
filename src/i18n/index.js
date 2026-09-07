import { createI18n } from 'vue-i18n'
import axios from 'axios'
import { getConfig } from '@/config'

const i18n = async () => {
  const config = getConfig()
  const messages = (await axios.get('/locales/en.json')).data
  return createI18n({
    locale: config.DEFAULT_LOCALE,
    fallbackLocale: config.FALLBACK_LOCALE,
    legacy: false,
    globalInjection: true,
    warnHtmlMessage: false,
    messages: { en: messages }
  })
}

export default await i18n()
