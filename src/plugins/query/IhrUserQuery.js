import { QueryBase } from './IhrQuery'
const _NOTIFY_LEVEL = {
  LOW: 0,
  MODERATE: 5,
  HIGH: 10,
  toString(notifyLevel) {
    if (notifyLevel > MonitoringUserQuery.NOTIFY_LEVEL.MODERATE) {
      return 'high'
    }
    if (notifyLevel > MonitoringUserQuery.NOTIFY_LEVEL.LOW) {
      return 'moderate'
    }
    return 'low'
  },
  toColor(notifyLevel) {
    if (notifyLevel >= MonitoringUserQuery.NOTIFY_LEVEL.HIGH) {
      return 'negative'
    }
    if (notifyLevel >= MonitoringUserQuery.NOTIFY_LEVEL.MODERATE) {
      return 'warning'
    }
    if (notifyLevel >= MonitoringUserQuery.NOTIFY_LEVEL.LOW) {
      return 'info'
    }
  },
}

class MonitoringUserQuery extends QueryBase {
  constructor(monitoredAsn) {
    super()
    this.modified = false
    if (monitoredAsn === undefined) {
      this.shortCut = {}
      this.monitoredAsn = []
      this.savedMonitored = []
      return
    }
    this.set(monitoredAsn)
  }

  static get FILTER_TYPE() {
    return MonitoringUserQuery.name
  }

  static get ENTRY_POINT() {
    return 'user/add_monitoring/'
  }

  static get HTTP_METHOD() {
    return 'post'
  }

  static get NOTIFY_LEVEL() {
    return _NOTIFY_LEVEL
  }

  set(monitoredAsn) {
    this.savedMonitored = monitoredAsn //save to simplify restore
    this.restore()
  }

  push(asn, level) {
    this.modified = true
    if (this.shortCut[asn.number] === undefined) {
      let entry = {
        asnumber: asn.number,
        asname: asn.name,
        notifylevel: level,
      }
      this.monitoredAsn.push(entry)
      this.shortCut[asn.number] = {
        entry: entry,
        position: this.monitoredAsn.length - 1,
      }
      return
    }
    this.shortCut[asn.number].entry.notifylevel = level
  }

  setGlobalLevel(level) {
    this.modified = true
    this.monitoredAsn.forEach(elem => {
      elem.notifylevel = level
    })
  }

  remove(asNumber) {
    this.modified = true
    if (this.shortCut[asNumber] === undefined) {
      return
    }
    this.monitoredAsn.splice(this.shortCut[asNumber].position, 1)
    delete this.shortCut[asNumber]
  }

  restore() {
    this.modified = false
    this.shortCut = {}
    this.monitoredAsn = JSON.parse(JSON.stringify(this.savedMonitored))
    this.monitoredAsn.forEach((elem, index) => {
      this.shortCut[elem.asnumber] = {
        entry: elem,
        position: index,
      }
    })
  }

  verifyModified() {
    this.modified =
      this.monitoredAsn.length != this.savedMonitored.length ||
      this.savedMonitored.some(savedElem => {
        let elem = this.shortCut[savedElem.asnumber]
        return elem == undefined || elem.entry.notifylevel != savedElem.notifylevel
      })
    return this.modified
  }

  get_filter() {
    return {
      monitoredasn: this.monitoredAsn,
    }
  }
}

export { MonitoringUserQuery }
