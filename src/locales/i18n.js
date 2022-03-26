import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

function loadLocaleMessages() {
  const locales = require.context('./langs', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })

  return messages
}

let vueI18n = new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en-us',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en-us',
  messages: loadLocaleMessages(),
})

const INTERPOLATION_REGEXP = /^{([^}]+)}|{([^}]+)}/g

Vue.mixin({
  methods: {
    /**
     * Formatter for Vue i18n arrays, joining and wrapping them
     * @param {Array} messageArray array containing string to merge, usually provided by $t()
     * @param {Object} values array containing values to substitute into text e.g  text="{substitute}"; value={"substitute": "realValue"}
     * @param {Array} wrapper array with length 2 each string will be wrapped by this element e.g wrapper=["\<p\>","\</p\>"]
     */
    $interpolateArray(messageArray, values, wrapper) {
      if (wrapper == undefined) {
        wrapper = ['<p>', '</p>']
      } else {
        if (wrapper.length != 2) {
          throw Error('you need 2 element to wrap the string!')
        }
      }
      return Object.keys(messageArray)
        .map(e => messageArray[Number(e)])
        .map(message => {
          let arr = message.split(INTERPOLATION_REGEXP)
          if (arr.length > 1) {
            if (values === undefined) {
              throw Error('please provide the needed parameters')
            }
            message = ''
            let substitute = false
            for (let i = 0; i < arr.length; ++i) {
              if (arr[i] === undefined) {
                continue
              }
              if (substitute) {
                if (values[arr[i]] === undefined) {
                  throw Error('missing parameter -->' + arr[i])
                }
                message += values[arr[i]]
              } else {
                message += arr[i]
              }
              substitute = !substitute
            }
          }
          return wrapper[0] + message + wrapper[1]
        })
        .join(' ')
    },
  },
})

export default vueI18n
