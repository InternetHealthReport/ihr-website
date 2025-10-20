<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import { QMarkupTable, QSpinner } from 'quasar'
import '@/styles/chart.css'
import hljs from 'highlight.js'
import 'highlight.js/scss/vs.scss'

const whois = inject('whois')

const props = defineProps(['asNumber', 'getPrefix', 'hostName', 'pageTitle'])

const route = useRoute()

const whois_data = ref({})
const isLoading = ref(false)

const load = async () => {
  isLoading.value = true
  if (props.asNumber) {
    whois_data.value = (await whois.asn(props.asNumber))?.data
  } else if (props.getPrefix) {
    whois_data.value = (await whois.prefix(props.getPrefix))?.data
  } else if (props.hostName) {
    whois_data.value = (await whois.domain(props.hostName))?.data
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
      ><code style="white-space: pre-wrap;" v-html="hljs.highlight(JSON.stringify(whois_data, null, 2), { language: 'json' }).value"></code></pre>
    </div>
    <!-- <QMarkupTable dense flat v-if="whois_data">
      <tbody>
        <tr v-if="whois_data.name">
          <td>Network Name</td>
          <td>{{ whois_data.name }}</td>
        </tr>
        <tr v-if="whois_data.handle">
          <td>Handle</td>
          <td>{{ whois_data.handle }}</td>
        </tr>
        <tr v-if="whois_data.status">
          <td>Status</td>
          <td>
            <div v-for="value in whois_data.status">{{ value }}</div>
          </td>
        </tr>
        <tr v-if="whois_data.events">
          <td>Events</td>
          <td>
            <div v-for="item in whois_data.events">
              <div>{{ item.eventAction }}</div>
              <div>{{ item.eventDate }}</div>
            </div>
          </td>
        </tr>
        <tr v-if="whois_data.entities">
          <td>Entities</td>
          <td>
            <div v-for="item in whois_data.entities">
              <div>{{ item.handle }}</div>
              <div v-for="value in item.roles">{{ value }}</div>
              <div v-for="value in item.vcardArray">{{ value }}</div>
              <div>{{ item.events }}</div>
              <div v-for="value in item.links">
                <a target="_blank" :href="value.href">{{ value.value }}</a>
              </div>
              <div>{{ item.publicIds }}</div>
              <div>{{ item.entities }}</div>
            </div>
          </td>
        </tr>
        <tr v-if="whois_data.nameservers">
          <td>Nameservers</td>
          <td>
            <div v-for="item in whois_data.nameservers">
              <div>{{ item.ldhName }}</div>
            </div>
          </td>
        </tr>
        <tr v-if="whois_data.secureDNS">
          <td>DNSSEC</td>
          <td>{{ whois_data.secureDNS }}</td>
        </tr>
        <tr v-if="whois_data.remarks">
          <td>Remarks</td>
          <td>
            <div v-for="item in whois_data.remarks">
              <div>{{ item.title }}</div>
              <div v-for="value in item.description">{{ value }}</div>
              <div v-for="value in item.links">
                <a target="_blank" :href="value.href">{{ value.value }}</a>
              </div>
            </div>
          </td>
        </tr>
        <tr v-if="whois_data.notices">
          <td>Notices</td>
          <td>
            <div v-for="item in whois_data.notices">
              <div>{{ item.title }}</div>
              <div v-for="value in item.description">{{ value }}</div>
              <div v-for="value in item.links">
                <a target="_blank" :href="value.href">{{ value.value }}</a>
              </div>
            </div>
          </td>
        </tr>
        <tr v-if="whois_data.links">
          <td>Links</td>
          <td>
            <div v-for="item in whois_data.links">
              <a target="_blank" :href="item.href">{{ item.value }}</a>
            </div>
          </td>
        </tr>
        <tr v-if="whois_data.port43">
          <td>Whois Server</td>
          <td>{{ whois_data.port43 }}</td>
        </tr>
        <tr v-if="whois_data.rdapConformance">
          <td>Conformance</td>
          <td>
            <div v-for="value in whois_data.rdapConformance">{{ value }}</div>
          </td>
        </tr>
      </tbody>
    </QMarkupTable> -->
    <div v-else>
      RDAP error. Please try to run the following command in your terminal.
      <pre style="text-align: left">
        <code v-if="asNumber" style="white-space: pre-wrap;" v-html="hljs.highlight(`whois AS${asNumber}`, { language: 'bash' }).value"></code>
        <code v-if="getPrefix" style="white-space: pre-wrap;" v-html="hljs.highlight(`whois ${getPrefix}`, { language: 'bash' }).value"></code>
        <code v-if="hostName" style="white-space: pre-wrap;" v-html="hljs.highlight(`whois ${hostName}`, { language: 'bash' }).value"></code>
      </pre>
    </div>
  </div>
  <div v-else class="IHR_loading-spinner">
    <QSpinner color="secondary" size="15em" />
  </div>
</template>
