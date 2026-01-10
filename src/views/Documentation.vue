<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { QCard, QCardSection, QBtn, useQuasar } from 'quasar'
import Tr from '@/i18n/translation'

const $q = useQuasar()

// copy function
const copyLabel = ref('Copy page')
const copyIcon = ref('content_copy')
const copying = ref(false)

const SECTIONS = [
  {
    sectionsTitle: 'general',
    sectionsBody: [
      { name: 'about', numberOfDescriptions: 4 },
      { name: 'faq', numberOfDescriptions: 6 },
      { name: 'ack', numberOfDescriptions: 11 }
    ]
  },
  {
    sectionsTitle: 'reports',
    sectionsBody: [
      { name: 'globalreport', numberOfDescriptions: 0 },
      { name: 'networkreport', numberOfDescriptions: 0 },
      { name: 'countryreport', numberOfDescriptions: 0 }
    ]
  },
  {
    sectionsTitle: 'analysisModules',
    sectionsBody: [
      { name: 'asdependency', numberOfDescriptions: 4 },
      { name: 'countryasdependency', numberOfDescriptions: 3 },
      { name: 'prefixasdependency', numberOfDescriptions: 4 },
      { name: 'netdelay', numberOfDescriptions: 2 },
      { name: 'delayforward', numberOfDescriptions: 4 },
      { name: 'disco', numberOfDescriptions: 3 }
    ]
  },
  {
    sectionsTitle: 'dataAccess',
    sectionsBody: [
      { name: 'api', numberOfDescriptions: 4 },
      { name: 'pythonlibrary', numberOfDescriptions: 5 },
      { name: 'dumps', numberOfDescriptions: 0 },
      { name: 'datapolicy', numberOfDescriptions: 0 }
    ]
  }
]

const emit = defineEmits({
  'sidebar-action': (sideBarAction) => {
    return sideBarAction !== null
  }
})

onMounted(() => {
  emit('sidebar-action', true)
})

const replaceSpaces = (text) => {
  return text.split(' ').join('-').split('(').join('-').split(')').join('-').split("'").join('-')
}

const activateSelection = (sec) => {
  if (sectionActive.value !== '') {
    sectionActiveStatus.value[sectionActive.value] = false
  }
  sectionActiveStatus.value[sec] = true
  sectionActive.value = sec
}

const copyToClipboard = async () => {
  const contentElement = document.getElementById('IHR_documentation-page')
  
  if (contentElement) {
    try {
      const textToCopy = contentElement.innerText
      await navigator.clipboard.writeText(textToCopy)
      copyLabel.value = 'Copied!'
      copyIcon.value = 'check'
      copying.value = true
      $q.notify({
        message: 'Documentation copied to clipboard',
        color: 'positive',
        icon: 'check',
        position: 'top',
        timeout: 1000
      })
      setTimeout(() => {
        copyLabel.value = 'Copy page'
        copyIcon.value = 'content_copy'
        copying.value = false
      }, 2000)
      
    } catch (err) {
      console.error('Failed to copy: ', err)
      $q.notify({
        message: 'Failed to copy',
        color: 'negative',
        icon: 'error'
      })
    }
  }
}

const sections = ref(SECTIONS)
const sectionActiveStatus = ref(
  Object.assign(
    {},
    ...SECTIONS.map((valA) =>
      valA.sectionsBody.map((valB) => {
        const obj = {}
        obj[valB.name] = false
        return obj
      })
    ).flat()
  )
)
const sectionActive = ref('')
</script>

