<template>
  <q-table :data="rows" :columns="columns" row-key="asNumber" :pagination.sync="pagination" :loading="loading" binary-state-sort flat>
    <template v-slot:body="props">
      <q-tr :props="props" @click.native="routeToAsn(props.colsMap.asNumber, props.row)" class="IHR_table-row">
        <q-td
          v-for="col in columns"
          :key="col.name"
          :props="props"
          :class="col.name == 'hegemony' ? ['IHR_important-cell', getCalssByHegemony(props)] : ''"
        >
          <div v-if="col.name == 'direct'">
            <q-icon name="fas fa-check" v-if="props.row.direct" />
            <q-icon name="fas fa-times" v-if="!props.row.direct" />
          </div>
          {{ col.format(col.field(props.row)) }}</q-td
        >
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'

export default {
  mixins: [CommonTableMixin],
  props: {
    useOriginAsn: {
      type: Boolean,
    },
  },
  data() {
    let columns
    if (this.useOriginAsn) {
      columns = [
        {
          name: 'asName',
          required: true,
          label: 'Autonomous System Name',
          align: 'left',
          field: row => {
            return row.originasn_name == '' ? '--' : row.originasn_name
          },
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'asNumber',
          required: true,
          label: 'ASN',
          align: 'left',
          field: row => row.originasn,
          format: val => val,
          sortable: true,
        },
      ]
    } else {
      columns = [
        {
          name: 'asName',
          required: true,
          label: 'Autonomous System Name',
          align: 'left',
          field: row => row.asn_name,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'asNumber',
          required: true,
          label: 'ASN',
          align: 'left',
          field: row => row.asn,
          format: val => val,
          sortable: true,
        },
      ]
    }

    return {
      pagination: {
        sortBy: 'hegemony',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      },
      columns: [
        ...columns,
        {
          name: 'hegemony',
          label: 'Dependency',
          align: 'center',
          field: row => row.hege,
          format: val => `${(val * 100).toFixed(1)}%`,
          sortable: true,
        },
        {
          name: 'hegemonyIncrement',
          label: '% Change',
          align: 'center',
          field: row => row.increment,
          format: val => {
            if (val == undefined) return 0
            if (val > 0) return '+' + val.toFixed(1) + '%'
            return val.toFixed(1) + '%'
          },
          sortable: true,
        },
        {
          name: 'direct',
          label: 'Direct Neighbour',
          align: 'center',
          field: row => row.direct,
          format: () => '',
          sortable: true,
        },
      ],
    }
  },
  methods: {
    OLDrouteToAsn(asn, row) {
      asn = asn.format(asn.field(row))
      let path = this.$route.path
      let link = '#'
      link += path.substring(0, path.lastIndexOf('/') + 1)
      link += this.$options.filters.ihr_NumberToAsOrIxp(asn)
      window.open(link)
    },
    routeToAsn(asn, row) {
      asn = asn.format(asn.field(row))
      this.$router.push({
        name: 'networks',
        params: { asn: this.$options.filters.ihr_NumberToAsOrIxp(asn) },
      })
    },
    getCalssByHegemony(props) {
      let hegemony = this.getCellValue(props, 'hegemony')
      if (hegemony >= 0.5) return 'IHR_color-deviation-high-threshold'
      if (hegemony >= 0.25) return 'IHR_color-deviation-mid-threshold'
      return ''
    },
  },
}
</script>
<style lang="stylus"></style>
