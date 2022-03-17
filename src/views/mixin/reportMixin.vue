<script>
class DateInterval {
  constructor(begin, end) {
    this.begin = this.createDateAsUTC(begin)
    this.end = this.createDateAsUTC(end)
  }

  dayDiff() {
    return Math.ceil((this.end - this.begin) / 1000 / 60 / 60 / 24)
  }

  createDateAsUTC(date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()))
  }

  setHours() {
    this.begin.setUTCHours(0, 0, 0, 0)
    this.end.setUTCHours(23, 59, 59, 0)
    return this
  }
}

import { PROJECT_START_DATE } from '@/plugins/IhrApi'

export default {
  props: {
    showSidebar: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    let interval
    try {
      interval = this.getDateInterval(this.$route.query.date + 'T00:00+00:00', this.$route.query.last)
    } catch (e) {
      if (!(e instanceof RangeError)) {
        console.log('Range Error')
      }
      interval = this.getDateInterval(new Date(), 3) // fallback to last few days
    }
    return {
      interval: interval,
      fetch: false,
    }
  },
  mounted() {
    this.pushRoute()
  },
  methods: {
    setReportDate(event) {
      this.interval = this.getDateInterval(event, 3)
    },
    resizeCharts() {
      setTimeout(() => {
        this.charRefs.forEach(chart => {
          this.$refs[chart].relayout()
        })
      }, 400)
    },
    getDateInterval(endTimestamp, nDays) {
      let end = new Date(endTimestamp)
      let begin = new Date(end)
      begin.setUTCDate(begin.getUTCDate() - (nDays - 1))
      if (isNaN(begin.getTime()) || isNaN(end.getTime())) throw RangeError('invalid start or end')

      let newInterval = new DateInterval(begin, end)
      newInterval.setHours()
      return newInterval
    },
    updateQuery(values) {
      this.$router.replace({ query: Object.assign({}, this.$route.query, values) })
    },
  },
  computed: {
    minDate() {
      return PROJECT_START_DATE
    },
    maxDate() {
      return new Date()
    },
    reportDateFmt() {
      var options = {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        timeZone: 'UTC',
      }
      return this.interval.end.toLocaleDateString(undefined, options)
    },
    startTime() {
      return this.interval.begin
    },
    endTime() {
      return this.interval.end
    },
  },
  watch: {
    interval() {
      this.pushRoute()
    },
  },
}
</script>
<style lang="stylus">
@import '../../styles/quasar.variables';
.IHR_
  &last-element
    margin-bottom 80px

  &charts-title
    text-transform capitalize
    font-size 18pt

  &charts-body
    margin-right 10pt
    margin-left 5pt
    margin-top 10pt

  &char-container
    width 90%
    margin 0 auto
</style>
