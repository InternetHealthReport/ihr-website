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
      var msmdict = this.propbIds;

      // Make latencymon groups
      var msms = Object.entries(msmdict);
      for (var i = 0; i < msms.length; i++) {
        lm_grp.push({
          id: msms[i][0].toString(),
          measurementId: msms[i][0],
          probes: msms[i][1],
          type: "multi-probes"
        });
      }
      try {
        initLatencymon(
          `#${this.myID}`,
          {
            dev: false,
            autoStart: true
          }, // Tool options, see table below for more info
          {
            measurements: Object.keys(msmdict),
            startTimestamp: timebin.getTime() / 1000 - 5 * 3600,
            stopTimestamp: timebin.getTime() / 1000 + 5 * 3600,
            groups: lm_grp
          } // Query options, see table below for more info
        );
      } catch (err) {
        console.error(err); //TODO better error handling
      }
    });
  }
};
</script>

<style>
</style>