<template>
  <div class="IHR_documentation-container">
    
    <div class="IHR_copy-button-wrapper">
      <QBtn
        rounded
        no-caps
        :icon="copyIcon"
        :label="copyLabel"
        :color="copying ? 'positive' : 'black'"
        text-color="white"
        class="q-px-md q-py-sm shadow-10"
        @click="copyToClipboard"
      />
    </div>

    <QCard class="IHR_documentation-page-sidebar">
      <QCardSection>
        <h3>{{ $t('documentationPage.title') }}</h3>
        <div v-for="(sec, idx) in sections" :key="idx" class="q-pl-sm q-pb-xs">
          <div class="text-weight-light">
            {{ $t(`documentationPage.sectionsTitle.${sec.sectionsTitle}`) }}
          </div>
          <ul>
            <li v-for="(secB, idx) in sec.sectionsBody.map((key) => key.name)" :key="idx">
              <RouterLink
                :to="
                  Tr.i18nRoute({
                    name: 'documentation',
                    hash: '#' + replaceSpaces($t(`documentationPage.sections.${secB}.title`))
                  })
                "
                class="IHR_delikify"
                :class="{
                  'router-link-inactived': !sectionActiveStatus[secB],
                  'router-link-actived': sectionActiveStatus[secB]
                }"
                @click="activateSelection(secB)"
              >
                {{ $t(`documentationPage.sections.${secB}.title`) }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </QCardSection>
    </QCard>

    <div id="IHR_documentation-page">
      <div v-for="(mainSec, mainIdx) in sections" :key="mainIdx">
        <div
          v-for="(bodySec, bodyIdx) in mainSec.sectionsBody"
          :key="bodyIdx"
          class="IHR_documentation-page"
        >
          <div
            :id="replaceSpaces($t(`documentationPage.sections.${bodySec.name}.title`))"
            class="IHR_anchor"
          ></div>
          <h1 v-html="$t(`documentationPage.sections.${bodySec.name}.title`)"></h1>
          <p
            class="text-left text-body1"
            v-html="$t(`documentationPage.sections.${bodySec.name}.summary`)"
          ></p>
          <div v-for="idx in bodySec.numberOfDescriptions" :key="idx">
            <h2
              v-html="$t(`documentationPage.sections.${bodySec.name}.description.${idx}.header`)"
            ></h2>
            <img
              v-if="
                $t(`documentationPage.sections.${bodySec.name}.description.${idx}.img.src`) !== ''
              "
              :src="$t(`documentationPage.sections.${bodySec.name}.description.${idx}.img.src`)"
              :style="$t(`documentationPage.sections.${bodySec.name}.description.${idx}.img.style`)"
            />
            <p
              class="text-left text-body1"
              v-html="$t(`documentationPage.sections.${bodySec.name}.description.${idx}.body`)"
            ></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.IHR_documentation-container {
  display: flex;
  width: 100%;
  position: relative;
}

.IHR_copy-button-wrapper {
  position: fixed;
  bottom: 2rem;
  right: 5rem;
  z-index: 5000;
}

@media screen and (max-width: 720px) {
  .IHR_copy-button-wrapper {
    bottom: 4.5rem;
    right: 1.5rem;
  }
}
#IHR_documentation-page {
  flex: 1;
  margin: 0 auto;
  max-width: 1200px;
  padding: 0 1rem;
  overflow-x: auto;
}

.IHR_documentation-page > h1 {
  line-height: 2rem;
  padding: 0.5rem 0;
  font-weight: 500;
  border-bottom: 1px solid #ccc;
  margin: 4rem 0 1.5rem;
}

.IHR_documentation-page > div > h2 {
  margin-top: 2.875rem;
  margin-bottom: 1rem;
  font-size: 1.5rem !important;
  font-weight: 500;
  line-height: 1.5rem;
}

.IHR_documentation-page > div > .text-body1 {
  overflow-anchor: none;
}

.IHR_documentation-page > div > .text-body1 > a,
.IHR_documentation-page > div > .text-body1 > ul > li > a,
.IHR_documentation-page > div > .text-body1 > p > a {
  word-break: break-word;
}

#cod {
  background-color: #e7e9eb;
  padding: 1em;
  border-radius: 0.5rem;
  padding-bottom: 0;
}

.IHR_anchor {
  display: block;
  position: relative;
  top: -100px;
  visibility: hidden;
}

.IHR_documentation-page-sidebar {
  height: 100vh;
  width: 300px;
  border-right: 1px solid #ccc;
  background-color: #f9f9f9;
  overflow-y: auto;
  position: sticky;
  top: 0;
}

.IHR_documentation-page-sidebar h3 {
  padding-bottom: 5px;
  font-size: 1.25rem;
  font-weight: 500;
}

.IHR_documentation-page-sidebar ul {
  margin: 2px;
  padding: 5px 0;
}

.IHR_documentation-page-sidebar li {
  list-style-type: none;
  padding-left: 12px;
}

.IHR_documentation-page-sidebar a {
  text-decoration: none;
  color: inherit;
}

.IHR_documentation-page-sidebar a:hover {
  border-bottom: 1px solid #263238;
}

.IHR_documentation-page-sidebar a:active {
  border-bottom: 1px solid #405057;
}

.router-link-inactived {
  border-bottom: 0;
}

.router-link-actived {
  border-bottom: 1px solid #f00;
}

.router-link-inactived:hover,
.router-link-actived:hover {
  border-bottom: 1px solid #263238;
}

@media screen and (max-width: 720px) {
  .IHR_documentation-page-sidebar {
    display: none;
  }

  #IHR_documentation-page {
    margin: 0;
    padding: 0 1rem;
  }

  .IHR_documentation-page > h1 {
    font-size: 1.8125rem;
    margin: 2rem 0 1rem;
  }

  .IHR_documentation-page > div > h2 {
    font-size: 1.25rem;
    margin-bottom: 0.8125rem;
  }
}
</style>