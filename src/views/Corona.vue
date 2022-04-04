<template>
  <div id="IHR_as-and-ixp-container">
    <div>
      <h1 class="text-center">Network Delays During National Lockdowns</h1>

      <div class="row justify-center">
        <div class="col-6 IHR_description q-pa-lg">
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
      <div class="row justify-center">
        <div class="col-3">
          <q-select v-model="selected" :options="selection" label="Select a country" />
        </div>
      </div>
      <div v-if="selected">
        <div class="row justify-center q-pa-xl">
          <div class="col-4">
            <h3 class="text-center">
              One month before lockdown
              <q-icon name="fas fa-level-down-alt"></q-icon>
            </h3>
          </div>
          <div class="col-4">
            <h3 class="text-center">
              Lockdown ({{ countriesInfo[selected['value']].start }})
              <q-icon name="fas fa-level-down-alt"></q-icon>
            </h3>
          </div>
          <div class="col-4">
            <h3 class="text-center">
              Latest
              <q-icon name="fas fa-level-down-alt"></q-icon>
            </h3>
          </div>
        </div>
        <div v-for="asn in asns" :key="`${asn.name}-${asn.as}`">
          <div class="row">
            <div class="col-12 text-center q-pa-md">
              <div class="IHR_anchor" :id="asn.as"></div>
              <h2>{{ asn.name }} (AS{{ asn.as }})</h2>
            </div>
            <div class="col-4 q-pa-xs">
              <network-delay-chart
                :start-time="before_start"
                :end-time="before_end"
                :startPointName="asn.as.toString()"
                startPointType="AS"
                :endPointNames="endpoints[asn.as]"
                ref="networkDelayChart_before"
                :fetch="fetch"
                :clear="clear"
                @max-value="updateYaxis"
                :yMax="yMax"
                :searchBar="searchBar"
              />
            </div>
            <div class="col-4 q-pa-xs">
              <network-delay-chart
                :start-time="during_start"
                :end-time="during_end"
                :startPointName="asn.as.toString()"
                startPointType="AS"
                :endPointNames="endpoints[asn.as]"
                ref="networkDelayChart"
                :fetch="fetch"
                :clear="clear"
                @max-value="updateYaxis"
                :yMax="yMax"
                :searchBar="searchBar"
              />
            </div>
            <div class="col-4 q-pa-xs">
              <network-delay-chart
                :start-time="startTime"
                :end-time="endTime"
                :startPointName="asn.as.toString()"
                startPointType="AS"
                :endPointNames="endpoints[asn.as]"
                ref="networkDelayChart"
                :fetch="fetch"
                :clear="clear"
                @max-value="updateYaxis"
                :yMax="yMax"
                :searchBar="searchBar"
              />
            </div>
          </div>
        </div>
        <div class="row self-end">
          <div class="col-2 offset-10">
            <h3>Toolbox</h3>
            <q-toggle v-model="searchBar" label="Add more destination networks" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import reportMixin from '@/views/mixin/reportMixin'
import NetworkDelayChart from '@/views/charts/NetworkDelayChart'
import lockdowns from '@/plugins/covid19/lockdowns'

export default {
  name: 'CoronaReport',
  mixins: [reportMixin],
  components: {
    NetworkDelayChart,
  },
  data() {
    var select = []
    var countries = Object.keys(lockdowns).sort()
    countries.forEach(name =>
      select.push({
        label: `${name} (${lockdowns[name].start})`,
        value: name,
      })
    )
    return {
      addressFamily: 4,
      countriesInfo: lockdowns,
      selection: select,
      selected: null,
      asns: [],
      fetch: false,
      clear: 1,
      yMax: 0,
      interval: this.getDateInterval(new Date(), 7), // current week
      searchBar: false,
    }
  },
  created() {
    let selectedCountry = this.$route.query.country
    this.selected =
      selectedCountry == undefined ? null : { value: selectedCountry, label: `${selectedCountry} (${lockdowns[selectedCountry].start})` }
  },
  methods: {
    pushRoute() {}, //required for mixin
    updateYaxis(newMaxY) {
      this.yMax = this.yMax > newMaxY ? this.yMax : newMaxY
    },
  },
  mounted() {},
  watch: {
    selected(newValue) {
      this.updateQuery({ country: newValue.value })
      this.fetch = false
      this.clear += 1
      this.yMax = 0
      this.asns = this.countriesInfo[this.selected['value']].eyeball
      this.endpoints = {}
      this.countriesInfo[this.selected['value']].eyeball.forEach(eyeball => {
        let dests = ['AS415169']
        eyeball.dependency.forEach(dep => {
          if (dep.hege > 0.1) dests.push('AS4' + dep.asn)
        })
        if (this.selected['value'] == 'Ireland') {
          dests.push('IX4382')
        } else if (this.countriesInfo[this.selected['value']].continent == 'Europe') {
          // Display delay to AMSIX and DECIX for european countries
          dests = dests.concat(['IX423', 'IX4208'])
        } else {
          // Add E and K root servers to other countries
          dests.push('AS421556')
        }
        this.endpoints[eyeball.as] = dests
      })
      //"AS43557",
      //"AS425152",
      //"AS420144",
      this.before_start = new Date(this.countriesInfo[this.selected['value']].monitoring_dates.before.monday + ' 00:00Z')
      this.before_end = new Date(this.countriesInfo[this.selected['value']].monitoring_dates.before.sunday + ' 23:59')
      this.during_start = new Date(this.countriesInfo[this.selected['value']].monitoring_dates.lockdown.monday + ' 00:00Z')
      this.during_end = new Date(this.countriesInfo[this.selected['value']].monitoring_dates.lockdown.sunday + ' 23:59')
      this.after_start = null
      this.after_end = null
      this.$nextTick(function () {
        this.fetch = true
      })
    },
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

.IHR_description
    font-weight 400

.IHR_anchor
    display block
    position relative
    top -250px
    visibility hidden
</style>
