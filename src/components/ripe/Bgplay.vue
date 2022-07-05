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
import { setTimeout } from 'timers'
export default {
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
        this.$libraryDelayer.load('ripe_widget_api', () => {
            console.log('resolved')
            this.bgplay = ripestat.init(
                'bgplay',
                {
                    unix_timestamps: 'TRUE',
                    ignoreReannouncements: 'true',
                    resource: this.asName,
                    starttime: this.startTime,
                    endtime: this.endTime,
                    rrcs: '10',
                    type: 'bgp',
                },
                this.myId,
                {
                    size: 'fit',
                    show_controls: 'no',
                    disable: ['footer-buttons', 'container'],
                },
                () => {
                    this.loaded = true
                    setTimeout(() => {
                        var elemt = document.getElementById(this.myId)
                        elemt.style.width = '100%'
                    }, 150)
                }
            )
        })
    },
    watch: {
        asNumber(oldValue, newValue) {
            if (oldValue == newValue) return
            this.bgplay.update({ resource: this.asName })
            this.bgplay.reload()
        },
        dateTime(oldValue, newValue) {
            if (oldValue == newValue) return
            this.bgplay.update({
                starttime: this.startTime,
                endtime: this.endTime,
            })
            this.bgplay.reload()
        },
        intervalLength(oldValue, newValue) {
            if (oldValue == newValue) return
            this.bgplay.update({
                starttime: this.startTime,
                endtime: this.endTime,
            })
            this.bgplay.reload()
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
