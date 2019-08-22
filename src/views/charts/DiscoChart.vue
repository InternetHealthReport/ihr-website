<template>
  <div class="IHR_disco-chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      @plotly-click="showTable"
      :ref="myId"
    />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="4em" />
    </div>
    <h2 v-if="details.tableVisible">
      {{$t("charts.disconnections.table.event")}}
      <strong>{{details.eventid}}</strong>
      [<span>{{details.startTime | ihrUtcString}}</span>, <span>{{details.endTime | ihrUtcString}}</span>]
    </h2>
    <div v-if="details.tableVisible" class>
      <span class="IHR_table-close-button" @click="details.tableVisible=false">x</span>
      <q-tabs
        v-model="details.activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="probes" label="probes" />
        <q-tab name="tracemon" label="Tracemon" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="probes">
          <disconnection-table :data="details.data" :loading="details.loading" />
        </q-tab-panel>
        <q-tab-panel name="tracemon">
          <tracemon
            :start-time="details.startTime"
            :end-time="details.endTime"
            :probs="details.porbs"
          />
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table">
          <table>
            <tr>
              <td>
                <label for="disconnection">{{$t('charts.disconnections.title')}}</label>
              </td>
              <td>
                <a
                  :href="disconnetionEventUrl"
                  target="_blank"
                  id="disconnection"
                >{{disconnetionEventUrl}}</a>
              </td>
            </tr>
            <tr>
              <td>
                <label for="tableUrl">{{$t("charts.disconnections.table.disconnectionProbes")}}</label>
              </td>
              <td>
                <a
                  :href="disconnetionEvenProbestUr"
                  target="_blank"
                  id="tableUrl"
                >{{disconnetionEvenProbestUr}}</a>
              </td>
            </tr>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import CommonChartMixin, { DEFAULT_DEBOUNCE } from "./CommonChartMixin";
import { DiscoEventQuery, DiscoProbesQuery } from "@/plugins/IhrApi";
import DisconnectionTable from "./tables/DisconnectionTable";
import Tracemon from "@/components/ripe/Tracemon";
import { DISCO_LAYOUT } from "./layouts"

function push0(trace, time) {
  trace.x.push(time);
  trace.y.push(0);
  trace.z.push(0);
}

export default {
  mixins: [CommonChartMixin],
  components: {
    DisconnectionTable,
    Tracemon
  },
  props: {
    streamName: {
      type: Number,
      required: true
    }
  },
  data() {
    let filter = new DiscoEventQuery()
      .streamName(this.streamName)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.queryDiscoApi();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      debouncedApiCall: debouncedApiCall,
      details: {
        activeTab: "probes",
        tableVisible: false,
        startTime: null,
        endTime: null,
        data: [],
        eventid: null,
        porbs: [],
        filter: null,
        loading: true
      },
      loading: true,
      filters: [filter],
      traces: [
        {
          x: [],
          y: [],
          z: [],
          yaxis: "y",
          name: "",
          showlegend: false,
          line: { shape: "hv" }
        }
      ],
      layout: DISCO_LAYOUT
    };
  },
  created(){
    this.traces[0].name =
    this.layout.yaxis.title = this.$t('charts.disconnections.table.yaxis');
  },
  methods: {
    queryDiscoApi() {
      this.loading = true;
      this.$ihr_api.disco_events(
        this.filters[0],
        result => {
          this.fetchDiscoData(result.results);
          this.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    fetchDiscoData(data) {
      let trace = this.traces[0];
      trace.x = [];
      trace.y = [];
      trace.z = [];

      push0(trace, this.$options.filters.ihrUtcString(this.startTime));
      data.forEach(event => {
        push0(trace, event.starttime);
        trace.x.push(event.starttime);
        trace.y.push(event.avglevel);
        trace.z.push(event.id);

        trace.x.push(event.endtime);
        trace.y.push(event.avglevel);
        trace.z.push(event.id);
        push0(trace, event.endtime);
      });
      push0(trace, this.$options.filters.ihrUtcString(this.endTime));
      this.layout.datarevision = new Date().getTime();
    },
    showTable(clickData) {
      let plot = clickData.points[0];
      this.details.eventid = plot.data.z[plot.pointNumber];
      this.details.selectedTime = plot.data.z[plot.pointNumber];
      this.details.filter = new DiscoProbesQuery()
        .event(this.details.eventid)
        .orderedByStartTime();
      this.details.loading = true;
      this.$ihr_api.disco_probes(
        this.details.filter,
        result => {
          if (result.results.length > 0) {
            let startTime = new Date(result.results[0].starttime);
            let endTime = new Date(result.results[0].endtime);
            let probs = [];
            result.results.forEach(elem => {
              let start = new Date(elem.starttime);
              let end = new Date(elem.endtime);
              probs.push(elem.probe_id);
              if (start < startTime) startTime = start;
              if (end > endTime) endTime = end;
            });
            this.details.startTime = startTime;
            this.details.endTime = endTime;
            this.details.data = result.results;
            this.details.porbs = probs;
            this.details.tableVisible = true;
            this.details.loading = false;
          }
        },
        error => {
          console.error(error);
        }
      );

      this.tableVisible = true;
    }
  },
  computed: {
    disconnetionEventUrl() {
      return this.$ihr_api.getUrl(this.filters[0]);
    },
    disconnetionEvenProbestUr() {
      return this.$ihr_api.getUrl(this.details.filter);
    }
  },
  watch: {
    streamName(newValue) {
      this.filters.forEach((filter) => {
        filter.streamName(newValue);
      });
      this.debouncedApiCall();
    }
  }
};

export { push0 }
</script>

<style lang="stylus">
.IHR_
  &disco-chart
    text-align center
    position relative

    & h1
      font-size 25pt
      margin-bottom 0px
      font-weight 400
      line-height 1
    & h2
      &:first-letter
        text-transform capitalize
      & strong
        font-size 20pt
      & span
        font-size 20pt

  &loading-spinner
    position absolute
    top 50%
    left 49%
</style>
