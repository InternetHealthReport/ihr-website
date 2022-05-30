/** \file IhrQuery.js
 *   \brief Class helpers to query IHR api.
 */

// convenience constant for readability
const _NO_FILTER = {}
const _ORDER_ASC = ''
const _ORDER_DESC = '-'
const _LTE = '__lte'
const _GTE = '__gte'
const _EXACT = ''
const _CONTAINS = '__icontains'
const _STRING_SEPARATOR = '|'
const _DEFAULT_SEPARATOR = ','
const AS_FAMILY = {
  v4: 4,
  v6: 6,
}
const _NETWORK_DELAY_EDGE_TYPE = {
  AS: 'AS',
  CITY: 'CT',
  IP: 'IP',
  IXP: 'IX',
  PB: 'PB',
  LM: 'LM',
}

// exceptions
class MustBeImplemented extends SyntaxError {
  constructor(functionName) {
    super(`${functionName} MUST Be Implemented!`)
  }
}

class QueryBase {
  /**
   * Every query class must inherit this base class
   * @param {Boolean} auto_resolve_pagination if this flag is set the callback
   *  for this query will be called subsequently for each page
   */
  constructor() {
    this._resolve_pagination = false
  }

  get resolvePagination() {
    return this._resolve_pagination
  }

  setAutoResolvePagination() {
    this._resolve_pagination = true
    return this
  }

  unSetAutoResolvePagination() {
    this._resolve_pagination = false
    return this
  }

  // static members
  static get FILTER_TYPE() {
    throw MustBeImplemented('QueryBase.FILTER_TYPE')
  }

  static get ENTRY_POINT() {
    throw MustBeImplemented('QueryBase.FILTER_TYPE')
  }

  get_filter() {
    throw MustBeImplemented('QueryBase.get_filter')
  }

  _clone() {
    return Object.assign({}, this.filter)
  }

  //public functions

  //merged filter has the priority
  merge(filter) {
    this.filter = { ...this.filter, ...filter }
    return this
  }

  reset() {
    this.filter = {}
    return this
  }

  toString() {
    return this.constructor.FILTER_TYPE + ': ' + JSON.stringify(this.filter)
  }

  toUrl() {
    let str = []
    for (let param in this.filter) str.push(`${encodeURIComponent(param)}=${encodeURIComponent(this.filter[param])}`)
    return `${this.constructor.ENTRY_POINT}?${str.join('&')}`
  }

  clone() {
    throw new MustBeImplemented('clone')
  }
}

/** @brief all allowed filters in ihr-api
 */
class Query extends QueryBase {
  constructor(dictionary = {}) {
    super()
    this.filter = dictionary
  }

  // static members
  static get FILTER_TYPE() {
    return 'Generic'
  }

  static get ENTRY_POINT() {
    return ''
  }

  static get HTTP_METHOD() {
    return 'get'
  }

  static get NO_FILTER() {
    return _NO_FILTER
  }

  static get ASC() {
    return _ORDER_ASC
  }

  static get DESC() {
    return _ORDER_DESC
  }

  static get LTE() {
    return _LTE
  }

  static get GTE() {
    return _GTE
  }

  static get EXACT() {
    return _EXACT
  }

  static get CONTAINS() {
    return _CONTAINS
  }

  static dateFormatter(date) {
    return date == undefined ? date : date.toISOString()
  }

  //private functions
  _set(name, value, comparator = Query.EXACT, separator = _DEFAULT_SEPARATOR) {
    if (value == undefined) {
      delete this.filter[name + comparator]
      return this
    }
    //if it's an array is exact by default
    if (value instanceof Array) {
      if (value.length > 0) {
        this.filter[name] = value.join(separator)
      }
      return this
    }
    this.filter[name + comparator] = value
    return this
  }

  _setInterval(name, lowerBound, upperBound) {
    return this._set(name, lowerBound, Query.GTE)._set(name, upperBound, Query.GTE)
  }

  _setOrder(name, order = Query.ASC) {
    return order == null ? this._set('ordering') : this._set('ordering', order + name)
  }

  get_filter() {
    return this.filter
  }
}

class CountryQuery extends Query {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return CountryQuery.name
  }

  static get ENTRY_POINT() {
    return 'countries/'
  }

  //methods

  containsName(name) {
    return this._set('name', name)
  }

  code(cc) {
    return this._set('code', cc)
  }

  orderedByCode(order = Query.ASC) {
    return this._setOrder('code', order)
  }

  clone() {
    return new CountryQuery(this._clone())
  }
}

