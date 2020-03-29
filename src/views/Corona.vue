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
            <div class="col-5">
                <h2 class="text-center">
                    One month before lockdown
                    <q-icon name="fas fa-level-down-alt"></q-icon>
                </h2>
            </div>
            <div class="col-2">
            </div>
            <div class="col-5">
                <h2 class="text-center">
                    Week of the lockdown (lockdown on {{countriesInfo[selected].start}})
                    <q-icon name="fas fa-level-down-alt"></q-icon>
                </h2>
            </div>
        </div>
      </div>
      <div v-for="asn in asns">
            <div class="row">
                <div class="col-12 text-center">
                    <h2>{{asn.name}} (AS{{asn.as}})</h2>
                </div>
                <div class="col-6">
                    <network-delay-chart
                        :start-time="before_start"
                        :end-time="before_end"
                        :startPointName="asn.as.toString()"
                        startPointType="AS"
                        :endPointName="endpoints[asn.as]"
                        searchBar
                        ref="networkDelayChart_before"
                        :fetch="fetch"
                        :clear="clear"
                    />
                </div>
                <div class="col-6">
                    <network-delay-chart
                        :start-time="during_start"
                        :end-time="during_end"
                        :startPointName="asn.as.toString()"
                        startPointType="AS"
                        :endPointName="endpoints[asn.as]"
                        searchBar
                        ref="networkDelayChart"
                        :fetch="fetch"
                        :clear="clear"
                    />
                </div>
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
  components: {
    DelayAndForwardingChart,
    NetworkDelayChart,
  },
  data() {
      console.log(lockdowns)
    return {
      addressFamily: 4,
      countriesInfo: lockdowns,
      selection: Object.keys(lockdowns),
      selected: null,
      asns: [],
      fetch: false,
      clear: 1

    };
  },
  created(){ 
  },
  methods: {
  },
  mounted() {
  },
  watch: {
    selected() {
      this.fetch = false;
      this.clear += 1;
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
