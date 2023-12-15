<script setup>
import { onMounted, ref } from 'vue';
import { QDrawer } from 'quasar'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'

const SECTIONS = [
    {
        sectionsTitle: 'general',
        sectionsBody: [
            {
                name: 'about',
                numberOfDescriptions: 4,
            },
            {
                name: 'faq',
                numberOfDescriptions: 6,
            },
            {
                name: 'ack',
                numberOfDescriptions: 8,
            }
        ]
    },
    {
        sectionsTitle: 'reports',
        sectionsBody: [
            {
                name: 'globalreport',
                numberOfDescriptions: 0,
            },
            {
                name: 'networkreport',
                numberOfDescriptions: 0,
            },
            {
                name: 'countryreport',
                numberOfDescriptions: 0,
            }
        ]
    },
    {
        sectionsTitle: 'analysisModules',
        sectionsBody: [
            {
                name: 'asdependency',
                numberOfDescriptions: 4,
            },
            {
                name: 'countryasdependency',
                numberOfDescriptions: 3,
            },
            {
                name: 'prefixasdependency',
                numberOfDescriptions: 4,
            },
            {
                name: 'netdelay',
                numberOfDescriptions: 2,
            },
            {
                name: 'delayforward',
                numberOfDescriptions: 4,
            },
            {
                name: 'disco',
                numberOfDescriptions: 3,
            }
        ]
    },
    {
        sectionsTitle: 'dataAccess',
        sectionsBody: [
            {
                name: 'api',
                numberOfDescriptions: 4,
            },
            {
                name: 'pythonlibrary',
                numberOfDescriptions: 5,
            },
            {
                name: 'dumps',
                numberOfDescriptions: 0,
            },
            {
                name: 'datapolicy',
                numberOfDescriptions: 0,
            }
        ]
    }
]

const emit = defineEmits({
    'sidebar-action': (sideBarAction) => {
        if(sideBarAction !== null) {
            return true
        } else {
            return false
        }
    }
})

onMounted(() => {
    emit('sidebar-action', true)
})

const replaceSpaces = (text) => {
    return text.split(' ').join('-').split('(').join('-').split(')').join('-').split("'").join('-')
}

const replaceImgURL = (url) => {
    return `${window.location.origin}/src/${url}`
}

const activateSelection = (sec) => {
  if(sectionActive.value !== '') {
    sectionActiveStatus.value[sectionActive.value] = false
  }
  sectionActiveStatus.value[sec] = true
  sectionActive.value = sec
}

const sections = ref(SECTIONS)
const showSidebar = ref(true)
const sectionActiveStatus = ref(Object.assign({}, ...SECTIONS.map(valA => valA.sectionsBody.map(valB => {
  const obj = {}
  obj[valB.name] = false
  return obj
})).flat()))
const sectionActive = ref('')
</script>

<template>
  <div>
    <QDrawer v-model="showSidebar" side="left" bordered class="IHR_documentation-page-sidebar">
      <h3>{{ $t('documentationPage.title') }}</h3>
      <div v-for="(sec, idx) in sections" v-bind:key="idx">
        <div class="text-weight-light">
          {{ $t(`documentationPage.sectionsTitle.${sec.sectionsTitle}`) }}
        </div>
        <ul >
          <li v-for="(secB, idx) in sec.sectionsBody.map((key) => key.name)" v-bind:key="idx">
            <RouterLink
              :to="Tr.i18nRoute({
                name: 'documentation',
                hash: '#' + replaceSpaces($t(`documentationPage.sections.${secB}.title`)),
              })"
              class="IHR_delikify"
              v-bind:class="{'router-link-inactived': !sectionActiveStatus[secB], 'router-link-actived': sectionActiveStatus[secB]}"
              v-on:click ="activateSelection(secB)"
              >{{ $t(`documentationPage.sections.${secB}.title`) }}</RouterLink>
          </li>
        </ul>
      </div>
    </QDrawer>

    <div id="IHR_documentation-page">
      <div v-for="(mainSec, mainIdx) in sections" v-bind:key="mainIdx">
        <div v-for="(bodySec, bodyIdx) in mainSec.sectionsBody" v-bind:key="bodyIdx" class="IHR_documentation-page">
          <div class="IHR_anchor" :id="replaceSpaces($t(`documentationPage.sections.${bodySec.name}.title`))"></div>
          <h1 v-html="$t(`documentationPage.sections.${bodySec.name}.title`)"></h1>
          <p class="text-left text-body1" v-html="$t(`documentationPage.sections.${bodySec.name}.summary`)"></p>
          <div v-for="idx in bodySec.numberOfDescriptions" v-bind:key="idx">
            <h2 v-html="$t(`documentationPage.sections.${bodySec.name}.description.${idx}.header`)"></h2>
            <img v-if="$t(`documentationPage.sections.${bodySec.name}.description.${idx}.img.src`) !== ''" :src="replaceImgURL($t(`documentationPage.sections.${bodySec.name}.description.${idx}.img.src`))" :style="$t(`documentationPage.sections.${bodySec.name}.description.${idx}.img.style`)" />
            <p class="text-left text-body1" v-html="$t(`documentationPage.sections.${bodySec.name}.description.${idx}.body`)"></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="stylus">
#IHR_
  &documentation-page
    margin 0pt auto
    width 100%
    max-width 1200px
    padding 0 1rem
    overflow-x scroll

.IHR_
  &documentation-page
    & > h1
      line-height 2rem
      padding 0.5rem 0
      font-weight 500
      border-bottom 1px solid #ccc
      margin 4rem 0 1.5rem
      @media screen and (max-width: 720px)
        font-size 22pt
        margin 2rem 0 1rem

    & > div
      & > h2
        margin-top 34pt
        margin-bottom 1rem
        font-size 18pt !important
        font-weight 500
        line-height 1.5rem
        @media screen and (max-width: 600px)
          font-size 16pt
          margin-bottom 10pt
      & > .text-body1
        overflow-anchor none
        & > a
          overflow-anchor none
          word-break break-word
        & > ul
          & > li
            & > a
              word-break break-word
        & > p
          & > a
            word-break break-word

#cod
      background-color: #e7e9eb
      padding:1em
      border-radius: 6pt
      padding-bottom: 0

.IHR_
  &documentation-page-sidebar
    & > h3
      margin-top 2pt
      width 88%
      margin 0px auto
      font-size 16pt
      font-weight 500
      @media screen and (max-width: 600px)
        font-size 12pt

      &:first-letter
        text-transform capitalize

    & > div
      width 82%
      margin 4pt auto 2pt auto

      & a:hover
        border-bottom 1px solid $primary

      & a:active
        border-bottom 1px solid $accent     

      & ul
        margin 5px
        padding 0px

      & li
        list-style-type none
        margin 0px
        padding 0px
        padding-left 15px

.IHR_anchor
  display block
  position relative
  top -100px
  visibility hidden

.router-link-inactived
  border-bottom 0

.router-link-actived
  border-bottom 1px solid red

.router-link-inactived:hover,
.router-link-actived:hover
  border-bottom 1px solid $primary

</style>