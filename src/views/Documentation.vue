<i18n src="@/locales/long_langs/documentation.json"></i18n>
<template>
  <div>
      <q-drawer :value="showSidebar" side="left" bordered content-class="IHR_documentation-page-sidebar">
        <h3>{{$t('documentationPage.title')}}</h3>
        <div>
            <div class="text-weight-light">{{$t('documentationPage.sectionsTitle.general')}}</div>
            <ul>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.about.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.about.title")}}</router-link>
                </li>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.faq.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.faq.title")}}</router-link>
                </li>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.ack.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.ack.title")}}</router-link>
                </li>
            </ul>
        </div>
        <div>
        </div>
        <div>
            <div class="text-weight-light">{{$t('documentationPage.sectionsTitle.analysisModules')}}</div>
            <ul>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.asdependency.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.asdependency.title")}}</router-link>
                </li>
                </li>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.delayforward.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.delayforward.title")}}</router-link>
                </li>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.disco.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.disco.title")}}</router-link>
                </li>
            </ul>
        </div>
        <div>
            <div class="text-weight-light">{{$t('documentationPage.sectionsTitle.dataAccess')}}</div>
            <ul>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.api.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.api.title")}}</router-link>
                </li>
                </li>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.pythonlibrary.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.pythonlibrary.title")}}</router-link>
                </li>
                <li>
                <router-link
                    :to="{name : 'documentation', hash: '#'+replaceSpaces($t(`documentationPage.sections.datapolicy.title`))}"
                    class="IHR_delikify"
                >{{$t("documentationPage.sections.datapolicy.title")}}</router-link>
                </li>
            </ul>
        </div>
      </q-drawer>

      <div id="IHR_documentation-page" >
        <div v-for="sec in $t('documentationPage.sections')" 
            class="IHR_documentation-page">
            <div :id="replaceSpaces(sec.title)"></div>
            <h1 v-html='sec.title'></h1>
          <p class="text-left text-body1" v-html='sec.summary'></p>
          <div 
            v-for="sub in sec.description"
              >
              <h2 v-html="sub.header"></h2>
              <p class="text-left text-body1" v-html="sub.body"></p>
          </div>
        </div>
      </div>

  </div>
</template>

<script>
export default {
  props: {
    showSidebar: {
      type: Boolean,
      default: true
    }
  },
  mounted() {
    this.$emit("sidebar-action", true);
  },
  methods: {
      replaceSpaces(text) {
          return text.split(' ').join('_');
      } 
  }
};
</script>

<style lang="stylus">
@import '~quasar-variables';

#IHR_
  &documentation-page
    width 90%
    margin 0pt auto

.IHR_
  &documentation-page
    & > h1
        line-height 1.5rem
        padding 0.5rem 0
        font-weight 500;
        border-bottom 1px solid #ccc
        margin 4rem 0 1.5rem

    & > h2
      margin-bottom 20pt


.IHR_
  &documentation-page-sidebar
    & > h3
      margin-top 2pt
      width 88%
      margin 0px auto
      font-size 15pt
      font-weight 500

      &:first-letter
        text-transform capitalize

    & > div
      width 82%
      margin 4pt auto 2pt auto

      & a:hover
        padding-bottom 2pt
        border-bottom 2px solid $secondary

      & a:active
        border-bottom 2px solid $accent

      & ul
        margin 5px 
        padding 0px

      & li
        list-style-type none
        margin 0px
        padding 0px
        padding-left 15px

</style>

