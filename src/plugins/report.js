import { ref, computed } from 'vue'
import { PROJECT_START_DATE } from './IhrApi'

class DateInterval {
  constructor(begin, end) {
    this.begin = this.createDateAsUTC(begin)
    this.end = this.createDateAsUTC(end)
  }

  dayDiff() {
    return Math.ceil((this.end - this.begin) / 1000 / 60 / 60 / 24)
  }

  createDateAsUTC(date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59))
  }

  setHours() {
    this.begin.setUTCHours(0, 0, 0, 0)
    this.end.setUTCHours(23, 59, 59, 0)
    return this
  }
}

export default function report(defaultTimeRange=null) {
  const defaultTimeRangeVal = computed(() => {
    return defaultTimeRange ? defaultTimeRange : 3
  })

  const getDateInterval = (dateObj, nDays) => {
    const end = new Date(dateObj)
    const begin = new Date(end.getTime())
    begin.setUTCDate(begin.getUTCDate() - nDays)
    if (isNaN(begin.getTime()) || isNaN(end.getTime()))
      throw RangeError("invalid start or end")
    const newInterval = new DateInterval(begin, end)
    // newInterval.setHours()
    return newInterval
  }

  const interval = ref(getDateInterval(new Date(), defaultTimeRangeVal.value))

  let fetch = ref(false)

  const minDate = computed(() => {
    return PROJECT_START_DATE
  })

  const maxDate = computed(() => {
    return new Date()
  })

  const reportDateFmt = computed(() => {
    var options = {
      year: "numeric",
      month: "long",
      day: "2-digit",
      timeZone: "UTC",
    }
    return interval.value.end.toLocaleDateString(undefined, options)
  })
  
  const startTime = computed(() => {
    return interval.value.begin
  })

  const endTime = computed(() => {
    return interval.value.end
  })

  const setReportDate = (event) => {
    interval.value = getDateInterval(event, defaultTimeRangeVal.value)
  }

  const utcString = (date) => {
    return date.toISOString()
  }

  return {
    interval,
    fetch,
    minDate,
    maxDate,
    reportDateFmt,
    startTime,
    endTime,
    defaultTimeRangeVal,
    setReportDate,
    getDateInterval,
    utcString
  }
}