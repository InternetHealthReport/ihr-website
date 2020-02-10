<template>
  <q-table
    :data="data"
    :columns="columns"
    row-key="link"
    :pagination.sync="pagination"
    :loading="loading"
    :visible-columns="visibleColumns"
    flat
    :filter="filterTable"
    :filter-method="filterFct"
  >
    <template v-slot:body="props">
      <q-tr :props="props" >
        <q-td key="asNumber" :props="props" v-if="showAsn">
          <a @click="newWindow({name : 'as_and_ixp', params:{asn: getCellValue(props, 'asNumber') }})" href="javascript:void(0)">
            {{ getCellValue(props, "asNumber") }}
          </a>
        </q-td>
        <q-td key="link" :props="props">
            <a href="javascript:void(0)">
              {{getCellValue(props, 'link')[0]}}
              <q-popup-proxy>
                    <reverse-dns-ip :ip="getCellValue(props, 'link')[0]" class="IHR_reverse-dns-ip-improved" />
              </q-popup-proxy>
            </a>
            --
            <a href="javascript:void(0)">
              {{getCellValue(props, 'link')[1]}}
              <q-popup-proxy>
                <reverse-dns-ip :ip="getCellValue(props, 'link')[1]" class="IHR_reverse-dns-ip-improved" />
              </q-popup-proxy>
            </a>
        </q-td>
        <q-td key="delayChange" :props="props" >{{ getCellValue(props, "delayChange") }}</q-td>
        <q-td key="deviation" :props="props" :class="['IHR_important-cell', getClassByDeviation(getCellValue(props, 'deviation'))]">{{ getCellValue(props, "deviation") }}</q-td>
        <q-td key="nbprobes" :props="props"> {{ getCellValue(props, "nbprobes") }} </q-td>
      </q-tr>
      <q-tr v-if="props.expand" :props="props">
        <q-td colspan="100%">
          <!--<latencymon :start-time="startTime" :stop-time="stopTime" :propb-ids="props.row.msm_prb_ids" style="max-width: 93%; margin: 0 auto;"/>-->
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from "./CommonTableMixin";
import Latencymon from "@/components/ripe/Latencymon";
import ReverseDnsIp from "@/components/ripe/ReverseDnsIp";
import PrefixOverview from "@/components/ripe/PrefixOverview";

export default {
  mixins: [CommonTableMixin],
  components: {
    Latencymon,
    PrefixOverview,
    ReverseDnsIp
  },
  props: {
    startTime: {
      type: Date,
      required: true
    },
    stopTime: {
      type: Date,
      required: true
    },
    showAsn: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      pagination: {
        sortBy: "deviation",
        descending: true,
        page: 1,
        rowsPerPage: 10
      },
      visibleColumns: ['asNumber', 'link', 'delayChange', 'deviation', 'nbprobes'],
      columns: [
        {
          name: "asNumber",
          required: false,
          label: "Autonomous System",
          align: "center",
          field: row => row.asn,
          format: val => this.$options.filters.ihr_NumberToAsOrIxp(val),
          sortable: false
        },
        {
          name: "link",
          required: true,
          label: "IP Link",
          align: "center",
          field: row => row.link,
          format: val => val.replace(/(\))|(^\()/g, "").split(","),
          sortable: false
        },
        {
          name: "delayChange",
          required: true,
          label: "Delay Change (ms)",
          align: "center",
          field: row => row.diffmedian,
          format: val => val.toFixed(2),
          sortable: true
        },
        {
          name: "deviation",
          required: true,
          label: "Deviation",
          align: "center",
          field: row => row.deviation,
          format: val => val.toFixed(2),
          sortable: true
        },
        {
          name: "nbprobes",
          label: "Nb. Atlas Probes",
          align: "center",
          field: row => row.nbprobes,
          format: val => val,
          sortable: true
        }
      ]
    };
  },
  mounted() {
      if(!this.showAsn){
          this.visibleColumns = ['link', 'delayChange', 'deviation', 'nbprobes']
      }
  },
  methods: {
    getClassByDeviation(deviation) {
      if(deviation > 100) return "IHR_color-deviation-hight-threshold";
      if(deviation > 10) return "IHR_color-deviation-mid-threshold";
      return "";
    },
    expandRow(props) {
      alert(props.expanded)
      if(props.expanded == undefined || props.expanded == false) {
        this.$set(props, "expanded", true);
        return;
      }
      props.expanded = false;
    }
  }
};
</script>
<style lang="stylus">
.IHR_
  &probe-popup
    padding 10px
    max-width 200px
    background transparent

    & > span:first-child
      font-weight 500
      margin-right 6pt

  &prefix-overview-popup
    max-width 400px

  &popup
    border-color black 
    max-width 600px
    min-width 300px
</style>
