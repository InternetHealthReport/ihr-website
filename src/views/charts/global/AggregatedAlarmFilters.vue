<template>
    <div class="container">
        <aggregated-alarm-filters-helper :categoryTitle="alarmTypesCategoryTitle" :items="alarmTypes"
            :selectedItems="selectedAlarmTypes" :loadingVal="loadingVal" />

        <aggregated-alarm-filters-helper :categoryTitle="dataSourcesCategoryTitle" :items="dataSources"
            :selectedItems="selectedDataSources" :loadingVal="loadingVal" />


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

            <div class="reset-granularity">
                <h3 class="filter__category-title">Reset Granularity:</h3>
                <button @click="resetGranularity" id="reset-granularity-btn" type="button" :disabled="loadingVal">Reset
                    Granularity</button>
            </div>
        </div>
    </div>
</template>

<script>
import { titleCase, formatUTCTime, compareUtcStrings } from '@/plugins/AggregatedAlarmsUtils'
import AggregatedAlarmFiltersHelper from './AggregatedAlarmFiltersHelper';

export default {
    components: { AggregatedAlarmFiltersHelper },
    props: {
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        alarmsInfo: {
            type: Object,
            required: true,
        },
        loadingVal: {
            type: Boolean,
            required: true
        }
    },
    computed: {
        alarmTypes() {
            const { data_sources: dataSources } = this.alarmsInfo.metadata

            const alarmTypes = []
            for (const dataSourceKey in dataSources) {
                const alarmTypesMetaData = dataSources[dataSourceKey].alarm_types

                for (const alarmTypeKey in alarmTypesMetaData) {
                    const alarmTypeLabel = titleCase(alarmTypeKey)
                    const alarmTypeDescriptionTitled = titleCase(alarmTypesMetaData[alarmTypeKey].description)

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
            const { data_sources: dataSources } = this.alarmsInfo.metadata

            const dataSourcesResult = []
            for (const dataSourceKey in dataSources) {
                const dataSourceLabel = titleCase(dataSourceKey)
                const dataSourceDescriptionTitled = titleCase(dataSources[dataSourceKey].description)

                dataSourcesResult.push({
                    value: dataSourceKey,
                    label: dataSourceLabel,
                    showModal: false,
                    content: { title: dataSourceLabel, description: dataSourceDescriptionTitled },
                });
            }
            return dataSourcesResult;
        },
        isStartTimeTheMax() {
            const startDateUTCTime = this.startDateTime + ':00Z'
            const endDateUTCTime = this.endDateTime + ':00Z'
            const compareStartAndEndDateTime = compareUtcStrings(startDateUTCTime, endDateUTCTime)
            if (compareStartAndEndDateTime === 1) {
                return true
            }
            return false
        },
    },
    watch: {
        selectedAlarmTypes: {
            handler: function (newSelectedAlarmTypes) {
                const { data_sources: dataSources } = this.alarmsInfo.metadata
                for (const dataSource in dataSources) {
                    const alarmTypes = dataSources[dataSource].alarm_types
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
            deep: true
        },
        selectedDataSources: {
            handler: function (newSelectedDataSources) {
                const { data_sources: dataSources } = this.alarmsInfo.metadata

                for (const dataSource in dataSources) {
                    const alarmTypes = dataSources[dataSource].alarm_types
                    const isDataSourceSelected = newSelectedDataSources[dataSource]
                    if (isDataSourceSelected) {
                        const noSelectedEquivalentAlarmTypes = Object.keys(alarmTypes).every((alarmType) => this.selectedAlarmTypes[alarmType] !== true)
                        if (noSelectedEquivalentAlarmTypes) {
                            for (const alarmType in alarmTypes) {
                                this.$set(this.selectedAlarmTypes, alarmType, true);
                            }
                        }
                    } else {
                        for (const alarmType in alarmTypes) {
                            this.$set(this.selectedAlarmTypes, alarmType, false)
                        }
                    }
                }
            },
            deep: true
        },
        startTime: {
            handler: function () {
                console.log('called here inside startTime Watcher')
                this.dateTimeWatcher()
            },
            deep: true
        },
        endTime: {
            handler: function () {
                this.dateTimeWatcher()
            },
            deep: true
        }
    },
    data() {
        return {
            alarmTypesCategoryTitle: "Alarm Types:",
            dataSourcesCategoryTitle: "Data Sources:",
            selectedAlarmTypes: {},
            selectedDataSources: {},
            startDateTime: formatUTCTime(this.startTime),
            endDateTime: formatUTCTime(this.endTime),
            minStartDateTime: formatUTCTime(this.startTime),
            maxEndDateTime: formatUTCTime(this.endTime),
        };
    },
    created() {
        if (!this.loadingVal) {
            this.$set(this.selectedDataSources, 'ihr', true);
        }
    },
    methods: {
        dateTimeWatcher() {
            if (this.isStartTimeTheMax) {
                const alertMessage = 'Start Date cannot be greater than End Date'
                alert(alertMessage);
            }
            this.startDateTime = formatUTCTime(this.startTime)
            this.endDateTime = formatUTCTime(this.endTime)
        },

        filterAlarmsByTime(startDateTime, endDateTime) {
            const startDateUTCTime = `${startDateTime}:00Z`
            const endDateUTCTime = `${endDateTime}:00Z`
            const dateTimeFilter = { startDateTime: startDateUTCTime, endDateTime: endDateUTCTime };
            this.$emit('filter-alarms-by-time', dateTimeFilter);
        },

        resetTime() {
            this.startDateTime = formatUTCTime(this.startTime)
            this.endDateTime = formatUTCTime(this.endTime)
            this.filterAlarmsByTime(this.startDateTime, this.endDateTime)
            this.$emit('reset-time');
        },

        resetGranularity() {
            this.$emit('reset-granularity');
        },
    },
}
</script>

<style>
.container {
    background-color: #f2f2f2;
    border-radius: 10px;
    padding: 2px 20px 20px 20px;
    color: #283237;
}

.flex-container {
    display: flex;
}

.datetime-filter,
.reset-granularity {
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

.help {
    margin: 3px;
    position: relative;
    display: flex;
    align-items: center;
}

.help__button {
    background: linear-gradient(2deg, #1a5dae, #598dcc, #1a5dae, #598dcc);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    border: none;
    background-size: 100% 300%;
    transition: all .4s ease-in-out;
    position: relative;
    z-index: 10;
    box-shadow: inset 0 0.2rem 0.1rem hsla(0, 0%, 100%, .2), inset 0 0 0 0.1rem rgba(0, 0, 0, .15), 0 0.1rem 0 hsla(0, 0%, 100%, .15);
    border-radius: 3rem;
    font-size: 0.7rem;
    height: 0.8rem;
    width: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.help__text,
.help__title {
    padding: 0.2rem 0.5rem;
}

.help__title {
    background-color: #f7f7f7;
    text-align: left;
    border-bottom: 0.1rem solid #ebebeb;
    border-top-right-radius: 0.3rem;
    border-top-left-radius: 0.3rem;
}

.help__modal {
    position: absolute;
    z-index: 9999;
    background: #fff;
    border-radius: 0.3rem;
    box-shadow: 0 1px 2px #9f9d9d;
    flex-direction: column;
    width: 6rem;
    font-size: 0.6rem;
    color: #2c3e50;
    border: 0.1rem solid #b3b3b3;
    left: 3rem;
    top: 0;
}

.help__modal-content {
    position: relative;
    z-index: 10002;
}

.tooltip {
    position: absolute;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    font-size: 0.8rem;
}

.searchbar__heading-container {
    display: inline-flex;
    align-items: center;
    margin: 3px 3px 3px 3px;
}

.searchbar__heading-container label {
    margin-right: 10px;
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
