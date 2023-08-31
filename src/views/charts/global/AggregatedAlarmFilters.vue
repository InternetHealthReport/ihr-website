<template>
  <div class="container">
    <aggregated-alarms-custom-table :data-source-alarm-types="dataSourceAlarmTypes" :alarms-metadata="alarmsMetadata"
      :loadingVal="loadingVal" @filter-alarms-by-alarm-types="filterAlarmsByAlarmTypesHandler" />
    <div class="flex-container">
      <div class="datetime-filter">
        <h3 class="filter__category-title">Date Time Filter:</h3>
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
          :disabled="loadingVal">Apply</button>
        <button @click="resetTime" id="reset-time-btn" type="button" :disabled="loadingVal">Reset Time</button>
      </div>
      <div class="severity-filter">
        <h3 class="filter__category-title">Severity Levels:</h3>
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
      <div class="reset-granularity">
        <h3 class="filter__category-title">Reset Granularity:</h3>
        <button @click="resetGranularity" id="reset-granularity-btn" type="button" :disabled="loadingVal">Reset
          Granularity</button>
      </div>

    </div>
  </div>
</template>

<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import AggregatedAlarmsCustomTable from './AggregatedAlarmsCustomTable'
export default {
  components: {
    AggregatedAlarmsCustomTable
  },
  props: {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    alarmsMetadata: {
      type: Object,
      required: true,
    },
    loadingVal: {
      type: Boolean,
      required: true
    }
  },
  created() {
    if (!this.loadingVal) {
      this.$emit('filter-alarms-by-severities', this.severitiesSelectedList)
    }
  },
  computed: {
    dataSourceAlarmTypes() {
      const dataSources = this.alarmsMetadata.data_sources

      const dataSourceAlarmTypes = {}
      for (const dataSourceKey in dataSources) {
        const dataSourceLabel = AggregatedAlarmsUtils.titleCase(dataSourceKey)
        const dataSourceDescriptionTitled = AggregatedAlarmsUtils.titleCase(dataSources[dataSourceKey].description)
        dataSourceAlarmTypes[dataSourceKey] = {
          alarm_types: {},
          value: {
            value: dataSourceKey,
            label: dataSourceLabel,
            content: { title: dataSourceLabel, description: dataSourceDescriptionTitled }
          }
        }

        const alarmTypesMetaData = dataSources[dataSourceKey].alarm_types
        for (const alarmTypeKey in alarmTypesMetaData) {
          const alarmTypeLabel = AggregatedAlarmsUtils.titleCase(alarmTypeKey)
          const alarmTypeDescriptionTitled = AggregatedAlarmsUtils.titleCase(alarmTypesMetaData[alarmTypeKey].description)
          dataSourceAlarmTypes[dataSourceKey]['alarm_types'][alarmTypeKey] = {
            value: alarmTypeKey,
            label: alarmTypeLabel,
            content: { title: alarmTypeLabel, description: alarmTypeDescriptionTitled },
          }
        }
      }

      return dataSourceAlarmTypes
    },
    alarmTypes() {
      const dataSources = this.alarmsMetadata.data_sources

      const alarmTypes = []
      for (const dataSourceKey in dataSources) {

        const alarmTypesMetaData = dataSources[dataSourceKey].alarm_types

        for (const alarmTypeKey in alarmTypesMetaData) {
          const alarmTypeLabel = AggregatedAlarmsUtils.titleCase(alarmTypeKey)
          const alarmTypeDescriptionTitled = AggregatedAlarmsUtils.titleCase(alarmTypesMetaData[alarmTypeKey].description)

          alarmTypes.push({
            value: alarmTypeKey,
            label: alarmTypeLabel,
            showModal: false,
            content: { title: alarmTypeLabel, description: alarmTypeDescriptionTitled },
          });
        }
      }
      return alarmTypes;
    },
    dataSources() {
      const dataSources = this.alarmsMetadata.data_sources

      const dataSourcesResult = []
      for (const dataSourceKey in dataSources) {
        const dataSourceLabel = AggregatedAlarmsUtils.titleCase(dataSourceKey)
        const dataSourceDescriptionTitled = AggregatedAlarmsUtils.titleCase(dataSources[dataSourceKey].description)

        dataSourcesResult.push({
          value: dataSourceKey,
          label: dataSourceLabel,
          showModal: false,
          content: { title: dataSourceLabel, description: dataSourceDescriptionTitled },
        });
      }
      return dataSourcesResult;
    },
    severitiesSelectedList() {
      const severitiesSelectedList = []
      for (const [severityType, isSelected] of Object.entries(this.severities)) {
        if (isSelected) {
          severitiesSelectedList.push(severityType)
        }
      }
      return severitiesSelectedList
    }
  },
  watch: {
    severitiesSelectedList: {
      handler: function (newSeveritiesSelectedList) {
        this.$emit('filter-alarms-by-severities', newSeveritiesSelectedList)
      },
      deep: true
    },

    startTime: {
      handler: function (newStartTime) {
        this.startDateTime = AggregatedAlarmsUtils.formatUTCTime(newStartTime)
      },
      deep: true
    },
    endTime: {
      handler: function (newEndTime) {
        this.endDateTime = AggregatedAlarmsUtils.formatUTCTime(newEndTime)
      },
      deep: true
    },
    startDateTime: {
      handler: function (newStartDateTime) {
        this.startAndEndDateTimeRangesHandler(newStartDateTime, this.endDateTime)
      },
      deep: true
    },
    endDateTime: {
      handler: function (newEndDateTime) {
        this.startAndEndDateTimeRangesHandler(this.startDateTime, newEndDateTime)
      },
      deep: true
    },

  },
  data() {
    return {
      alarmTypesCategoryTitle: 'Alarm Types:',
      dataSourcesCategoryTitle: 'Data Sources:',
      severities: { low: true, medium: true, high: true },
      maxAlarmTypesLength: 0,
      startDateTime: AggregatedAlarmsUtils.formatUTCTime(this.startTime),
      endDateTime: AggregatedAlarmsUtils.formatUTCTime(this.endTime),
      minStartDateTime: AggregatedAlarmsUtils.formatUTCTime(this.startTime),
      maxEndDateTime: AggregatedAlarmsUtils.formatUTCTime(this.endTime),
    };
  },
  methods: {
    startAndEndDateTimeRangesHandler(startDateTime, endDateTime) {
      const isStartTimeTheMax = this.isStartTimeTheMax(startDateTime, endDateTime)
      if (isStartTimeTheMax) {
        const alertMessage = 'Start Date cannot be greater than End Date'
        alert(alertMessage);
        this.startDateTime = AggregatedAlarmsUtils.formatUTCTime(this.startTime)
        this.endDateTime = AggregatedAlarmsUtils.formatUTCTime(this.endTime)
      }
    },

    isStartTimeTheMax(startDateTime, endDateTime) {
      const startDateUTCTime = startDateTime + ':00Z'
      const endDateUTCTime = endDateTime + ':00Z'
      const compareStartAndEndDateTime = AggregatedAlarmsUtils.compareUtcStrings(startDateUTCTime, endDateUTCTime)
      if (compareStartAndEndDateTime === 1) {
        return true
      }
      return false
    },
    filterAlarmsByTime(startDateTime, endDateTime) {
      const startDateUTCTime = `${startDateTime}:00Z`
      const endDateUTCTime = `${endDateTime}:00Z`
      const dateTimeFilter = { startDateTime: startDateUTCTime, endDateTime: endDateUTCTime };
      this.$emit('filter-alarms-by-time', dateTimeFilter);
    },

    resetTime() {
      this.startDateTime = AggregatedAlarmsUtils.formatUTCTime(this.startTime)
      this.endDateTime = AggregatedAlarmsUtils.formatUTCTime(this.endTime)
      this.filterAlarmsByTime(this.startDateTime, this.endDateTime)
      this.$emit('reset-time');
    },

    resetGranularity() {
      this.$emit('reset-granularity');
    },

    filterAlarmsByAlarmTypesHandler(newSelectedAlarmTypes) {
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

.reset-granularity,
.severity-filter {
  flex: 1;
  text-align: center;

}

.severity-filter label {
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
.data-sources,
.reset-granularity {
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
