<template>
  <div class="container">
    <aggregated-alarms-custom-filter-table v-if="!isRowFilter" :data-sources="dataSources" :loadingVal="loadingVal"
      :initial-group-by-keys="initialGroupByKeys" @filter-alarms-by-alarm-types="onFilterAlarmsByAlarmTypes"
      @group-alarms-by-keys="onGroupAlarmsByKeys" />
    <div class="flex-container">
      <div class="datetime-filter">
        <h3 class="filter__category-title">Time Filter (UTC)</h3>
        <div class="datetime-picker">
          <label for="start-datetime">Start DateTime:</label>
          <input type="datetime-local" id="start-datetime" v-model="startDateTime" :min="minStartDateTime"
            :max="maxEndDateTime" :disabled="loadingVal">
        </div>
        <div class="datetime-picker">
          <label for="end-datetime">End DateTime:</label>
          <input type="datetime-local" id="end-datetime" v-model="endDateTime" :min="minStartDateTime"
            :max="maxEndDateTime" :disabled="loadingVal">
        </div>
        <button @click="filterAlarmsByTime(startDateTime, endDateTime)" id="apply-btn" type="button"
          :disabled="applyTimeFiltersButtonDisabled">Apply</button>
        <button @click="resetTime" id="reset-time-btn" type="button" :disabled="restTimeFiltersButtonDisabled">Reset
          Time</button>
      </div>
      <div class="filters">
        <h3 class="filter__category-title">Severity Levels</h3>
        <label>
          <input type="checkbox" v-model="severities.low" :disabled="loadingVal"> Low
        </label>
        <label>
          <input type="checkbox" v-model="severities.medium" :disabled="loadingVal"> Medium
        </label>
        <label>
          <input type="checkbox" v-model="severities.high" :disabled="loadingVal"> High
        </label>
      </div>
      <div class="filters">
        <h3 class="filter__category-title">IP Address Families</h3>
        <label>
          <input type="checkbox" v-model="ipAddressFamilies['4']" :disabled="loadingVal"> IPv4
        </label>
        <label>
          <input type="checkbox" v-model="ipAddressFamilies['6']" :disabled="loadingVal"> IPv6
        </label>
      </div>

    </div>
  </div>
</template>

