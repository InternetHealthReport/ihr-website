<script setup>
import { ref, onMounted, inject } from 'vue'
import ReactiveChart from '@/components/charts/ReactiveChart.vue'
import { CountryQuery } from '@/plugins/IhrApi'

const ihr_api = inject('ihr_api')
const countryQuery = ref(new CountryQuery().orderedByCode())

const countryNames = ref([])
const countryCodes = ref([])
const loading = ref(false)

const emit = defineEmits(['country-selected'])

const layout = {
  title: 'Select a country',
  geo: {
    showframe: false,
    projection: {
      type: 'equirectangular'
    },
    showcountries: true,
    showcoastlines: 'yes'
  },
  autosize: true
}

const traces = ref([
  {
    type: 'choropleth',
    locationmode: 'country names',
    locations: [],
    z: [],
    text: [],
    hoverinfo: 'text',
    autocolorscale: false,
    showscale: false
  }
])

const fetchData = async () => {
  try {
    loading.value = true
    countryQuery.value.containsName('')
    ihr_api.country(countryQuery.value, (result) => {
      result.results.forEach((country) => {
        countryNames.value.push(country.name)
        countryCodes.value.push(country.code)
      })
      traces.value[0].locations = countryNames.value
      traces.value[0].text = countryNames.value
      traces.value[0].z = countryNames.value.map(() => 0)
      loading.value = false
    })
  } catch (error) {
    console.error('Error loading data:', error)
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const onCountryClick = (eventData) => {
  if (eventData && eventData.points && eventData.points[0]) {
    const countryCodeIndex = eventData.points[0].pointIndex
    const countryCode = countryCodes.value[countryCodeIndex]
    emit('country-selected', countryCode)
  }
}
</script>

<template>
  <div>
    <div class="map-container">
      <ReactiveChart :layout="layout" :traces="traces" @plotly-click="onCountryClick" />
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
}

@media screen and (max-width: 768px) {
  .map-container {
    display: none;
  }
}
</style>
