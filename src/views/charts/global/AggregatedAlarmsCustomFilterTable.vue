<template>
  <table class="custom-table">
    <thead>
      <th> Data Source </th>
      <th :colspan="maxAlarmTypesLength"> Alarm Types</th>
    </thead>
    <tr v-for="(dataSourceValue, dataSourceKey) in dataSources" :key="dataSourceKey">
      <th>
        <label>
          <input type="checkbox" :name="dataSourceKey" :value="dataSourceKey" v-model="selectedDataSources[dataSourceKey]"
            :disabled="loadingVal">
          <span> {{ dataSourceValue.metadata.title }} </span>
          <aggregated-alarms-help-button :dataSource="dataSourceKey" :data-sources="dataSources" />
        </label>
      </th>
      <td v-for="(alarmTypeValue, alarmTypeKey) in dataSourceValue.alarm_types" :key="alarmTypeKey">
        <label>
          <input type="checkbox" :name="alarmTypeKey" :value="alarmTypeKey" v-model="selectedAlarmTypes[alarmTypeKey]"
            :disabled="loadingVal">
          <span style="flex: 1;"> {{ alarmTypeValue.metadata.title }} </span>
          <select id="groupByKeyOptions" v-model="selectedGroupByKeys[alarmTypeKey]">
            <option :disabled="loadingVal || !selectedAlarmTypes[alarmTypeKey]"
              v-for="(optionValue, optionLabel) in alarmTypeValue.metadata.group_by_key_options" :value="optionValue" :key="`${optionLabel}.${optionValue}`">
              {{ optionLabel }}
            </option>
          </select>
          <aggregated-alarms-help-button :dataSource="dataSourceKey" :data-sources="dataSources"
            :alarmType="alarmTypeKey" />
        </label>
      </td>
      <td v-for="i in maxAlarmTypesLength - Object.keys(dataSourceValue.alarm_types).length" :key="'empty-' + i">
      </td>
    </tr>
  </table>
</template>

<script>
import AggregatedAlarmsHelpButton from './AggregatedAlarmsHelpButton';
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
export default {
  props: {
    dataSources: {
      type: Object,
      required: true
    },
    loadingVal: {
      type: Boolean,
      required: true
    },
    initialGroupByKeys: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      selectedAlarmTypes: this.getInitialSelectedAlarmTypes(),
      selectedDataSources: this.getInitialSelectedDataSources(),
      selectedGroupByKeys: AggregatedAlarmsUtils.deepCopy(this.initialGroupByKeys),
      areInitialAlarmTypesSelected: false
    }
  },
  computed: {
    maxAlarmTypesLength() {
      let maxAlarmTypesLength = 0;
      for (const dataSourceKey in this.dataSources) {
        const alarmTypes = Object.keys(this.dataSources[dataSourceKey].alarm_types)
        maxAlarmTypesLength = Math.max(maxAlarmTypesLength, alarmTypes.length);
      }
      return maxAlarmTypesLength
    },
  },
  components: {
    AggregatedAlarmsHelpButton,
  },
  watch: {
    selectedAlarmTypes: {
      handler: function (newSelectedAlarmTypes) {
        for (const dataSource in this.dataSources) {
          const alarmTypes = this.dataSources[dataSource].alarm_types
          let dataSourceSelected = false
          for (const alarmType in alarmTypes) {
            if (newSelectedAlarmTypes[alarmType]) {
              dataSourceSelected = true
              break
            }
          }
          this.$set(this.selectedDataSources, dataSource.toLowerCase(), dataSourceSelected);
        }
        this.$emit('filter-alarms-by-alarm-types', newSelectedAlarmTypes)
      },
      deep: true,
      immediate: true
    },
    selectedDataSources: {
      handler: function (newSelectedDataSources) {
        for (const dataSource in this.dataSources) {
          const alarmTypes = this.dataSources[dataSource].alarm_types
          const isDataSourceSelected = newSelectedDataSources[dataSource]
          if (isDataSourceSelected) {
            const noSelectedEquivalentAlarmTypes = Object.keys(alarmTypes).every((alarmType) => this.selectedAlarmTypes[alarmType] !== true)
            if (noSelectedEquivalentAlarmTypes) {
              for (const alarmType in alarmTypes) {
                this.$set(this.selectedAlarmTypes, alarmType, true);
              }
            } else {
              for (const alarmType in alarmTypes) {
                if (!this.selectedAlarmTypes[alarmType]) {
                  this.$set(this.selectedAlarmTypes, alarmType, false)
                }
              }
            }
          } else {
            for (const alarmType in alarmTypes) {
              this.$set(this.selectedAlarmTypes, alarmType, false)
            }
          }
        }
      },
      deep: true,
      immediate: true
    },
    selectedGroupByKeys: {
      handler: function (newSelectedGroupByKeys) {
        this.$emit('group-alarms-by-keys', newSelectedGroupByKeys)
      },
      deep: true
    }
  },
  methods: {
    getInitialSelectedAlarmTypes() {
      const selectedAlarmTypesByDefault = {}
      for (const dataSource in this.dataSources) {
        const alarmTypes = this.dataSources[dataSource].alarm_types
        for (const alarmType in alarmTypes) {
          selectedAlarmTypesByDefault[alarmType] = alarmTypes[alarmType].metadata.is_default_selected
        }
      }
      return selectedAlarmTypesByDefault
    },
    getInitialSelectedDataSources() {
      const selectedDataSourcesByDefault = {}
      for (const dataSource in this.dataSources) {
        const alarmTypes = this.dataSources[dataSource].alarm_types
        selectedDataSourcesByDefault[dataSource] = Object.keys(this.dataSources[dataSource].alarm_types).map((alarmType) => alarmTypes[alarmType].metadata.is_default_selected).some((val) => val === true)
      }
      return selectedDataSourcesByDefault
    }
  }
};
</script>

<style scoped>
.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  text-align: center;
  border: 1px solid #ddd;
  padding: 10px;
  width: calc(100% / 5);
  /* Distribute width evenly among 4 cells */
}

table {
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 5px 10px;
  border: 1px solid black;
}

th label,
td label {
  display: flex;
  align-items: center;
}


th input[type="checkbox"],
td input[type="checkbox"] {
  margin-right: 5px;
}

#groupByKeyOptions {
  flex: 1;
}
</style>
