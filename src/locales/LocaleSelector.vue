<template>
  <q-btn dense flat no-wrap id="lang-selector" class="flag-img-container" @click="rotateIcon = true">
    <img :src="require(`@/assets/imgs/flags/${lang}.png`)" :alt="actual" />
    <q-icon name="fas fa-sort-down" size="16px" :class="$ihrStyle.rotateItem(rotateIcon)" />
    <q-menu auto-close @before-hide="rotateIcon = false">
      <q-list dense dark id="lang-selector-menu">
        <q-item>
          <q-item-section>
            <strong>{{ actual }}</strong>
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable v-for="language in availables" @click="setLocale(language.value)" :key="language.value" class="row">
          <q-item-section class="col-2 flag-img-container">
            <img :src="require(`@/assets/imgs/flags/${language.value}.png`)" :alt="language.label" />
          </q-item-section>
          <q-item-section class="col-10">
            {{ language.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script>
import languages from 'quasar/lang/index.json'

export default {
  data() {
    let langOptions = []
    require
      .context('./langs', true, /[A-Za-z0-9-_,\s]+\.json$/i)
      .keys()
      .forEach(locale => {
        locale = locale.substring(2, locale.length - 5)
        let lang = languages.find(lang => {
          return locale === lang.isoName
        })
        if (lang) {
          langOptions.push({ label: lang.nativeName, value: lang.isoName })
        }
      })

    return {
      lang: 'en-us',
      langOptions: langOptions,
      rotateIcon: false,
    }
  },
  methods: {
    setLocale(localeIsoName) {
      if (localeIsoName == 'ihr' || localeIsoName == undefined) {
        //backward compatibility
        localeIsoName = 'en-us'
      }
      import(`quasar/lang/${localeIsoName}`).then(lang => {
        this.$q.lang.set(lang.default)
        //this.$i18n.locale = localeIsoName;
        this.$root.$i18n.locale = localeIsoName
        this.lang = localeIsoName
      })
    },
  },
  watch: {
    lang(localeIsoName) {
      this.$router.push({ params: { locale: localeIsoName } })
      this.setLocale(localeIsoName)
    },
  },
  created() {
    this.setLocale(this.$route.params.locale)
  },
  computed: {
    actual() {
      return this.langOptions.filter(lang => lang.value === this.lang)[0].label
    },
    availables() {
      return this.langOptions.filter(lang => lang.value !== this.lang)
    },
  },
}
</script>

<style scoped lang="stylus">
@import '~quasar-variables'

#lang-selector
  & .flag-img-container
    & > img
      width 22px

#lang-selector-menu
  background-color $info
</style>
