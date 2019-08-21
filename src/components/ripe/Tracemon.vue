<template>
  <div :id="myId"></div>
</template>
<script>
const MESUREMENTS = [5030];
const BOUNDARY_OFFSET = 1800; // half an hour

export default {
  props: {
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    probs: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      myId: `tracemonWidget${this._uid}`
    };
  },
  mounted() {
    this.$libraryDelayer.load("tracemon_widget", () => {
      initTracemon(
        `#${this.myId}`,
        {
          dev: false,
          autoStart: true
        },
        {
          // mergedMeasurements: [lm_msmid],
          measurements: MESUREMENTS,
          sources: this.probs,
          maximumTracerouteValiditySeconds: 600,
          startTimestamp: this.startTime.getTime() / 1000 - BOUNDARY_OFFSET,
          stopTimestamp: this.endTime.getTime() / 1000 + BOUNDARY_OFFSET
        } // Query options, see table below for more info
      );
    });
  }
};
</script>
