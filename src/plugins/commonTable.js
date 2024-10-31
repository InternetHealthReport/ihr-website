import { toRefs, ref, watch } from 'vue'
import networkName from './networkName'

export default function commonTable(props, ctx) {
  const { data, loading, filter } = toRefs(props)
  const filteredRows = ref([])
  const filterTable = ref("")
  const rows = ref(data.value)

  const prettyName = (shortname) => {
    return networkName(shortname)
  }

  const getCellValue = (props, columnName) => {
    let col = props.colsMap[columnName]
    return col.format(col.field(props.row))
  }

  const filterFct = (rows, terms, cols, cellValue) => {
    const lowerTerms = terms ? terms.toLowerCase() : ''
    filteredRows.value = rows.filter((row) =>
      cols.some(
        (col) =>
          (cellValue(col, row) + "").toLowerCase().indexOf(lowerTerms) !== -1
      )
    )
    return filteredRows.value
  }

  const dateHourShift = (datetime, shift) => {
    var res = new Date(datetime)
    var sign = shift < 0 ? -1 : 1
    res.setHours(res.getHours() + sign * Math.max(1, Math.abs(shift)))
    return res
  }

  const setRows = (newData) => {
    rows.value = newData
  }

  watch(filteredRows, (newValue) => {
    if (ctx.emit && ctx.emit.filteredRows) {
      ctx.emit('filteredRows', [filterTable.value, newValue])
    }
  })
  watch(filterTable, (newValue) => {
    if (newValue == "") filteredRows.value = rows.value
  })
  watch(data, (newValue) => {
    rows.value = newValue
  })
  watch(rows, (newValue) => {
    filteredRows.value = newValue
    // Force a re-render even if filteredRows didn't technically change
    nextTick(() => { 
        if (ctx.emit && ctx.emit.filteredRows) {
            ctx.emit('filteredRows', [filterTable.value, newValue])
        }
    });
})
  return {
    filteredRows,
    filterTable,
    rows,
    prettyName,
    getCellValue,
    filterFct,
    dateHourShift,
    setRows
  }
}
