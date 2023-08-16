<template>
    <table class="custom-table">
        <thead>
            <th> Data Source </th>
            <th :colspan="maxAlarmTypesLength"> Alarm Types</th>
        </thead>
        <tr v-for="(dataSource, index) in dataSourceAlarmTypes" :key="index">
            <th>
                <label>
                    <input type="checkbox" :name="dataSource.value.value" :value="dataSource.value.value"
                        v-model="selectedDataSources[dataSource.value.value]" :disabled="loadingVal">
                    <span> {{ dataSource.value.label }} </span>
                    <aggregated-alarms-help-button :dataSource="dataSource.value.value" :alarms-metadata="alarmsMetadata"
                        :data-source-alarm-types="dataSourceAlarmTypes" />
                </label>
            </th>
            <td v-for="alarmType in dataSource.alarm_types" :key="alarmType.value">
                <label>
                    <input type="checkbox" :name="alarmType.value" :value="alarmType.value"
                        v-model="selectedAlarmTypes[alarmType.value]" :disabled="loadingVal">
                    <span> {{ alarmType.label }} </span>
                    <aggregated-alarms-help-button :dataSource="dataSource.value.value" :alarmType="alarmType.value"
                        :alarms-metadata="alarmsMetadata" :data-source-alarm-types="dataSourceAlarmTypes" />
                </label>
            </td>
            <td v-for="i in maxAlarmTypesLength - Object.keys(dataSourceAlarmTypes[dataSource.value.value].alarm_types).length"
                :key="'empty-' + i">
            </td>
        </tr>
    </table>
</template>
  
<script>
import AggregatedAlarmsHelpButton from './AggregatedAlarmsHelpButton';
export default {
    props: {
        dataSourceAlarmTypes: {
            type: Object,
            required: true
        },
        selectedDataSources: {
            type: Object,
            required: true
        },
        selectedAlarmTypes: {
            type: Object,
            required: true
        },
        alarmsMetadata: {
            type: Object,
            required: true
        },
        loadingVal: {
            type: Boolean,
            required: true
        }
    },
    computed: {
        maxAlarmTypesLength() {
            let maxAlarmTypesLength = 0;
            for (const dataSourceKey in this.dataSourceAlarmTypes) {
                const alarmTypes = Object.keys(this.dataSourceAlarmTypes[dataSourceKey].alarm_types)
                maxAlarmTypesLength = Math.max(maxAlarmTypesLength, alarmTypes.length);
            }
            return maxAlarmTypesLength
        },
    },
    components: {
        AggregatedAlarmsHelpButton,
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
</style>