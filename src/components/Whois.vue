<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import { QSpinner } from 'quasar'
import '@/styles/chart.css'
import hljs from 'highlight.js'
import 'highlight.js/scss/vs.scss'

const whois = inject('whois')

const props = defineProps(['asNumber', 'getPrefix', 'hostName', 'pageTitle'])

const route = useRoute()

const whois_data = ref('')
const isLoading = ref(false)

const load = async () => {
  isLoading.value = true
  if (props.asNumber) {
    whois_data.value = (await whois.asn(props.asNumber))?.data
    if (whois_data.value) {
      whois_data.value = whois.formatAsn(whois_data.value)
    }
  } else if (props.getPrefix) {
    whois_data.value = (await whois.prefix(props.getPrefix))?.data
    if (whois_data.value) {
      whois_data.value = whois.formatPrefix(whois_data.value)
    }
  } else if (props.hostName) {
    whois_data.value = (await whois.domain(props.hostName))?.data
    if (whois_data.value) {
      whois_data.value = whois.formatDomain(whois_data.value)
    }
  }
  isLoading.value = false
}

watch(
  () => props.asNumber,
  () => {
    load()
  }
)

watch(
  () => props.getPrefix,
  () => {
    load()
  }
)

watch(
  () => props.hostName,
  () => {
    load()
  }
)

onMounted(() => {
  load()
})
</script>

<template>
  <div v-if="!isLoading">
    <div v-if="whois_data">
      <pre
        style="text-align: left"
      ><code style="white-space: pre-wrap;" v-html="hljs.highlight(whois_data, { language: 'text' }).value"></code></pre>
    </div>
    <div v-else>
      No RDAP URL available for
      <span v-if="asNumber">AS{{ asNumber }}.</span>
      <span v-if="getPrefix">prefix {{ getPrefix }}.</span>
      <span v-if="hostName">hostname {{ hostName }}.</span>
      Please try to run the following command in your terminal.
      <div v-if="asNumber">
        <pre
          style="text-align: left"
        ><code style="white-space: pre-wrap;" v-html="hljs.highlight(`whois AS${asNumber}`, { language: 'bash' }).value"></code></pre>
      </div>
      <div v-if="getPrefix">
        <pre
          style="text-align: left"
        ><code style="white-space: pre-wrap;" v-html="hljs.highlight(`whois ${getPrefix}`, { language: 'bash' }).value"></code></pre>
      </div>
      <div v-if="hostName">
        <pre
          style="text-align: left"
        ><code style="white-space: pre-wrap;" v-html="hljs.highlight(`whois ${hostName}`, { language: 'bash' }).value"></code></pre>
      </div>
    </div>
  </div>
  <div v-else class="IHR_loading-spinner">
    <QSpinner color="secondary" size="15em" />
  </div>
</template>
