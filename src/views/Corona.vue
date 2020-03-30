<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
      <div>
        <h1 class="text-center">Network Delays During National Lockdowns</h1>
        <div class="row justify-center">
            <div class="col-3">
                <q-select v-model="selected" :options="selection" label="Select a country" />
            </div>
        </div>
        <div class="row justify-center q-pa-xl" v-if="selected">

            <div class="col-4">
                <h2 class="text-center">
                    One month before lockdown
                    <q-icon name="fas fa-level-down-alt"></q-icon>
                </h2>
            </div>
            <div class="col-4">
                <h2 class="text-center">
                    Lockdown on {{countriesInfo[selected].start}}
                    <q-icon name="fas fa-level-down-alt"></q-icon>
                </h2>
            </div>
            <div class="col-4">
                <h2 class="text-center">
                    Now 
                    <q-icon name="fas fa-level-down-alt"></q-icon>
                </h2>
            </div>
        </div>
      </div>
      <div v-for="asn in asns">
            <div class="row">
                <div class="col-12 text-center q-pa-md">
                    <h2>{{asn.name}} (AS{{asn.as}})</h2>
                </div>
                <div class="col-4 q-pa-xs">
                    <network-delay-chart
                        :start-time="before_start"
                        :end-time="before_end"
                        :startPointName="asn.as.toString()"
                        startPointType="AS"
                        :endPointName="endpoints[asn.as]"
                        ref="networkDelayChart_before"
                        :fetch="fetch"
                        :clear="clear"
                        @max-value='updateYaxis'
                        :yMax='yMax'
                        :searchBar='searchBar'
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <network-delay-chart
                        :start-time="during_start"
                        :end-time="during_end"
                        :startPointName="asn.as.toString()"
                        startPointType="AS"
                        :endPointName="endpoints[asn.as]"
                        ref="networkDelayChart"
                        :fetch="fetch"
                        :clear="clear"
                        @max-value='updateYaxis'
                        :yMax='yMax'
                        :searchBar='searchBar'
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <network-delay-chart
                        :start-time="startTime"
                        :end-time="endTime"
                        :startPointName="asn.as.toString()"
                        startPointType="AS"
                        :endPointName="endpoints[asn.as]"
                        ref="networkDelayChart"
                        :fetch="fetch"
                        :clear="clear"
                        @max-value='updateYaxis'
                        :yMax='yMax'
                        :searchBar='searchBar'
                    />
                </div>
            </div>
     </div>
      <div class='row self-end'>
        <div class="col-2 offset-10">
            <h3>Toolbox</h3>
            <q-toggle
            v-model="searchBar"
            label="Add more destination networks"
            />
        </div>
      </div>
  </div>
</template>

<script>
import reportMixin from "@/views/mixin/reportMixin";
import DelayAndForwardingChart from "@/views/charts/DelayAndForwardingChart";
import NetworkDelayChart from "@/views/charts/NetworkDelayChart";
import { AS_FAMILY, NetworkQuery } from "@/plugins/IhrApi";
import lockdowns from "@/plugins/covid19/lockdowns";
//const TIMELINE_URL = "/covid-19/lockdowns.json"

export default {
  mixins: [reportMixin],
  components: {
    DelayAndForwardingChart,
    NetworkDelayChart,
  },
  data() {
    return {
      addressFamily: 4,
      countriesInfo: lockdowns,
      selection: Object.keys(lockdowns),
      selected: null,
      asns: [],
      fetch: false,
      clear: 1,
      yMax: 0,
      interval: this.getDateInterval(new Date(), 7), // current week
      searchBar: false

    };
  },
  created(){ 
  },
  methods: {
      pushRoute(){}, //required for mixin
      updateYaxis(newMaxY){ 
        this.yMax = this.yMax>newMaxY? this.yMax : newMaxY
      }
  },
  mounted() {
  },
  watch: {
    selected() {
      this.fetch = false;
      this.clear += 1;
      this.yMax = 0;
      this.asns = this.countriesInfo[this.selected].eyeball;
      this.endpoints = {}
        this.countriesInfo[this.selected].eyeball.forEach( eyeball => {
            let dests = ["AS415169"]
            eyeball.dependency.forEach( dep => { if(dep.hege>0.1)dests.push("AS4"+dep.asn);})
            if(this.countriesInfo[this.selected].continent=='Europe'){ 
                dests = dests.concat(["IX423", "IX4208"])

            }
            this.endpoints[eyeball.as] = dests

        });
        //"AS43557",
        //"AS425152",
        //"AS420144",
      this.before_start = new Date(this.countriesInfo[this.selected].monitoring_dates.before.monday+' 00:00Z');
      this.before_end = new Date(this.countriesInfo[this.selected].monitoring_dates.before.sunday+' 23:59');
      this.during_start = new Date(this.countriesInfo[this.selected].monitoring_dates.lockdown.monday+' 00:00Z');
      this.during_end = new Date(this.countriesInfo[this.selected].monitoring_dates.lockdown.sunday+' 23:59');
      this.after_start = null;
      this.after_end = null;
      this.$nextTick(function() {
         this.fetch = true;
      })
    }
  },
};
</script>

<style lang="stylus">
@import '../styles/quasar.variables';
</style>
