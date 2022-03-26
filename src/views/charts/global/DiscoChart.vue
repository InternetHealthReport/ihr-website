<template>
  <div class="IHR_chart">
    <div>
      <disco-map :events="mapData" ref="ihrChartMap" :loading="loading" />
      <disco-alarms-table
        :start-time="startTime"
        :stop-time="endTime"
        :data="dataEvents"
        :loading="loading"
        :filter="filterValue"
        @filteredRows="filteredRows"
        @prefix-details="$emit('prefix-details', $event)"
      />
    </div>
  </div>
</template>

<script>
import NetworkDisco from '../DiscoChart'
import DiscoMap from './DiscoMap.vue'
import DiscoAlarmsTable from '../tables/DiscoAlarmsTable.vue'
import { DiscoEventQuery } from '@/plugins/query/IhrQuery'

const DEFAULT_DISCO_AVG_LEVEL = 10
const DEFAULT_MIN_DISCO_DURATION = 5
//under this gap 2 consecutive event are considered like 1 that change value

//utility functions

/**
 * Push a non event into the graph at position time
 */

export default {
  extends: NetworkDisco,
  components: {
    DiscoAlarmsTable,
    DiscoMap,
  },
  props: {
    minAvgLevel: {
      default: DEFAULT_DISCO_AVG_LEVEL,
    },
    streamName: {
      default: '',
    },
  },
  data() {
    return {
      mapData: [],
    }
  },
  methods: {
    apiCall() {
      this.filters[0].streamName(this.streamName).timeInterval(this.startTime, this.endTime).avgLevel(this.minAvgLevel, DiscoEventQuery.GTE)
      this.loading = true
      this.$ihr_api.disco_events(
        this.filters[0],
        result => {
          var events = []
          result.results.forEach(event => {
            event.duration = this.duration(event.starttime, event.endtime, 0)
            if (event.duration > DEFAULT_MIN_DISCO_DURATION || event.duration == 0) {
              events.push(event)
            }
          })
          this.dataEvents = events
          this.mapData = events
          this.loading = false
        },
        error => {
          console.error(error) //FIXME do a correct alert
        }
      )
    },
    filteredRows(data) {
      this.mapData = data[1]
      this.$emit('filteredRows', data)
    },
  },
  watch: {
    minAvgLevel(newValue) {
      this.filters.forEach(filter => {
        filter.avgLevel(newValue, DiscoEventQuery.GTE)
      })
      this.debouncedApiCall()
    },
  },
}

export { DEFAULT_DISCO_AVG_LEVEL }
</script>
