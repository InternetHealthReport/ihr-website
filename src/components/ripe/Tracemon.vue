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
      myID: `tracemon-widget-${this._uid}`
    };
  },
  mounted() {
    this.$libraryDelayer.load("tracemon_widget", () => {
      var msmid = [];
      var probeid = [];

      // Get the most prominent msm
      for(let msms in this.propbIds) {
        msmid.push(msms);
        probeid.push(...this.propbIds[msms]);
      }

      initTracemon(
        `#${this.myID}`,
        {
          dev: false,
          autoStart: true
        },
        {
          // mergedMeasurements: [lm_msmid],
          measurements: msmid,
          sources: probeid,
          maximumTracerouteValiditySeconds: 600,
          startTimestamp: this.utcTime.getTime() / 1000 - 2 * 3600,
          stopTimestamp: this.utcTime.getTime() / 1000 + 2 * 3600
        } // Query options, see table below for more info
      );
    });
  }
};
</script>
