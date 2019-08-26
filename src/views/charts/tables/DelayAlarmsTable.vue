<template>
  <q-table
    :data="data"
    :columns="columns"
    row-key="link"
    :pagination.sync="pagination"
    :loading="loading"
    binary-state-sort
  >
    <template v-slot:body="props">
      <q-tr :props="props" @click.native="props.expand = !props.expand">
        <q-td key="asNumber" :props="props" v-if="showAsn">
          <a @click="newWindow({name : 'as_and_ixp', params:{asn: getCellValue(props, 'asNumber') }})" href="javascript:void(0)">
            {{ getCellValue(props, "asNumber") }}
          </a>
        </q-td>
        <q-td key="link" :props="props">
          (
          <template v-for="(prefix, index) in getCellValue(props, 'link')">
            {{ index != 0?",": "" }}
            <a href="javascript:void(0)" :key="prefix" @click="$emit('prefix-details', prefix)">
              {{prefix}}
            </a>
          </template>
          )
        </q-td>
        <q-td
          key="delayChange"
          :props="props"
        >{{ getCellValue(props, "delayChange") }}</q-td>
        <q-td key="deviation" :props="props" :class="['IHR_important-cell', getCalssByDeviation(getCellValue(props, 'deviation'))]">{{ getCellValue(props, "deviation") }}</q-td>
        <q-td key="probes" :props="props" class="IHR_probe-cell">
          {{ getCellValue(props, "probes") }}
          <q-popup-proxy transition-show="flip-up" transition-hide="flip-down">
            <q-banner>
              <div
                v-for="(probeList, probeListName) in props.row.msm_prb_ids"
                :key="probeListName"
                class="IHR_probe-popup"
              >
                <span>{{ probeListName }}:</span>
                <span>{{ probeList.join(", ") }}</span>
              </div>
            </q-banner>
          </q-popup-proxy>
        </q-td>
      </q-tr>
      <q-tr v-if="props.expand" :props="props">
        <q-td colspan="100%">
          <latencymon :start-time="startTime" :stop-time="stopTime" :propb-ids="props.row.msm_prb_ids" style="max-width: 93%; margin: 0 auto;"/>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from "./CommonTableMixin";
import Latencymon from "@/components/ripe/Latencymon";

export default {
  mixins: [CommonTableMixin],
  components: {
    Latencymon
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
        rowsPerPage: 8
      },
      columns: [
        {
          name: "asNumber",
          required: true,
          label: "Autonomous System",
          align: "center",
          field: row => row.asn,
          format: val => this.$options.filters.ihr_NumberToAsOrIxp(val),
          sortable: false
        },
        {
          name: "link",
          required: true,
          label: "Link",
          align: "center",
          field: row => row.link,
          format: val => val.replace(/(\))|(^\()/g, "").split(","),
          sortable: false
        },
        {
          name: "delayChange",
          required: true,
          label: this.$t("charts.delayAndForwarding.tables.delay.delayChange"),
          align: "center",
          field: row => row.diffmedian,
          format: val => val.toFixed(2),
          sortable: true
        },
        {
          name: "deviation",
          required: true,
          label: this.$t("charts.delayAndForwarding.tables.delay.deviation"),
          align: "center",
          field: row => row.deviation,
          format: val => val.toFixed(2),
          sortable: true
        },
        {
          name: "probes",
          label: "#Probes",
          align: "center",
          field: row => row.nbprobes,
          format: val => val,
          sortable: true
        }
      ]
    };
  },
  mounted() {},
  methods: {
    getCalssByDeviation(deviation) {
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
  &probe-cell
    cursor pointer

  &probe-popup
    padding 10px
    max-width 200px

    & > span:first-child
      font-weight 500
      margin-right 6pt

  &prefix-overview-popup
    max-width 400px
</style>
