class DateInterval {
  constructor(begin, end) {
    this.begin = new Date(begin)
    this.end = new Date(end)

    this.begin.setUTCHours(0, 0, 0, 0)
    this.end.setUTCHours(23, 59, 59, 999)
  }

  dayDiff() {
    return Math.round((this.end.getTime() - this.begin.getTime()) / (1000 * 60 * 60 * 24))
  }
}

export default function report(defaultTimeRange = 3, defaultEndTime = new Date()) {
  const getDateInterval = (dateObj, nDays) => {
    const date = new Date(dateObj)

    if (Number.isNaN(date.getTime())) {
      throw new RangeError('Invalid date')
    }

    const end = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

    const begin = new Date(end)

    begin.setUTCDate(begin.getUTCDate() - (nDays - 1))

    return new DateInterval(begin, end)
  }

  let interval = getDateInterval(defaultEndTime, defaultTimeRange)

  return {
    get interval() {
      return interval
    },

    get startTime() {
      return interval.begin
    },

    get endTime() {
      return interval.end
    }
  }
}
