<template>
    <div class="IHR_nowrap" :id="myId"></div>
</template>
<script>
export default {
    props: {
        startTime: {
            type: Date,
            required: true,
        },
        stopTime: {
            type: Date,
            required: true,
        },
        msmPrbIds: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            myId: `latencymonWidget${this._uid}`,
            startTimestamp: this.getTimestamp(this.startTime),
            stopTimestamp: this.getTimestamp(this.stopTime),
            lm: null,
        }
    },
    created() {},
    mounted() {
        this.$libraryDelayer.load('latencymon_widget', () => {
            let lm_grp = []

            // Make latencymon groups
            for (let msms in this.msmPrbIds) {
                lm_grp.push({
                    id: this.targetName(msms),
                    measurementId: Number(msms),
                    probes: this.msmPrbIds[msms],
                    type: 'multi-probes',
                })
            }

            var lm = null
            try {
                //see https://atlas.ripe.net/docs/tools-latencymon/ for more options and details
                this.lm = initLatencymon(
                    `#${this.myId}`,
                    {
                        autoStartGrouping: false,
                    },
                    {
                        measurements: Object.keys(this.msmPrbIds), //measurements: [1030, 1031],
                        startTimestamp: this.startTimestamp, //startTimestamp: 1580422400,
                        stopTimestamp: this.stopTimestamp, // stopTimestamp:  1580508800,
                        syncWithRealTimeData: false,
                        groups: lm_grp,
                    }
                )
            } catch (err) {
                console.error(err) //TODO better error handling
            }
        })
    },
    methods: {
        getTimestamp(datetime) {
            return Math.ceil(datetime.getTime() / 1000)
        },
        targetName(msmid) {
            const names = {
                1001: 'K-root servers',
                1006: 'M-root servers',
                1010: 'B-root servers',
                1030: 'Atlas Controller',
                1591146: 'Google DNS',
            }

            if (msmid in names) {
                return names[msmid]
            } else {
                return msmid.toString()
            }
        },
    },
}
</script>

<style lang="stylus">

.latencymon-container .probe-multi-info .probe-info-line
    white-space normal!important;
    margin-top 10px!important;

.IHR_nowrap
    white-space normal !important;
</style>
