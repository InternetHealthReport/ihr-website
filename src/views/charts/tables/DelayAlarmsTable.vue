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
      <q-tr :props="props">
        <q-td key="link" :props="props">
          (
          <template v-for="(prefix, index) in getCellValue(props, 'link')">
            {{ index != 0?",": "" }}
            <a href="javascript:void(0)" :key="prefix" @click="$emit('prefix-details', prefix)">
              {{prefix}}
              <q-popup-proxy transition-show="flip-up" transition-hide="flip-down">
                <q-banner>
                  <reverse-dns-ip :ip="prefix" class="IHR_reverse-dns-ip-improved"/>
                  <prefix-overview :ip="prefix" class="IHR_prefix-overview-improved IHR_prefix-overview-popup" />
                </q-banner>
              </q-popup-proxy>
            </a>
          </template>
          )
        </q-td>
        <q-td
          key="delayChange"
          :props="props"
          :class="getdelayChangeCalss(getCellValue(props, 'delayChange'))"
        >{{ getCellValue(props, "delayChange") }}</q-td>
        <q-td key="deviation" :props="props">{{ getCellValue(props, "deviation") }}</q-td>
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
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from "./CommonTableMixin";
import PrefixOverview from "@/components/ripe/PrefixOverview";
import ReverseDnsIp from "@/components/ripe/ReverseDnsIp";

export default {
  mixins: [CommonTableMixin],
  components: {
    PrefixOverview,
    ReverseDnsIp
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
    getCellValue(props, columnName) {
      let col = props.colsMap[columnName];
      return col.format(col.field(props.row));
    },
    getdelayChangeCalss(value) {
      return this.getColorChangeClass(-value);
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