class NetworkQuery extends Query {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return NetworkQuery.name
  }

  static get ENTRY_POINT() {
    return 'networks/'
  }

  //methods

  containsName(name) {
    return this._set('name', name)
  }

  asNumber(asn) {
    return this._set('number', asn)
  }

  /**
   * @brief it match asn or name, but ignore the the AS and IX prefix (see API docs)
   *
   * @param {*} search the string to search
   */
  mixedContentSearch(search) {
    return this._set('search', search)
  }

  orderedByNumber(order = Query.ASC) {
    return this._setOrder('number', order)
  }

  clone() {
    return new NetworkQuery(this._clone())
  }
}

/** Placeholder class to remember to  implement common required feature
 *
 */
class TimeQuery extends Query {
  constructor() {
    super(...arguments)
  }

  startTime(/*time, comparator = Query.EXACT*/) {
    throw new MustBeImplemented('startTime')
  }

  endTime(/*time, comparator = Query.EXACT*/) {
    throw new MustBeImplemented('endTime')
  }

  timeInterval(lowerBound, upperBound) {
    return this.startTime(lowerBound, Query.GTE).endTime(upperBound, Query.LTE)
  }

  today() {
    let todayEarly = new Date().setHours(0, 0, 0, 0)
    let todayLate = new Date().setHours(23, 59, 59, 0)
    return this.timeInterval(todayEarly, todayLate)
  }

  orderedByTime() {
    throw new MustBeImplemented('orderedByTime')
  }
}

class DiscoEventQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return DiscoEventQuery.name
  }

  static get ENTRY_POINT() {
    return 'disco/events/'
  }

  //methods

  streamName(name) {
    return this._set('streamname', name)
  }

  streamType(name) {
    return this._set('streamtype', name)
  }

  starttime(time, comparator = Query.EXACT) {
    return this._set('starttime', Query.dateFormatter(time), comparator)
  }

  endtime(time, comparator = Query.EXACT) {
    return this._set('endtime', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.GTE) {
    return this.starttime(time, comparator)
  }

  endTime(time, comparator = Query.LTE) {
    return this.endtime(time, comparator)
  }

  avgLevel(level, comparator = Query.EXACT) {
    return this._set('avglevel', level, comparator)
  }

  avgLevelInterval(lowerBound, upperBound) {
    return this._setInterval('avglevel', lowerBound, upperBound)
  }

  numberDiscoProbes(number, comparator = Query.EXACT) {
    return this._set('nbdiscoprobes', number, comparator)
  }

  numberDiscoprobesInterval(lowerBound, upperBound) {
    return this._setInterval('nbdiscoprobes', lowerBound, upperBound)
  }

  totalProbes(tProbes, comparator = Query.EXACT) {
    return this._set('totalprobes', tProbes, comparator)
  }

  totalProbesInterval(lowerBound, upperBound) {
    return this._setInterval('totalprobes', lowerBound, upperBound)
  }

  ongoing(_ongoing) {
    return this._set('ongoing', _ongoing)
  }

  orderedByStartTime(order = Query.ASC) {
    return this._setOrder('starttime', order)
  }

  orderedByEndTime(order = Query.ASC) {
    return this._setOrder('endtime', order)
  }

  orderedByAvgLevel(order = Query.ASC) {
    return this._setOrder('avglevel', order)
  }

  orderedByNdDiscoProbes(order = Query.ASC) {
    return this._setOrder('nbdiscoprobes', order)
  }

  orderedByTime() {
    return this.orderedByStartTime()
  }

  clone() {
    return new DiscoEventQuery(this._clone())
  }
}

class DiscoProbesQuery extends Query {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return DiscoProbesQuery.name
  }

  static get ENTRY_POINT() {
    return 'disco_probes/'
  }

  //methods

  probeId(probeId) {
    return this._set('probe_id', probeId)
  }

  event(event) {
    return this._set('event', event)
  }

  orderedByStartTime(order = Query.ASC) {
    return this._setOrder('starttime', order)
  }

  orderedByEndTime(order = Query.ASC) {
    return this._setOrder('endtime', order)
  }

  orderedByLevel(order = Query.ASC) {
    return this._setOrder('level', order)
  }

  clone() {
    return new DiscoProbesQuery(this._clone())
  }
}

class ForwardingAlarmsQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return ForwardingAlarmsQuery.name
  }

  static get ENTRY_POINT() {
    return 'link/forwarding/alarms/'
  }

  //methods
  asNumber(asn) {
    return this._set('asn', asn)
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set('timebin', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  correlation(_correlation, comparator = Query.EXACT) {
    return this._set('correlation', _correlation, comparator)
  }

  responsibility(_responsibility, comparator = Query.EXACT) {
    return this._set('responsibility', _responsibility, comparator)
  }

  /**
   * @param matchType accepted values Query.EXACT and Query.CONTAINS
   */
  ip(_ip, matchType = Query.EXACT) {
    return this._set('ip', _ip, matchType)
  }

  /**
   * @param matchType accepted values Query.EXACT and Query.CONTAINS
   */
  previousHop(_previousHop, matchType = Query.EXACT) {
    return this._set('previoushop', _previousHop, matchType)
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder('timebin', order)
  }

  orderedByMagnitude(order = Query.ASC) {
    return this._setOrder('magnitude', order)
  }

  clone() {
    return new ForwardingAlarmsQuery(this._clone())
  }
}

/** \class DelayAlarmsQuery
 *  \brief delay_alarms entry point helper
 */
class DelayAlarmsQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return DelayAlarmsQuery.name
  }

  static get ENTRY_POINT() {
    return 'link/delay/alarms/'
  }

  //methods
  asNumber(asn) {
    return this._set('asn', asn)
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set('timebin', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  deviation(_deviation, comparator = Query.EXACT) {
    return this._set('deviation', _deviation, comparator)
  }

  medianDifference(diffmedian, comparator = Query.EXACT) {
    return this._set('diffmedian', diffmedian, comparator)
  }

  medianrtt(medianrtt, comparator = Query.EXACT) {
    return this._set('medianrtt', medianrtt, comparator)
  }

  /**
   * filter based on number of probes
   * @param {Integer} nbprobes the number of probes
   * @param {*} comparator  see Query comparators for more details
   */
  numberOfProbes(nbprobes, comparator = Query.EXACT) {
    return this._set('nbprobes', nbprobes, comparator)
  }

  /**
   * @param matchType accepted values Query.EXACT and Query.CONTAINS
   */
  links(links, matchType = Query.EXACT) {
    return this._set('links', links, matchType)
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder('timebin', order)
  }

  orderedByMagnitude(order = Query.ASC) {
    return this._setOrder('magnitude', order)
  }

  orderedByDeviation(order = Query.ASC) {
    return this._setOrder('deviation', order)
  }

  orderedByNumberOfProbes(order = Query.ASC) {
    return this._setOrder('nbprobes', order)
  }

  orderedByMedianDifference(order = Query.ASC) {
    return this._setOrder('magnitude', order)
  }

  orderByMedianrtt(order = Query.ASC) {
    return this._setOrder('medianrtt', order)
  }

  clone() {
    return new DelayAlarmsQuery(this._clone())
  }
}

class DelayAndForwardingQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  asNumber(asn) {
    return this._set('asn', asn)
  }

  magnitude(_magnitude) {
    return this._set('magnitude', _magnitude)
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set('timebin', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder('timebin', order)
  }

  orderedByMagnitude(order = Query.ASC) {
    return this._setOrder('magnitude', order)
  }
}

class DelayQuery extends DelayAndForwardingQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return DelayQuery.name
  }

  static get ENTRY_POINT() {
    return 'link/delay/'
  }
}

class ForwardingQuery extends DelayAndForwardingQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return ForwardingQuery.name
  }

  static get ENTRY_POINT() {
    return 'link/forwarding/'
  }
}

class CommonHegemonyQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  asNumber(asn) {
    return this._set('asn', asn)
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set('timebin', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  addressFamily(family) {
    return this._set('af', family)
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder('timebin', order)
  }

  orderedAsFamily(order = Query.ASC) {
    return this._setOrder('af', order)
  }
}

class HegemonyQuery extends CommonHegemonyQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return HegemonyQuery.name
  }

  static get ENTRY_POINT() {
    return 'hegemony/'
  }

  //methods

  originAs(origin) {
    return this._set('originasn', origin)
  }

  hegemony(hege, comparator = Query.EXACT) {
    return this._set('hege', hege, comparator)
  }

  orderedByOriginAs(order = Query.ASC) {
    return this._setOrder('originasn', order)
  }

  orderedByHegemony(order = Query.ASC) {
    return this._setOrder('hege', order)
  }

  clone() {
    return new HegemonyQuery(this._clone())
  }
}

