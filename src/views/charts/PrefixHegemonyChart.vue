<template>
  <div class="IHR_chart">
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <q-card v-if="details.tableVisible" class="q-ma-xl">
      <q-tabs
        v-model="details.activeTab"
        class="table-card text-grey bg-grey-2"
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab
          name="dependency"
          :label="$t('charts.prefixHegemony.table.dependencyTitle')"
        />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="dependency">
          <q-select filled v-model="selection" :options="selectionOptions" label="Type of Error" />
          <as-interdependencies-table
            :data="prefixHegemonyData"
            :loading="loading"
          />
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table q-pa-lg" light>
          <h3>{{ $t("charts.prefixHegemony.table.apiTitle") }}</h3>
          <table>
            <tr>
              <td>
                <a :href="hegemonyUrl" target="_blank" id="tableUrl">{{ hegemonyUrl }}</a>
              </td>
            </tr>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script>
import CommonChartMixin from "./CommonChartMixin";
import { extend } from "quasar";
import AsInterdependenciesTable from "./tables/PrefixHegemonyTable";
import { AS_INTERDEPENDENCIES_LAYOUT } from "./layouts";
import i18n from "@/locales/i18n";

import { HegemonyPrefixQuery, AS_FAMILY, Query } from "@/plugins/IhrApi";

const DEFAULT_TRACE = [
  {
    // First trace is used for the hegemony cone
    x: [],
    y: [],
    yaxis: "y2",
    name: i18n.t("charts.prefixHegemony.defaultTrace"),
    showlegend: false,
    hovertemplate:
      "%{x}<br>" + "%{yaxis.title.text}: <b>%{y:.2f}</b>" + "<extra></extra>"
  }
];

