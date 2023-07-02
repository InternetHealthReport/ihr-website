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
                        <button class="help__button" @click="toggleHelpModal(index)">?</button>
                        <div class="help__modal" v-show="alarm.showModal">
                            <div class="help__modal-content">
                                <div class="help__title">Search</div>
                                <div class="help__text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. In aliquet
                                    ligula ultricies libero imperdiet, at pharetra mi molestie. Fusce mollis ut mauris non
                                    pretium. Integer varius tellus id metus bibendum.
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
                        <button class="help__button" @click="toggleHelpModal(index)">?</button>
                        <div class="help__modal" v-show="dataSource.showModal">
                            <div class="help__modal-content">
                                <div class="help__title">Search</div>
                                <div class="help__text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. In aliquet
                                    ligula ultricies libero imperdiet, at pharetra mi molestie. Fusce mollis ut mauris non
                                    pretium. Integer varius tellus id metus bibendum.
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
                { value: "hegemony", label: "Hegemony", showModal: false },
                { value: "network_delay", label: "Network Delay", showModal: false },
                { value: "moas", label: "MOAS", showModal: false },
                { value: "submoas", label: "SubMOAS", showModal: false },
                { value: "defcon", label: "Defcon", showModal: false },
                { value: "edges", label: "Edges", showModal: false },
            ],
            dataSources: [
                { value: "grip", label: "GRIP", showModal: false },
                { value: "source2", label: "Data Source 2", showModal: false },
                { value: "source3", label: "Data Source 3", showModal: false },
                { value: "source4", label: "Data Source 4", showModal: false },
                { value: "source5", label: "Data Source 5", showModal: false },
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
        this.alarmTypes.forEach((alarm) => {
            this.$set(this.selectedAlarmTypes, alarm.value, false);
        });

        this.dataSources.forEach((dataSource) => {
            this.$set(this.selectedDataSources, dataSource.value, false);
        });
    },
    watch: {
        selectedAlarmTypes: {
            handler: function (newSelectedAlarmTypes) {
                this.$emit('filter-alarms-by-alarm-types', newSelectedAlarmTypes);
            },
            deep: true,
        },
        selectedDataSources: {
            handler: function (newSelectedDataSources) {
                let includeCheckedDataSources = Object.values(newSelectedDataSources).includes(true);
                if (includeCheckedDataSources) {
                    this.$emit('filter-alarms-by-data-sources', newSelectedDataSources);
                }
            },
            deep: true,
        }
    },
    methods: {
        toggleHelpModal(index) {
            this.alarmTypes[index].showModal = !this.alarmTypes[index].showModal;
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
    padding: 0.5rem 1.5rem;
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
    width: 16rem;
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
    padding: px;
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
