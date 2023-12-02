import { toRefs, ref, computed, watch, onMounted } from 'vue'
import { debounce } from 'quasar'
import { Query } from './IhrApi'
import networkName from './networkName'

const DEFAULT_DEBOUNCE = 50

//remember to put ref="chart" into the charts!
export default function commonChart (props, ctx) {
  // const { startTime, endTime, fetch, filter } = toRefs(props)
  const loading = ref(true)
  const noData = ref(false)
  // const filters = ref([])

  //prevent calls within 500ms and execute only the last one
  const debouncedApiCall = ref(debounce(
    () => {
      if (!fetch.value) {
        return
      }
      loading.value = true
      ctx.apiCall()

    },
    DEFAULT_DEBOUNCE,
    false
  ))

  // const filterValue = computed(() => {
  //   return filter.value
  // })

  const prettyName = (shortname) => {
    return networkName(shortname)
  }

  const relayout = () => {
    // ctx.refs[myId.value].relayout()
    ctx.myId.value.relayout()
  }

  const filteredRows = (val) => {
    ctx.emit("filteredRows", val)
  }

  const updateQuery = (values) => {
    let changed = false
    for (const key in values) {
      if (ctx.root.$route.query[key] != values[key]) {
        changed = true
      }
    }
    if (changed) {
      ctx.root.$router.replace({
        query: Object.assign({}, ctx.root.$route.query, values),
      })
    }
  }

  watch(loading, (newValue) => {
    ctx.emit("loading", newValue)
  })
  // watch(startTime, (newValue) => {
  //   filters.value.forEach((filter) => {
  //     filter.startTime(newValue, Query.GTE)
  //   })
  //   debouncedApiCall.value()
  // })
  // watch(endTime, (newValue) => {
  //   filters.value.forEach((filter) => {
  //     filter.endTime(newValue, Query.LTE)
  //   })
  //   debouncedApiCall.value()
  // })
  // watch(fetch, () => {
  //   debouncedApiCall.value()
  // })

  onMounted(() => {
    debouncedApiCall.value()
  })

  return {
    loading,
    noData,
    // filters,
    // myId,
    debouncedApiCall,
    // filterValue,
    prettyName,
    relayout,
    filteredRows,
    updateQuery,
  }
}