export default {
  mixins: [ CommonChartMixin ],
  components: {
    AsInterdependenciesTable
  },
  props: {
    countryCode: {
      type: String,
    },
    ASN: {
      type: String,
    },
    addressFamily: {
      type: Number,
      default: AS_FAMILY.v4
    },
  },
  data() {
    //prevent calls within 500ms and execute only the last one
    return {
      details: {
        activeTab: "dependency",
        date: null,
        tablesData: {
            dependency: {data:[]},
        },
        tableVisible: true,
      },
      loading: true,
      hegemonyFilter: null,
      traces: DEFAULT_TRACE,
      layout: AS_INTERDEPENDENCIES_LAYOUT,
      selectionOptions: ['RPKI invalid', 'IRR invalid', 'Bogon prefix', 'Bogon ASN'],
      selection: 'RPKI Invalid'
    };
  },
  beforeMount() {
    this.updateAxesLabel();
  },
  mounted() {
      this.details.date=`${this.startTime} - ${this.endTime}`
  },
  methods: {
    updateAxesLabel() {
      this.layout.yaxis.title =
        this.countryCode +
        ` ${this.$t("charts.prefixHegemony.yaxis")}`;
      this.layout.yaxis2.title =
        `${this.$t("charts.prefixHegemony.yaxis2")} ` + this.countryCode;
    },
    makeHegemonyFilter() {
        console.log('Filter')
        console.log(this.selection)
        let filter = new HegemonyPrefixQuery()
                .country(this.countryCode)
                .addressFamily(this.addressFamily)
                .timeInterval(this.startTime, this.endTime);
        if(this.selection == 'Bogon prefix'){
            filter.delegatedPrefixStatus('available')
        }
        else if(this.selection == 'Bogon ASN'){
            filter.delegatedASNStatus('available')
        }
        else if(this.selection == 'IRR invalid'){ 
            filter.irrStatus('Invalid')
        }
        else{ 
            filter.rpkiStatus('Invalid')
        }
        return filter
    },
    apiCall() {
      if (this.asNumber == 0) return;
      this.updateAxesLabel();
      this.hegemonyFilter = this.makeHegemonyFilter();
      this.loading = true;
      this.queryPrefixHegemonyAPI();
    },
    queryPrefixHegemonyAPI() {
        console.log('in queryPrefixHegemonyAPI')
      this.loading = true;
      this.$ihr_api.hegemony_prefix(
        this.hegemonyFilter,
        result => {
          this.fetchPrefixHegemony(result.results);
          this.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    median(values){
        if(values == undefined) return 0;
        if(values.length ===0) return 0;

        values.sort(function(a,b){
            return a-b;
        });

        var half = Math.floor(values.length / 2);

        if (values.length % 2)
            return values[half];

        return (values[half - 1] + values[half]) / 2.0;
    },
    fetchPrefixHegemony(data) {
      this.traces = [];
      let traces = {};
      data.forEach(elem => {

        let trace_key = elem.prefix+elem.originasn
        let trace = traces[trace_key];
        if (trace === undefined) {
          trace = {
            maxHege: 1,
            dependencies: {},
            visibility: elem.visibility,
            prefix: {value:elem.prefix, descr:elem.descr},
            originasn: {asn:elem.originasn, name:elem.originasn_name},
            rpki_status: elem.rpki_status,
            irr_status: elem.irr_status,
            delegated_prefix_status: elem.delegated_prefix_status,
            delegated_asn_status: elem.delegated_asn_status,
            name:
              this.$options.filters.ihr_NumberToAsOrIxp(elem.asn) +
              " " +
              elem.asn_name.split(" ")[0],
            hovertemplate:
              "<b>" +
              this.$options.filters.ihr_NumberToAsOrIxp(elem.asn) +
              " " +
              elem.asn_name.split(" ")[0] +
              "</b><br><br>" +
              "%{x}<br>" +
              "%{yaxis.title.text}: <b>%{y:.2f}</b>" +
              "<extra></extra>"
          };
          traces[trace_key] = trace;
          this.traces.push(trace);
        }
        if (elem.asn == elem.originasn){
            trace.maxHege = elem.hege

        }
          else{
            trace.dependencies[elem.asn] = {
                asn: elem.asn, 
                name: elem.asn_name,
                hege: elem.hege
                }
      }
      });

      // Compute median value of hegemony scores
      this.traces.forEach(elem => { 
        elem.hege_as = this.median(elem.hege_as)*100;

      });

        // TODO remove the 2 fl
      this.noData |= Object.keys(traces).length == 0;
      this.layout.datarevision = new Date().getTime();

      this.details.tableVisible = true;
      this.details.tablesData['dependency'] = {
          data: this.traces,
      };
    },
  },
  computed: {
    dateStr() {
      let year = this.details.date.getUTCFullYear();
      var day = this.details.date.getUTCDate();
      var month = this.details.date.getUTCMonth() + 1;
      var hours = this.details.date.getUTCHours();
      var minutes = this.details.date.getUTCMinutes();
      var seconds = this.details.date.getUTCSeconds();

      if (day < 10) day = "0" + day;
      if (month < 10) month = "0" + month;
      if (hours < 10) hours = "0" + hours;
      if (minutes < 10) minutes = "0" + minutes;
      if (seconds < 10) seconds = "0" + seconds;

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    },
    prefixHegemonyData() {
      return this.details.tablesData.dependency.data
    },
    hegemonyUrl() {
      return this.$ihr_api.getUrl(this.hegemonyFilter);
    },
  },
  watch: {
    selection(){ 
        this.debouncedApiCall();
    },
    addressFamily() {
      this.debouncedApiCall();
    },
    countryCode() {
      this.debouncedApiCall();
    },
    "details.activeTab"(newValue) {
      this.updateQuery("hege_tb", newValue);
    },
    "details.date"(newValue) {
    },
  }
};
</script>

<style lang="stylus">
@import "~@/styles/charts/common.styl";
.bgplay-container {
  overflow: hidden;
  padding-top: 1100px;
  position: relative;
}

.bgplay-container iframe {
   border: 0;
   height: 100%;
   left: 0;
   position: absolute;
   top: 0;
   width: 100%;
}
</style>
