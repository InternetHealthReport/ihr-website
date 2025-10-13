<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import { QMarkupTable, QSpinner } from 'quasar'
import '@/styles/chart.css'

const whois = inject('whois')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()

const whois_data = ref({})
const isLoading = ref(false)

const load = async () => {
  isLoading.value = true
  whois_data.value = (await whois.asn(props.asNumber)).data
  isLoading.value = false
}

watch(
  () => props.asNumber,
  () => {
    load()
  }
)

onMounted(() => {
  load()
})
</script>

<template>
  <QMarkupTable dense flat>
    <tbody>
      <tr>
        <td>Network Name</td>
        <td>{{ whois_data.name }}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td>
          <div v-for="value in whois_data.status">{{ value }}</div>
        </td>
      </tr>
      <tr>
        <td>Events</td>
        <td>
          <div v-for="item in whois_data.events">
            <div>{{ item.eventAction }}</div>
            <div>{{ item.eventDate }}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>Entities</td>
        <td>
          <div v-for="item in whois_data.entities">
            <div>{{ item.handle }}</div>
            <div>{{ item.roles }}</div>
            <div>{{ item.vcardArray }}</div>
            <div>{{ item.events }}</div>
            <div>{{ item.links }}</div>
          </div>
        </td>
      </tr>
      <tr>
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
      <tr>
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
      <tr>
        <td>Links</td>
        <td>
          <div v-for="item in whois_data.links">
            <a target="_blank" :href="item.href">{{ item.value }}</a>
          </div>
        </td>
      </tr>
      <tr>
        <td>Whois Server</td>
        <td>{{ whois_data.port43 }}</td>
      </tr>
      <tr>
        <td>Conformance</td>
        <td>
          <div v-for="value in whois_data.rdapConformance">{{ value }}</div>
        </td>
      </tr>
    </tbody>
  </QMarkupTable>
  <div v-if="isLoading" class="IHR_loading-spinner">
    <QSpinner color="secondary" size="15em" />
  </div>
</template>
