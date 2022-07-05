<template>
    <div :id="myId"></div>
</template>
<script>
const MESUREMENTS = [5014]
const BOUNDARY_OFFSET = 1800 // half an hour

export default {
    props: {
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        probeIds: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            myId: `tracemonWidget${this._uid}`,
        }
    },
    mounted() {
        console.log('tracemon mounted')
        console.log(this.probeIds)
        console.log(this.startTime)
        console.log(this.endTime)
        this.$libraryDelayer.load('tracemon_widget', () => {
            initTracemon(
                `#${this.myId}`,
                {
                    //dev: false,
                    //autoStart: true,
                    //view: "host",
                    //aggregateIPv4: false,
                    //onlyCore: false,
                    //realTimeUpdate: false
                },
                {
                    // mergedMeasurements: this.probeIds,
                    measurements: [5014],
                    //sources: [20561, 30218, 16130],
                    //maximumTracerouteValiditySeconds: 600,
                    //startTimestamp: this.startTime.getTime() / 1000 - BOUNDARY_OFFSET,
                    //stopTimestamp: this.endTime.getTime() / 1000 + BOUNDARY_OFFSET
                } // Query options, see table below for more info
            )
        })
    },
}
</script>
