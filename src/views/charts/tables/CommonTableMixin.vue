<script>
import networkName from '@/plugins/networkName'

export default {
  props: {
    data: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
    filter: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      filteredRows: [],
      filterTable: '',
      rows: this.data,
    }
  },
  methods: {
    prettyName(shortname) {
      return networkName(shortname)
    },
    getCellValue(props, columnName) {
      let col = props.colsMap[columnName]
      return col.format(col.field(props.row))
    },
    filterFct(rows, terms, cols, cellValue) {
      const lowerTerms = terms ? terms.toLowerCase() : ''
      this.filteredRows = rows.filter(row => cols.some(col => (cellValue(col, row) + '').toLowerCase().indexOf(lowerTerms) !== -1))
      return this.filteredRows
    },
    dateHourShift(datetime, shift) {
      var res = new Date(datetime)
      var sign = shift < 0 ? -1 : 1
      res.setHours(res.getHours() + sign * Math.max(1, Math.abs(shift)))
      return res
    },
  },
  watch: {
    filteredRows(newValue) {
      this.$emit('filteredRows', [this.filterTable, newValue])
    },
    filterTable(newValue) {
      if (newValue == '') this.filteredRows = this.rows
    },
    data(newValue) {
      this.rows = newValue
    },
    rows(newValue) {
      this.filteredRows = newValue
    },
    filter(newValue) {
      this.filterTable = newValue
    },
  },
}
</script>
<style lang="stylus">
.IHR_nohover
    &:first-child
      padding-top 0px
      padding-bottom 20px
      padding-right 20px
      padding-left 20px
      background #fafafa

.IHR_side_borders
    &:first-child
        padding-top 20px
        border-style solid
        border-color #dddddd
        border-top-width 0px
        border-left-width 1px
        border-right-width 1px
        border-bottom-width 1px
        border-radius 5px
        background #ffffff


.myClass

    tbody td
        text-align left
</style>
