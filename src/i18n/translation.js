import i18n from '@/i18n'
import { nextTick } from 'vue'
import { get, set } from 'idb-keyval'

const Trans = {
  set currentLocale(newLocale) {
    i18n.global.locale.value = newLocale
  },

  isLocaleSupported(locale) {
    return Trans.supportedLocales.includes(locale)
  },

  getUserLocale() {
    const locale = window.navigator.language || window.navigator.userLanguage || Trans.defaultLocale
    return {
      locale: locale,
      localeNoRegion: locale.split('-')[0]
    }
  },

  async getPersistedLocale() {
    const persistedLocale = await get('user-locale')
    if (Trans.isLocaleSupported(persistedLocale)) {
      return persistedLocale
    } else {
      return null
    }
  },

  guessDefaultLocale() {
    const userPersistedLocale = Trans.getPersistedLocale()
    if (userPersistedLocale) {
      return userPersistedLocale
    }
    const userPreferredLocale = Trans.getUserLocale()
    if (Trans.isLocaleSupported(userPreferredLocale.locale)) {
      return userPreferredLocale.locale
    }
    if (Trans.isLocaleSupported(userPreferredLocale.localeNoRegion)) {
      return userPreferredLocale.localeNoRegion
    }
    return Trans.defaultLocale
  },

  get defaultLocale() {
    return import.meta.env.VITE_DEFAULT_LOCALE
  },

  get supportedLocales() {
    return import.meta.env.VITE_SUPPORTED_LOCALES.split(',')
  },

  async routeMiddleware(to, _from, next) {
    let paramLocale = to.params.locale
    if (paramLocale.includes('-')) {
      paramLocale = paramLocale.split('-')[0]
    }
    if (!Trans.isLocaleSupported(paramLocale)) {
      return next(Trans.guessDefaultLocale())
    }
    await Trans.switchLanguage(paramLocale)
    return next()
  },

  get currentLocale() {
    return i18n.global.locale.value
  },

  i18nRoute(to) {
    return {
      ...to,
      params: {
        locale: Trans.currentLocale,
        ...to.params
      }
    }
  },

  async switchLanguage(newLocale) {
    await Trans.loadLocaleMessages(newLocale)
    Trans.currentLocale = newLocale
    document.querySelector('html').setAttribute('lang', newLocale)
    if (JSON.parse(await get('storage-allowed'))) {
      await set('user-locale', newLocale)
    }
  },

  async loadLocaleMessages(locale) {
    if (!i18n.global.availableLocales.includes(locale)) {
      const messages = await import(`@/i18n/locales/${locale}.json`)
      i18n.global.setLocaleMessage(locale, messages.default)
    }
    return nextTick()
  }
}

export default Trans
