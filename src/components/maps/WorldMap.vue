<script setup>
import { ref, onMounted } from 'vue'
import ReactiveChart from '@/components/charts/ReactiveChart.vue'
import { isoCountries, countryISOMapping, getCountryISOCode2 } from '@/plugins/countryName'

const countryNames = ref(Object.values(isoCountries))
const countryCodes = ref(Object.values(countryISOMapping))
const loading = ref(false)

const emit = defineEmits(['country-selected'])

const layout = {
  title: {
    text: 'Select a country',
  },
  geo: {
    showframe: false,
    projection: {
      type: 'equirectangular'
    },
    showcountries: true,
    showcoastlines: true,
  },
  autosize: true,
  margin: {
    l: 10,
    r: 10,
    t: 40,
    b: 0
  },
}

const traces = ref([
  {
    type: 'choropleth',
    locationmode: 'ISO-3',
    locations: [],
    z: [],
    text: [],
    hoverinfo: 'text',
    autocolorscale: false,
    showscale: false
  }
])

const fetchData = async () => {
  loading.value = true
  traces.value[0].locations = countryCodes.value
  traces.value[0].text = countryNames.value
  traces.value[0].z = countryNames.value.map(() => 0)
  loading.value = false
}

onMounted(() => {
  fetchData()
})

const onCountryClick = (eventData) => {
  if (eventData && eventData.points && eventData.points[0]) {
    const countryCode = getCountryISOCode2(eventData.points[0].location)
    emit('country-selected', countryCode)
  }
}
</script>

<template>
  <ReactiveChart :layout="layout" :traces="traces" @plotly-click="onCountryClick" />
</template>
