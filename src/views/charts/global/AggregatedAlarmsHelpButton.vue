<template>
    <div class="help">
        <button class="help__button" @click="toggleHelpModal(dataSource, alarmType, alarmsMetadata.data_sources)">?</button>
        <div class="help__modal" v-show="showHelpModal">
            <div class="help__modal-content">
                <div class="help__title">{{ title }}</div>
                <div class="help__text">{{ description }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'

export default {
  props: {
    dataSource: {
      type: String,
      required: true
    },
    alarmType: {
      type: String,
      required: false
    },
    alarmsMetadata: {
      type: Object,
      required: true
    },
    dataSourceAlarmTypes: {
      type: Object,
      required: true
    },
  },
  data(){
    return {
      alarmsMetadataCopied: AggregatedAlarmsUtils.deepCopy(this.alarmsMetadata)
    }
  },
  computed: {
    showHelpModal() {
      if (this.alarmType) {
        return this.alarmsMetadataCopied.data_sources[this.dataSource].alarm_types[this.alarmType].showHelpModal;
      } else {
        return this.alarmsMetadataCopied.data_sources[this.dataSource].showHelpModal;
      }
    },
    title() {
      return this.alarmType ? this.alarmsMetadataCopied.data_sources[this.dataSource].alarm_types[this.alarmType].title : this.alarmsMetadataCopied.data_sources[this.dataSource].title;
    },
    description() {
      return this.alarmType ? this.alarmsMetadataCopied.data_sources[this.dataSource].alarm_types[this.alarmType].description : this.alarmsMetadataCopied.data_sources[this.dataSource].description;
    },
  },
  methods: {
    toggleHelpModal(dataSource, alarmType, alarmDataSourcesMetadata) {
      this.unToggleActiveHelpModals(dataSource, alarmType, alarmDataSourcesMetadata)
      this.toggleHelpModalHelper(dataSource, alarmType)
    },

    unToggleActiveHelpModals(dataSourceSelected, alarmTypeSelected, dataSourcesAlarmsMetadata) {
      for (const dataSourceKey in dataSourcesAlarmsMetadata) {
        if (dataSourceSelected !== dataSourceKey) {
          dataSourcesAlarmsMetadata[dataSourceKey].showHelpModal = false
        }
        const alarmTypes = dataSourcesAlarmsMetadata[dataSourceKey].alarm_types
        for (const alarmType in alarmTypes) {
          if (alarmTypeSelected !== alarmType) {
            alarmTypes[alarmType].showHelpModal = false
          }
        }
      }
    },

    toggleHelpModalHelper(dataSource, alarmType) {
      if (alarmType) {
        this.alarmsMetadataCopied.data_sources[dataSource].alarm_types[alarmType].showHelpModal = !this.alarmsMetadataCopied.data_sources[dataSource].alarm_types[alarmType].showHelpModal
      } else {
        this.alarmsMetadataCopied.data_sources[dataSource].showHelpModal = !this.alarmsMetadataCopied.data_sources[dataSource].showHelpModal;
      }
    },
  },
};
</script>

<style scoped>
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
    width: 8rem;
    font-size: 0.6rem;
    color: #2c3e50;
    border: 0.1rem solid #b3b3b3;
    left: 1.5rem;
    top: 0;
}

.help__modal-content {
    position: relative;
    z-index: 10002;
}

label {
    display: inline-block;
}
</style>
