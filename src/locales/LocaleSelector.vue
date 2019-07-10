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
      import(`quasar/lang/${localeIsoName}`).then(lang => {
        this.$q.lang.set(lang.default);
        //this.$i18n.locale = localeIsoName;
        this.$root.$i18n.locale = localeIsoName;
        this.lang = localeIsoName;
      });
    }
  },
  watch: {
    lang(localeIsoName) {
      this.$router.push({params: {locale: localeIsoName}});
      this.setLocale(localeIsoName);
    }
  },
  created(){
    this.setLocale(this.$route.params.locale);
  }
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