class HegemonyPrefixQuery extends CommonHegemonyQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return HegemonyPrefixQuery.name
  }

  static get ENTRY_POINT() {
    return 'hegemony/prefixes/'
  }

  //methods
  originAs(asn_value) {
    return this._set('originasn', asn_value)
  }

  asn(asn_value) {
    return this._set('asn', asn_value)
  }

  country(cc) {
    return this._set('country', cc)
  }

  prefix(p0) {
    return this._set('prefix', p0)
  }

  rpkiStatus(status) {
    return this._set('rpki_status', status)
  }

  irrStatus(status) {
    return this._set('irr_status', status)
  }

  delegatedPrefixStatus(status) {
    return this._set('delegated_prefix_status', status)
  }

  delegatedAsnStatus(status) {
    return this._set('delegated_asn_status', status)
  }

  hegemony(hege, comparator = Query.EXACT) {
    return this._set('hege', hege, comparator)
  }

  orderedByPrefix(order = Query.ASC) {
    return this._setOrder('prefix', order)
  }

  orderedByHegemony(order = Query.ASC) {
    return this._setOrder('hege', order)
  }

  clone() {
    return new HegemonyPrefixQuery(this._clone())
  }
}

class HegemonyCountryQuery extends CommonHegemonyQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return HegemonyCountryQuery.name
  }

  static get ENTRY_POINT() {
    return 'hegemony/countries/'
  }

  //methods

  country(cc) {
    return this._set('country', cc)
  }

  hegemony(hege, comparator = Query.EXACT) {
    return this._set('hege', hege, comparator)
  }

  orderedByCountry(order = Query.ASC) {
    return this._setOrder('country', order)
  }

  orderedByHegemony(order = Query.ASC) {
    return this._setOrder('hege', order)
  }

  clone() {
    return new HegemonyCountryQuery(this._clone())
  }
}

class HegemonyAlarmsQuery extends CommonHegemonyQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return HegemonyAlarmsQuery.name
  }

  static get ENTRY_POINT() {
    return 'hegemony/alarms/'
  }

  //methods

  deviation(dev, comparator = Query.EXACT) {
    return this._set('deviation', dev, comparator)
  }

  startTime(time, comparator = Query.GTE) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.LTE) {
    return this.timeBin(time, comparator)
  }

  originAs(origin) {
    return this._set('originasn', origin)
  }

  hegemony(hege, comparator = Query.EXACT) {
    return this._set('hege', hege, comparator)
  }

  clone() {
    return new HegemonyAlarmsQuery(this._clone())
  }
}

class HegemonyConeQuery extends CommonHegemonyQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return HegemonyConeQuery.name
  }

  static get ENTRY_POINT() {
    return 'hegemony/cones/'
  }

  //methods

  orderedByAs(order = Query.ASC) {
    return this._setOrder('originasn', order)
  }

  clone() {
    return new HegemonyConeQuery(this._clone())
  }
}

class Edge {
  constructor(type, asFamily, name) {
    this.type = type
    this.asFamily = asFamily
    this.name = name
  }

  toString() {
    return this.type + this.asFamily + this.name
  }
}

class NetworkDelayAlarmsQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return NetworkDelayAlarmsQuery.name
  }

  static get ENTRY_POINT() {
    return 'network_delay/alarms/'
  }

  static get EDGE_TYPE() {
    return _NETWORK_DELAY_EDGE_TYPE
  }
  /**
   * Create an edge object to fetch the key entry point
   * @param {String} type you can use EDGE_TYPE for this
   * @param {Number} asFamily you can use AS_FAMILY for this
   * @param {String} name
   */
  static edge(type, asFamily, name) {
    return new Edge(type, asFamily, name)
  }

  //methods

  deviation(dev, comparator = Query.EXACT) {
    return this._set('deviation', dev, comparator)
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set('timebin', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.GTE) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.LTE) {
    return this.timeBin(time, comparator)
  }

  /**
   * @brief generic point filter in the standard compressed format
   * @param {Edge} endpoint_key use the static method edge to create Edge objects
   * @param {String} query_param the real query param to add to filter
   */
  _pointKey(endpoint_key, query_param) {
    if (endpoint_key instanceof Array) {
      endpoint_key = endpoint_key.map(elem => elem.toString())
    } else {
      endpoint_key = endpoint_key.toString()
    }

    return this._set(query_param, endpoint_key, Query.EXACT, _STRING_SEPARATOR)
  }

  /**
   * @brief add start point filter in the standard compressed format
   * @param {Edge} startpoint_key use the static method edge to create Edge objects
   */
  startPointKey(startpoint_key) {
    this._pointKey(startpoint_key, 'startpoint_key')
  }

  /**
   * @brief add start point filter in the standard compressed format
   * @param {Edge} endpoint_key use the static method edge to create Edge objects
   */
  endPointKey(endpoint_key) {
    //this._pointKey(endpoint_key, "endpoint_key");
    return this._set('endpoint_key', endpoint_key, Query.EXACT, _STRING_SEPARATOR)
  }

  startPointName(startpoint_name) {
    return this._set('startpoint_name', startpoint_name, Query.EXACT, _STRING_SEPARATOR)
  }

  endPointName(endpoint_name) {
    return this._set('endpoint_name', endpoint_name, Query.EXACT, _STRING_SEPARATOR)
  }
  /**
   * Filter for the type of start point
   * @param {String} startpoint_type you can use EDGE_TYPE of this class for this parameter
   */
  startPointType(startpoint_type) {
    return this._set('startpoint_type', startpoint_type)
  }

  /**
   * Filter for the type of end point
   * @param {String} endpoint_type you can use EDGE_TYPE of this class for this parameter
   */
  endPointType(endpoint_type) {
    return this._set('endpoint_type', endpoint_type)
  }

  /**
   * Filter for the as family of start point
   * @param {Number} startpoint_af you can use AS_FAMILY enum for this parameter
   */
  startPointAf(startpoint_af) {
    return this._set('startpoint_af', startpoint_af)
  }

  /**
   * Filter for the as family of end point
   * @param {Number} endpoint_af you can use AS_FAMILY enum for this parameter
   */
  endPointAf(endpoint_af) {
    return this._set('endpoint_af', endpoint_af)
  }

  // ordering

  orderedByTimebin(order = Query.ASC) {
    return this._setOrder('timebin', order)
  }

  orderedByTime(order = Query.ASC) {
    return this.orderedByTimebin(order)
  }

  orderByStartPointName(order = Query.ASC) {
    return this._setOrder('startpoint_name', order)
  }

  orderByEndPointName(order = Query.ASC) {
    return this._setOrder('endpoint_name', order)
  }

  clone() {
    return new NetworkDelayAlarmsQuery(this._clone())
  }
}

class NetworkDelayQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return NetworkDelayQuery.name
  }

  static get ENTRY_POINT() {
    return 'network_delay/'
  }

  static get EDGE_TYPE() {
    return _NETWORK_DELAY_EDGE_TYPE
  }
  /**
   * Create an edge object to fetch the key entry point
   * @param {String} type you can use EDGE_TYPE for this
   * @param {Number} asFamily you can use AS_FAMILY for this
   * @param {String} name
   */
  static edge(type, asFamily, name) {
    return new Edge(type, asFamily, name)
  }

  //methods

  timeBin(time, comparator = Query.EXACT) {
    return this._set('timebin', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.GTE) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.LTE) {
    return this.timeBin(time, comparator)
  }

  /**
   * @brief generic point filter in the standard compressed format
   * @param {Edge} endpoint_key use the static method edge to create Edge objects
   * @param {String} query_param the real query param to add to filter
   */
  _pointKey(endpoint_key, query_param) {
    if (endpoint_key instanceof Array) {
      endpoint_key = endpoint_key.map(elem => elem.toString())
    } else {
      endpoint_key = endpoint_key.toString()
    }

    return this._set(query_param, endpoint_key, Query.EXACT, _STRING_SEPARATOR)
  }

  /**
   * @brief add start point filter in the standard compressed format
   * @param {Edge} startpoint_key use the static method edge to create Edge objects
   */
  startPointKey(startpoint_key) {
    //this._pointKey(startpoint_key, "startpoint_key");
    return this._set('startpoint_key', startpoint_key, Query.EXACT, _STRING_SEPARATOR)
  }

  /**
   * @brief add start point filter in the standard compressed format
   * @param {Edge} endpoint_key use the static method edge to create Edge objects
   */
  endPointKey(endpoint_key) {
    //this._pointKey(endpoint_key, "endpoint_key");
    return this._set('endpoint_key', endpoint_key, Query.EXACT, _STRING_SEPARATOR)
  }

  startPointName(startpoint_name) {
    return this._set('startpoint_name', startpoint_name, Query.EXACT, _STRING_SEPARATOR)
  }

  endPointName(endpoint_name) {
    return this._set('endpoint_name', endpoint_name, Query.EXACT, _STRING_SEPARATOR)
  }
  /**
   * Filter for the type of start point
   * @param {String} startpoint_type you can use EDGE_TYPE of this class for this parameter
   */
  startPointType(startpoint_type) {
    return this._set('startpoint_type', startpoint_type)
  }

  /**
   * Filter for the type of end point
   * @param {String} endpoint_type you can use EDGE_TYPE of this class for this parameter
   */
  endPointType(endpoint_type) {
    return this._set('endpoint_type', endpoint_type)
  }

  /**
   * Filter for the as family of start point
   * @param {Number} startpoint_af you can use AS_FAMILY enum for this parameter
   */
  startpointAf(startpoint_af) {
    return this._set('startpoint_af', startpoint_af)
  }

  /**
   * Filter for the as family of end point
   * @param {Number} endpoint_af you can use AS_FAMILY enum for this parameter
   */
  endpointAf(endpoint_af) {
    return this._set('endpoint_af', endpoint_af)
  }

  // ordering

  orderedByTimebin(order = Query.ASC) {
    return this._setOrder('timebin', order)
  }

  orderedByTime(order = Query.ASC) {
    return this.orderedByTimebin(order)
  }

  orderByStartPointName(order = Query.ASC) {
    return this._setOrder('startpoint_name', order)
  }

  orderByEndPointName(order = Query.ASC) {
    return this._setOrder('endpoint_name', order)
  }

  clone() {
    return new NetworkDelayQuery(this._clone())
  }
}

