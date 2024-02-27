<script setup>
import { QSelect, QToggle } from 'quasar'
import lockdowns from '@/plugins/covid19/lockdowns'
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import report from '@/plugins/report'

const countries = Object.keys(lockdowns).sort()
const select = countries.map(name => ({
  label: `${name} (${lockdowns[name].start})`,
  value: name
}))
const route = useRoute()
const router = useRouter()

const countriesInfo = ref(lockdowns)
const selection = ref(select)
const selected = ref([])
const asns = ref([])
const fetch = ref(false)
const clear = ref(1)
const yMax = ref(0)
const searchBar = ref(false)
const endpoints = ref({})
const before_start = ref(null)
const before_end = ref(null)
const during_start = ref(null)
const during_end = ref(null)
const after_start = ref(null)
const after_end = ref(null)

const { startTime, endTime } = report(7)

onMounted(() => {
  const selectedCountry = route.query.country
  selected.value = selectedCountry == undefined ? null : { value: selectedCountry, label: `${selectedCountry} (${lockdowns[selectedCountry].start})` }
})

const updateYaxis = (newMaxY) => {
  yMax.value = yMax.value > newMaxY ? yMax.value : newMaxY
}

watch(selected, (newValue) => {
  if (newValue === null) {
    return
  }
  router.push({
    replace: true,
    query: Object.assign({}, route.query, {
      country: newValue.value,
    })
  })
  fetch.value = false
  clear.value += 1
  yMax.value = 0
  asns.value = countriesInfo.value[selected.value['value']].eyeball
  endpoints.value = {}
  countriesInfo.value[selected.value['value']].eyeball.forEach(eyeball => {
    let dests = ['AS415169']
    eyeball.dependency.forEach(dep => {
      if (dep.hege > 0.1) {
        dests.push('AS4' + dep.asn)
      }
    })
    if (selected.value['value'] == 'Ireland') {
      dests.push('IX4382')
    } else if (countriesInfo.value[selected.value['value']].continent == 'Europe') {
      // Display delay to AMSIX and DECIX for european countries
      dests = dests.concat(['IX423', 'IX4208'])
    } else {
      dests.push('AS421556')
    }
    endpoints.value[eyeball.as] = dests
  })
  before_start.value = new Date(countriesInfo.value[selected.value['value']].monitoring_dates.before.monday + ' 00:00Z')
  before_end.value = new Date(countriesInfo.value[selected.value['value']].monitoring_dates.before.sunday + ' 23:59')
  during_start.value = new Date(countriesInfo.value[selected.value['value']].monitoring_dates.lockdown.monday + ' 00:00Z')
  during_end.value = new Date(countriesInfo.value[selected.value['value']].monitoring_dates.lockdown.sunday + ' 23:59')
  after_start.value = null
  after_end.value = null
  nextTick(() => {
    fetch.value = true
  })
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer">
    <div>
      <h1 class="text-center">Network Delays During National Lockdowns</h1>

      <div class="row justify-center">
        <div class="IHR_description q-pa-lg">
          <p>
            As part of the
            <a href="https://labs.ripe.net/Members/becha/hackathons-in-the-time-of-corona" targeet="_blank"
              >RIPE Hackathon on the health of the Internet during the COVID-19 crisis</a
            >, we hacked this experimental interface to look at network delays during national lockdowns. This is an attempt to monitor and
            study congestion that could occur at large eyeball networks during mass quarantines.
          </p>
          <p>
            Select a country below to display estimated delays from major eyeball ASes. As a reference we display a week of data taken one
            month before the lockdown (left plots), then show the week during the official lockdown (center plots), and the latest 7 days of
            data (right plots). All dates and times are UTC.
          </p>
          <p>
            Displayed delays are computed from <a href="https://atlas.ripe.net/" target="_blank">RIPE Atlas</a> traceroutes towards Google
            DNS, the networks' main upstream providers, and, for European countries, two large IXPs (AMS-IX and DE-CIX), and the E-root DNS
            server for other countries. See also our
            <router-link :to="{ name: 'documentation', hash: '#Network_delay' }">documentation on network delays</router-link> and
            <a href="https://labs.ripe.net/Members/romain_fontugne/network-delays-in-times-of-corona" target="_blank">RIPE Labs article</a>.
          </p>
          <p>Be patient. Loading all graphs may take some time for certain countries.</p>
        </div>
      </div>
      <div class="row justify-center box_corona">
        <div class="col-3">
          <QSelect v-model="selected" :options="selection" label="Select a country" />
        </div>
      </div>
      <div class="row toolbox">
        <div>
          <h3>Toolbox</h3>
          <QToggle v-model="searchBar" label="Add more destination networks" />
        </div>
      </div>
      <div v-if="selected">
        </div>
        <div v-for="asn in asns" :key="`${asn.name}-${asn.as}`">
          <div class="row">
            <div class="col-12 text-center q-pa-md">
              <div class="IHR_anchor" :id="asn.as"></div>
              <h2>{{ asn.name }} (AS{{ asn.as }})</h2>
            </div>
            <div class="column_corona">
              <NetworkDelayChart
                :start-time="before_start"
                :end-time="before_end"
                :startPointName="asn.as.toString()"
                startPointType="AS"
                :endPointNames="endpoints[asn.as]"
                :fetch="fetch"
                :clear="clear"
                @max-value="updateYaxis"
                :yMax="yMax"
                :searchBar="searchBar"
              />
              <p class="center">One month before Lockdown</p>
            </div>
            <div class="column_corona">
              <NetworkDelayChart
                :start-time="during_start"
                :end-time="during_end"
                :startPointName="asn.as.toString()"
                startPointType="AS"
                :endPointNames="endpoints[asn.as]"
                :fetch="fetch"
                :clear="clear"
                @max-value="updateYaxis"
                :yMax="yMax"
                :searchBar="searchBar"
              />
              <p class="center">Lockdown({{ countriesInfo[selected['value']].start }})</p>
            </div>
            <div class="column_corona">
              <NetworkDelayChart
                :start-time="startTime"
                :end-time="endTime"
                :startPointName="asn.as.toString()"
                startPointType="AS"
                :endPointNames="endpoints[asn.as]"
                :fetch="fetch"
                :clear="clear"
                @max-value="updateYaxis"
                :yMax="yMax"
                :searchBar="searchBar"
              />
              <p class="center">Latest</p>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<style lang="stylus">
.IHR_description
    font-weight 400

.IHR_anchor
    display block
    position relative
    top -250px
    visibility hidden

.toolbox
    padding 16px
    justify-content: flex-end

p
    font-size 1.2rem
.center
    text-align center
.box_corona
    padding-top 40px
    padding-bottom 50px
.column_corona
  float left
  width 33.33%
@media screen and (max-width:720px)
  .column_corona
    width 100%
@media screen and (max-width:1024px) and (min-width 720px)
  .column_corona
    width 50%

</style>