<template>
  <div>
    <q-card v-if="loaded === false" negative>
      <q-card-section> {{ $t('genericErrors.cloudNotLoad') }} BGPlay </q-card-section>
    </q-card>
    <div v-if="loaded === null" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <div :id="myId"></div>
  </div>
</template>

<script>
export default {
  name: 'BgplayWidget',
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    intervalLength: {
      type: Number,
      default: 3600, //length of interval in seconds
    },
  },
  data() {
    return {
      myId: `bgplayContainer${this._uid}`,
      bgplay: null,
      loaded: null,
    }
  },
  mounted() {
    this.$libraryDelayer.load('bgplay_api', () => {
      console.log('resolved')
      this.bgplay = BGPlayWidget(
        'BGPlay', // Version type (classic)
        this.myId, // DOM element ID to populate
        {
          width: '100vw',
          height: 800,
        },
        {
          unix_timestamps: 'TRUE',
          ignoreReannouncements: 'true',
          resource: this.asName,
          starttime: this.startTime,
          endtime: this.endTime,
          rrcs: '10',
          type: 'bgp',
        }
      )
    })
  },
  watch: {
    asNumber(oldValue, newValue) {
      if (oldValue == newValue) return
      this.bgplay.shell.set_params({ resource: this.asName })
    },
    dateTime(oldValue, newValue) {
      if (oldValue == newValue) return
      this.bgplay.shell.set_params({
        starttime: this.startTime,
        endtime: this.endTime,
      })
    },
    intervalLength(oldValue, newValue) {
      if (oldValue == newValue) return
      this.bgplay.shell.set_params({
        starttime: this.startTime,
        endtime: this.endTime,
      })
    },
  },
  computed: {
    asName() {
      return `AS${this.asNumber}`
    },
    startTime() {
      return this.dateTime.getTime() / 1000 - this.intervalLength / 2
    },
    endTime() {
      return this.dateTime.getTime() / 1000 + this.intervalLength / 2
    },
  },
}
</script>

<style lang="stylus">
.IHR_
  &loading-spinner
    & > *
      width 25%
      height 25%
      display inline-block
      margin auto
</style>
