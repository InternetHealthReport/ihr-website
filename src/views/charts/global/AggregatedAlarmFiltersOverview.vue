<template>
    <div class="container">
        <div class="alarm-types">
            <h3 class="filter__category-title">Alarm Types:</h3>
            <label v-for="(alarm, index) in alarmTypes" :key="index">
                <div class="searchbar__heading-container">
                    <input type="checkbox" :name="alarm.value" :value="alarm.value"
                        v-model="selectedAlarmTypes[alarm.value]">
                    <span class="label__input">{{ alarm.label }}</span>
                    <div class="help">
                        <button class="help__button" @click="toggleHelpModal(index, alarmTypes)">?</button>
                        <div class="help__modal" v-show="alarm.showModal">
                            <div class="help__modal-content">
                                <div class="help__title">{{ alarmTypes[index].content.title }}</div>
                                <div class="help__text">{{ alarmTypes[index].content.description }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </label>
            <div class="button-container">
                <button class="select-all-btn" type="button" @click="selectAllAlarmTypes">Select All</button>
                <button class="unselect-all-btn" type="button" @click="unselectAllAlarmTypes">Unselect All</button>
            </div>

        </div>

        <div class="data-sources">
            <h3 class="filter__category-title">Data Sources:</h3>
            <label v-for="(dataSource, index) in dataSources" :key="index">
                <div class="searchbar__heading-container">
                    <input type="checkbox" :name="dataSource.value" :value="dataSource.value"
                        v-model="selectedDataSources[dataSource.value]">
                    <span class="label__input">{{ dataSource.label }}</span>
                    <div class="help">
                        <button class="help__button" @click="toggleHelpModal(index, dataSources)">?</button>
                        <div class="help__modal" v-show="dataSource.showModal">
                            <div class="help__modal-content">
                                <div class="help__title">{{ dataSources[index].content.title }}</div>
                                <div class="help__text">{{ dataSources[index].content.description }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </label>
            <div class="button-container">
                <button class="select-all-btn" type="button" @click="selectAllDataSources">Select All</button>
                <button class="unselect-all-btn" type="button" @click="unselectAllDataSources">Unselect All</button>
            </div>

        </div>

        <div class="flex-container">
            <div class="datetime-filter">
                <h3 class="filter__category-title">Date Time Filter:</h3>
                <div class="datetime-picker">
                    <label for="start-datetime">Start DateTime:</label>
                    <input type="datetime-local" id="start-datetime" v-model="startDateTime" :min="minStartDateTime"
                        :max="maxEndDateTime">
                </div>
                <div class="datetime-picker">
                    <label for="end-datetime">End DateTime:</label>
                    <input type="datetime-local" id="end-datetime" v-model="endDateTime" :min="minStartDateTime"
                        :max="maxEndDateTime">
                </div>
                <button @click="filterAlarmsByTime" id="apply-btn" type="button">Apply</button>
                <button @click="resetTime" id="reset-time-btn" type="button">Reset Time</button>
            </div>

            <div class="reset-granularity">
                <h3 class="filter__category-title">Reset Granularity:</h3>
                <button @click="resetGranularity" id="reset-granularity-btn" type="button">Reset Granularity</button>
            </div>
        </div>



    </div>
</template>

<script>
export default {
    props: {
        alarms: {
            type: Array,
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
    },
    data() {
        return {
            alarmTypes: [
                { value: "hegemony", label: "Hegemony", showModal: false, content: { title: 'Hegemony', description: 'Hegemony Alarm Type' } },
                { value: "network_delay", label: "Network Delay", showModal: false, content: { title: 'Network Delay', description: 'Network Delay Alarm Type' } },
                { value: "moas", label: "MOAS", showModal: false, content: { title: 'Moas', description: 'Moas Alarm Type' } },
                { value: "submoas", label: "SubMOAS", showModal: false, content: { title: 'Submoas', description: 'Submoas Alarm Type' } },
                { value: "defcon", label: "Defcon", showModal: false, content: { title: 'Defcon', description: 'Defcon Alarm Type' } },
                { value: "edges", label: "Edges", showModal: false, content: { title: 'Edges', description: 'Edges Alarm Type' } },
            ],
            dataSources: [
                { value: "ihr", label: "IHR", showModal: false, content: { title: 'IHR', description: 'IHR Data Source' } },
                { value: "grip", label: "GRIP", showModal: false, content: { title: 'GRIP', description: 'GRIP Data Source' } },
                { value: "ioda", label: "IODA", showModal: false, content: { title: 'IODA', description: 'IODA Data Source' } },
            ],
            selectedAlarmTypes: {},
            selectedDataSources: {},
            startDateTime: this.formatTime(this.startTime),
            endDateTime: this.formatTime(this.endTime),
            minStartDateTime: this.formatTime(this.startTime),
            maxEndDateTime: this.formatTime(this.endTime),
        }
    },
    created() {
        this.$set(this.selectedDataSources, 'ihr', true);
    },
    watch: {
        selectedAlarmTypes: {
            handler: function (newSelectedAlarmTypes) {
                if (!newSelectedAlarmTypes.hegemony && !newSelectedAlarmTypes.network_delay) {
                    this.$set(this.selectedDataSources, 'ihr', false);
                } else {
                    this.$set(this.selectedDataSources, 'ihr', true);
                }

                if (!newSelectedAlarmTypes.moas && !newSelectedAlarmTypes.submoas && !newSelectedAlarmTypes.defcon && !newSelectedAlarmTypes.edges) {
                    this.$set(this.selectedDataSources, 'grip', false);
                } else {
                    this.$set(this.selectedDataSources, 'grip', true);
                }
                this.$emit('filter-alarms-by-alarm-types', newSelectedAlarmTypes)
            },
            deep: true
        },
        selectedDataSources: {
            handler: function (newSelectedDataSources) {
                if (newSelectedDataSources.ihr) {
                    if (!this.selectedAlarmTypes.hegemony && !this.selectedAlarmTypes.network_delay) {
                        this.$set(this.selectedAlarmTypes, 'hegemony', true);
                        this.$set(this.selectedAlarmTypes, 'network_delay', true);
                    }
                } else {
                    this.$set(this.selectedAlarmTypes, 'hegemony', false);
                    this.$set(this.selectedAlarmTypes, 'network_delay', false);
                }

                if (newSelectedDataSources.grip) {
                    if (!this.selectedAlarmTypes.moas && !this.selectedAlarmTypes.submoas && !this.selectedAlarmTypes.defcon && !this.selectedAlarmTypes.edges) {
                        this.$set(this.selectedAlarmTypes, 'moas', true);
                        this.$set(this.selectedAlarmTypes, 'submoas', true);
                        this.$set(this.selectedAlarmTypes, 'defcon', true);
                        this.$set(this.selectedAlarmTypes, 'edges', true);
                    }
                } else {
                    this.$set(this.selectedAlarmTypes, 'moas', false);
                    this.$set(this.selectedAlarmTypes, 'submoas', false);
                    this.$set(this.selectedAlarmTypes, 'defcon', false);
                    this.$set(this.selectedAlarmTypes, 'edges', false);
                }
                this.$emit('filter-alarms-by-data-sources', newSelectedDataSources);
            },
            deep: true
        },
    },
    methods: {
        toggleHelpModal(index, helpModals) {
            this.unToggleOtherActiveHelpModals(helpModals, helpModals[index]);
            helpModals[index].showModal = !helpModals[index].showModal;
        },

        unToggleOtherActiveHelpModals(helpModals, onlyActiveHelpModal) {
            helpModals.forEach(helpModal => {
                if (helpModal.showModal && helpModal != onlyActiveHelpModal) {
                    helpModal.showModal = false;
                }
            });
        },

        formatTime(date) {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            return formattedDate;
        },

        filterAlarmsByTime() {
            if (this.alarms && this.alarms.length && this.startDateTime && this.endDateTime) {
                let startDateTime = new Date(this.startDateTime);
                let endDateTime = new Date(this.endDateTime);
                if (startDateTime > endDateTime) {
                    alert('Start Date cannot be greater than End Date')
                    return
                }
                const formattedStartDateTime = startDateTime.toISOString().slice(0, 16);
                const formattedEndDateTime = endDateTime.toISOString().slice(0, 16);
                startDateTime = new Date(formattedStartDateTime);
                endDateTime = new Date(formattedEndDateTime);
                const dateTimeFilter = { startDateTime, endDateTime };
                this.$emit('filter-alarms-by-time', dateTimeFilter);
            }
        },

        resetTime() {
            this.$emit('reset-time');
        },

        resetGranularity() {
            this.$emit('reset-granularity');
        },

        selectAllAlarmTypes() {
            for (const alarmType of this.alarmTypes) {
                this.$set(this.selectedAlarmTypes, alarmType.value, true);
            }
        },

        unselectAllAlarmTypes() {
            for (const alarmType of this.alarmTypes) {
                this.$set(this.selectedAlarmTypes, alarmType.value, false);
            }
        },

        selectAllDataSources() {
            for (const dataSource of this.dataSources) {
                this.$set(this.selectedDataSources, dataSource.value, true);
            }

        },

        unselectAllDataSources() {
            for (const dataSource of this.dataSources) {
                this.$set(this.selectedDataSources, dataSource.value, false);
            }
        }

    }
}
</script>

<style scoped>
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

.alarm-types,
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

.select-all,
.unselect-all {
    margin-top: 10px;
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
.unselect-all-btn {
    margin: 3px;
}

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
