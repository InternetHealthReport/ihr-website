<template>
  <div :id="myId"></div>
</template>
<script>
export default {
  props: {
    startTime: {
      type: Date,
      required: true
    },
    stopTime: {
      type: Date,
      required: true
    },
    propbIds: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      myId: `latencymonWidget${this._uid}`
    };
  },
  mounted() {
    this.$libraryDelayer.load("latencymon_widget", () => {
      let lm_grp = [];

      // Make latencymon groups
      for(let msms in this.propbIds) {
        lm_grp.push({
          id: msms.toString(),
          measurementId: msms,
          probes: this.propbIds[msms],
          type: "multi-probes"
        });
      }

      try {
        //see https://atlas.ripe.net/docs/tools-latencymon/ for more options and details
        initLatencymon(
          `#${this.myId}`,
          {
            dev: false,
            autoStart: true
          },
          {
            measurements: Object.keys(this.propbIds),
            startTimestamp: this.startTimestamp.getTime(),
            stopTimestamp: this.stopTime.getTime(),
            groups: lm_grp
          }
        );
      } catch (err) {
        console.error(err); //TODO better error handling
      }
    });
  }
};
</script>

<style lang="stylus">
@import '~quasar-variables'
  .probe-multi-info
    & > .probe-info-line:nth-child(2)
      & > .probe-listed
        color $accent
        white-space normal
</style>
