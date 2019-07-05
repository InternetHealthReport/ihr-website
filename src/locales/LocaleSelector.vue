<template>
  <span id="lang-selector">
    <q-select
      v-model="lang"
      :options="langOptions"
      dense
      borderless
      emit-value
      map-options
      options-dense
      items-aligned="false"
      dark
    >
      <template v-slot:selected>
        <div class="flag-container">
          <img :src="require('@/assets/imgs/flags/' + lang + '.png')" :alt="lang" />
        </div>
      </template>
    </q-select>
  </span>
</template>

<script>
import languages from "quasar/lang/index.json";
import i18n from "./i18n";

export default {
  data() {
    let langOptions = [];
    require
      .context("./langs", true, /[A-Za-z0-9-_,\s]+\.json$/i)
      .keys()
      .forEach(locale => {
        locale = locale.substring(2, locale.length - 5);
        let lang = languages.find(lang => {
          return locale === lang.isoName;
        });
        if (lang) {
          langOptions.push({ label: lang.nativeName, value: lang.isoName });
        }
      });

    return {
      lang: "en-us",
      langOptions: langOptions
    };
  },
  methods: {
    setLocale(localeIsoName) {
      if(localeIsoName === undefined) {
        localeIsoName = this.$q.cookies.get("locale");
        if (
          localeIsoName === undefined ||
          this.langOptions.find(lang_opt => {
            return lang_opt.value === localeIsoName;
          }) === undefined
        )
          localeIsoName = "en-us";
      }
      import(`quasar/lang/${localeIsoName}`).then(lang => {
        this.$q.lang.set(lang.default);
        //this.$i18n.locale = localeIsoName;
        this.$root.$i18n.locale = localeIsoName;
        this.$q.cookies.set("locale", localeIsoName);
        this.lang = localeIsoName;
      });
    }
  },
  watch: {
    lang(localeIsoName) {
      this.setLocale(localeIsoName);
    }
  },
  created(){
    this.setLocale();
  },
};
</script>
<style scoped>
#lang-selector {
  min-width: 100px;
}

#lang-selector .flag-container {
  text-align: right;
  width: 100%;
}
</style>