<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import AggregatedAlarmsCustomFilterTable from './AggregatedAlarmsCustomFilterTable'
export default {
  components: {
    AggregatedAlarmsCustomFilterTable
  },
  props: {
    isRowFilter: {
      type: Boolean,
      required: false,
      default: () => false
    },
    timeFilters: {
      type: Object,
      required: true,
    },
    dataSources: {
      type: Object,
      required: false,
    },
    loadingVal: {
      type: Boolean,
      required: false,
    },
    initialGroupByKeys: {
      type: Object,
      required: false
    },
  },
  computed: {
    severitiesSelectedList() {
      const severitiesSelectedList = []
      for (const [severityType, isSelected] of Object.entries(this.severities)) {
        if (isSelected) {
          severitiesSelectedList.push(severityType)
        }
      }
      return severitiesSelectedList
    },
    ipAddressFamilySelectedList() {
      const ipAddressFamilySelectedList = []
      for (const [ipAddressFamily, isSelected] of Object.entries(this.ipAddressFamilies)) {
        if (isSelected) {
          ipAddressFamilySelectedList.push(Number(ipAddressFamily))
        }
      }
      return ipAddressFamilySelectedList
    },
    minStartDateTime() {
      const startUnixTime = this.timeFiltersCopied.startUnixTime
      const startTimeObj = new Date(startUnixTime * 1000)
      const startTimeFormatted = AggregatedAlarmsUtils.formatUTCTime(startTimeObj)
      return startTimeFormatted
    },
    maxEndDateTime() {
      const endUnixTime = this.timeFiltersCopied.endUnixTime
      const endTimeObj = new Date(endUnixTime * 1000)
      const endTimeFormatted = AggregatedAlarmsUtils.formatUTCTime(endTimeObj)
      return endTimeFormatted
    },
    restTimeFiltersButtonDisabled() {
      const { startUnixTime, endUnixTime } = this.timeFilters
      if ((this.timeFiltersCopied.startUnixTime == startUnixTime && this.timeFiltersCopied.endUnixTime == endUnixTime) || this.loadingVal) {
        return true
      } else {
        return false
      }
    },
    applyTimeFiltersButtonDisabled() {
      const startDateTimeCopied = AggregatedAlarmsUtils.formatUTCTime(new Date(this.timeFiltersCopied.startUnixTime * 1000))
      const endDateTimeCopied = AggregatedAlarmsUtils.formatUTCTime(new Date(this.timeFiltersCopied.endUnixTime * 1000))
      if ((this.startDateTime == startDateTimeCopied && this.endDateTime == endDateTimeCopied) || this.loadingVal) {
        return true
      } else {
        return false
      }
    }
  },
  watch: {
    severitiesSelectedList: {
      handler: function (newSeveritiesSelectedList) {
        this.$emit('filter-alarms-by-severities', newSeveritiesSelectedList)
      },
      deep: true
    },
    ipAddressFamilySelectedList: {
      handler: function (newIpAddressFamilySelectedList) {
        this.$emit('filter-alarms-by-ip-address-family', newIpAddressFamilySelectedList)
      }
    },
    timeFilters: {
      handler: function (newTimeFilters) {
        const { startUnixTime, endUnixTime } = newTimeFilters
        this.startDateTime = AggregatedAlarmsUtils.formatUTCTime(new Date(startUnixTime * 1000))
        this.endDateTime = AggregatedAlarmsUtils.formatUTCTime(new Date(endUnixTime * 1000))
      },
      deep: true,
      immediate: true
    },
  },
  data() {
    return {
      alarmTypesCategoryTitle: 'Alarm Types:',
      dataSourcesCategoryTitle: 'Data Sources:',
      maxAlarmTypesLength: 0,
      startDateTime: null,
      endDateTime: null,
      timeFiltersCopied: this.timeFilters,
      severities: { low: true, medium: true, high: true },
      ipAddressFamilies: { 4: true, 6: true }
    };
  },
  methods: {
    onGroupAlarmsByKeys(keys) {
      this.$emit('group-alarms-by-keys', keys)
    },
    isStartTimeTheMax(startDateTime, endDateTime) {
      const startDateUTCTime = startDateTime + ':00Z'
      const endDateUTCTime = endDateTime + ':00Z'
      if (Date.parse(startDateUTCTime) > Date.parse(endDateUTCTime)) {
        return true
      } else {
        return false
      }
    },
    filterAlarmsByTime(startDateTime, endDateTime) {
      const isStartTimeTheMax = this.startAndEndDateTimeRangesHandler(startDateTime, endDateTime)
      if (!isStartTimeTheMax) {
        const dateTimeFilter = { startDateTime: `${startDateTime}:00Z`, endDateTime: `${endDateTime}:00Z` };
        this.$emit('filter-alarms-by-time', dateTimeFilter);
      }
    },
    startAndEndDateTimeRangesHandler(startDateTime, endDateTime) {
      const isStartTimeTheMax = this.isStartTimeTheMax(startDateTime, endDateTime)
      if (isStartTimeTheMax) {
        const alertMessage = 'Start Date cannot be greater than End Date'
        alert(alertMessage);
        this.startDateTime = AggregatedAlarmsUtils.formatUTCTime(new Date(this.timeFilters.startUnixTime * 1000))
        this.endDateTime = AggregatedAlarmsUtils.formatUTCTime(new Date(this.timeFilters.endUnixTime * 1000))
        return true
      } else {
        return false
      }
    },
    resetTime() {
      this.startDateTime = this.minStartDateTime
      this.endDateTime = this.maxEndDateTime
      this.filterAlarmsByTime(this.startDateTime, this.endDateTime)
      this.$emit('reset-time');
    },

    resetGranularity() {
      this.$emit('reset-granularity');
    },

    onFilterAlarmsByAlarmTypes(newSelectedAlarmTypes) {
      this.$emit('filter-alarms-by-alarm-types', newSelectedAlarmTypes)
    }
  },
}
</script>

<style scoped>
.container {
  border-radius: 10px;
  padding: 2px 20px 20px 20px;
  color: #283237;
}

.flex-container {
  display: flex;
}

.filters {
  flex: 1;
  text-align: center;
}

.filters label {
  margin-right: 10px;
}

.datetime-filter {
  flex: 1;
}

.label__input {
  margin: 2px;
}

.type-filters,
.datetime-filter,
.data-sources {
  color: #283237;
}

input[type="checkbox"],
input[type="datetime-local"],
button {
  color: #283237;
}

.data-sources ul {
  list-style-type: none;
  padding: 0;
}

.data-sources li {
  margin-bottom: 5px;
}

.heading-h1 {
  color: #283237;
  font-size: 2rem;
}


label {
  display: inline-block;
}

.filter__category-title {
  display: block;
  font-size: 1.17em;
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  font-weight: bold;
}

.button-container {
  margin: 3px 3px 3px 3px;
}

#apply-btn,
#reset-time-btn,

.datetime-picker {
  margin: 7px;
}

#start-datetime {
  margin-left: 6px;
}

#end-datetime {
  margin-left: 12px;
}
</style>
