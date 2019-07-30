<template>
  <div :id="myID"></div>
</template>
<script>
export default {
  props: {
    utcTime: {
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
      myID: `latencymon-widget-${this._uid}`
    };
  },
  mounted() {
    this.$libraryDelayer.load("latencymon_widget", () => {
      var lm_grp = [];
      var lm_msmid = [];
      var timebin = this.utcTime;

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
          `#${this.myID}`,
          {
            dev: false,
            autoStart: true
          },
          {
            measurements: Object.keys(this.propbIds),
            startTimestamp: timebin.getTime() / 1000 - 5 * 3600,
            stopTimestamp: timebin.getTime() / 1000 + 5 * 3600,
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