class NetworkDelayLocation extends Query {
  constructor() {
    super(...arguments)
  }

  //static members
  static get FILTER_TYPE() {
    return NetworkDelayLocation.name
  }

  static get ENTRY_POINT() {
    return 'network_delay/locations/'
  }

  static get EDGE_TYPE() {
    return _NETWORK_DELAY_EDGE_TYPE
  }

  //methods

  name(name) {
    return this._set('name', name)
  }
  /**
   * filter by delay location type
   * @param {String} type you can use EDGE_TYPE helper fot this parameter
   */
  type(type) {
    return this._set('type', type)
  }

  asFamily(af) {
    return this._set('af', af)
  }

  orderedByName(order = Query.ASC) {
    return this._setOrder('name', order)
  }

  orderedByType(order = Query.ASC) {
    return this._setOrder('type', order)
  }

  orderedByAsFamily(order = Query.ASC) {
    return this._setOrder('af', order)
  }

  clone() {
    return new DiscoProbesQuery(this._clone())
  }
}

class MetisAtlasSelectionQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set('timebin', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  addressFamily(family) {
    return this._set('af', family)
  }

  metric(m) {
    return this._set('metric', m)
  }

  ranking(rank) {
    return this._set('rank', rank, Query.LTE)
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder('timebin', order)
  }

  orderedAsFamily(order = Query.ASC) {
    return this._setOrder('af', order)
  }

  orderedByRank(order = Query.ASC) {
    return this._setOrder('rank', order)
  }

  static get ENTRY_POINT() {
    return 'metis/atlas/selection/'
  }
}

class MetisAtlasDeploymentQuery extends TimeQuery {
  constructor() {
    super(...arguments)
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set('timebin', Query.dateFormatter(time), comparator)
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator)
  }

  addressFamily(family) {
    return this._set('af', family)
  }

  metric(m) {
    return this._set('metric', m)
  }

  ranking(rank) {
    return this._set('rank', rank, Query.LTE)
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder('timebin', order)
  }

  orderedAsFamily(order = Query.ASC) {
    return this._setOrder('af', order)
  }

  orderedByRank(order = Query.ASC) {
    return this._setOrder('rank', order)
  }

  static get ENTRY_POINT() {
    return 'metis/atlas/deployment/'
  }
}

export {
  AS_FAMILY,
  QueryBase,
  Query,
  NetworkQuery,
  CountryQuery,
  DiscoEventQuery,
  DiscoProbesQuery,
  HegemonyQuery,
  HegemonyCountryQuery,
  HegemonyPrefixQuery,
  HegemonyAlarmsQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAndForwardingQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery,
  NetworkDelayQuery,
  NetworkDelayAlarmsQuery,
  NetworkDelayLocation,
  MetisAtlasSelectionQuery,
  MetisAtlasDeploymentQuery,
}
