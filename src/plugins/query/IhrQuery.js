// convenience constant for readability
const _NO_FILTER = {};
const _ORDER_ASC = "";
const _ORDER_DESC = "-";
const _LTE = "__lte";
const _GTE = "__gte";
const _EXACT = "";
const _CONTAINS = "__icontains";
const AS_FAMILY = {
  v4: 4,
  v6: 6
};

// exceptions
class MustBeImplemented extends SyntaxError {
  constructor(functionName) {
    super(`${functionName} MUST Be Implemented!`);
  }
}

class QueryBase {
  // static members
  static get FILTER_TYPE() {
    throw MustBeImplemented("QueryBase.FILTER_TYPE");
  }

  static get ENTRY_POINT() {
    throw MustBeImplemented("QueryBase.FILTER_TYPE");
  }

  get_filter() {
    throw MustBeImplemented("QueryBase.get_filter");
  }
}

/** @brief all allowed filters in ihr-api
 */
class Query extends QueryBase {
  constructor(dictionary = {}) {
    super();
    this.filter = dictionary;
  }

  // static members
  static get FILTER_TYPE() {
    return "Generic";
  }

  static get ENTRY_POINT() {
    return "";
  }

  static get HTTP_METHOD() {
    return "get";
  }

  static get NO_FILTER() {
    return _NO_FILTER;
  }

  static get ASC() {
    return _ORDER_ASC;
  }

  static get DESC() {
    return _ORDER_DESC;
  }

  static get LTE() {
    return _LTE;
  }

  static get GTE() {
    return _GTE;
  }

  static get EXACT() {
    return _EXACT;
  }

  static get CONTAINS() {
    return _CONTAINS;
  }

  static dateFormatter(date) {
    return date == undefined ? date : encodeURI(date.toISOString());
  }

  //private functions
  _set(name, value, comparator = Query.EXACT) {
    if (value == undefined) {
      delete this.filter[name + comparator];
      return this;
    }

    this.filter[name + comparator] = value;
    return this;
  }

  _setInterval(name, lowerBound, upperBound) {
    return this._set(name, lowerBound, Query.GTE)._set(
      name,
      upperBound,
      Query.GTE
    );
  }

  _setOrder(name, order = Query.ASC) {
    return order == null
      ? this._set("ordering")
      : this._set("ordering", order + name);
  }

  _clone() {
    return Object.assign({}, this.filter);
  }

  //public functions

  //merged filter has the priority
  merge(filter) {
    this.filter = { ...this.filter, ...filter };
    return this;
  }

  reset() {
    this.filter = {};
    return this;
  }

  get_filter() {
    return this.filter;
  }

  toString() {
    return this.constructor.FILTER_TYPE + ": " + JSON.stringify(this.filter);
  }

  toUrl() {
    let str = [];
    for (let param in this.filter)
      str.push(
        `${encodeURIComponent(param)}=${encodeURIComponent(this.filter[param])}`
      );
    return `${this.constructor.ENTRY_POINT}?${str.join("&")}`;
  }

  clone() {
    throw new MustBeImplemented("clone");
  }
}

class NetworkQuery extends Query {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return NetworkQuery.name;
  }

  static get ENTRY_POINT() {
    return "network/";
  }

  //methods

  containsName(name) {
    return this._set("name", name);
  }

  asNumber(asn) {
    return this._set("number", asn);
  }

  /**
   * @brief it match asn or name, but ignore the the AS and IX prefix (see API docs)
   *
   * @param {*} search the string to search
   */
  mixedContentSearch(search) {
    return this._set("search", search);
  }

  orderedByNumber(order = Query.ASC) {
    return this._setOrder("number", order);
  }

  clone() {
    return new NetworkQuery(this._clone());
  }
}

/** Placeholder class to remember to  implement common required feature
 *
 */
class TimeQuery extends Query {
  constructor() {
    super(...arguments);
  }

  startTime(/*time, comparator = Query.EXACT*/) {
    throw new MustBeImplemented("startTime");
  }

  endTime(/*time, comparator = Query.EXACT*/) {
    throw new MustBeImplemented("endTime");
  }

  timeInterval(lowerBound, upperBound) {
    return this.startTime(lowerBound, Query.GTE).endTime(upperBound, Query.LTE);
  }

  today() {
    let todayEarly = new Date().setHours(0, 0, 0, 0);
    let todayLate = new Date().setHours(23, 59, 59, 0);
    return this.timeInterval(todayEarly, todayLate);
  }

  orderedByTime() {
    throw new MustBeImplemented("orderedByTime");
  }
}

class DiscoEventQuery extends TimeQuery {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return DiscoEventQuery.name;
  }

  static get ENTRY_POINT() {
    return "disco_events/";
  }

  //methods

  streamName(name) {
    return this._set("streamname", name);
  }

  streamType(name) {
    return this._set("streamtype", name);
  }

  starttime(time, comparator = Query.EXACT) {
    return this._set("starttime", Query.dateFormatter(time), comparator);
  }

  endttime(time, comparator = Query.EXACT) {
    return this._set("endttime", Query.dateFormatter(time), comparator);
  }

  startTime(time, comparator = Query.GTE) {
    return this.starttime(time, comparator);
  }

  endTime(time, comparator = Query.LTE) {
    return this.endttime(time, comparator);
  }

  avgLevel(level, comparator = Query.EXACT) {
    return this._set("avglevel", level, comparator);
  }

  avgLevelInterval(lowerBound, upperBound) {
    return this._setInterval("avglevel", lowerBound, upperBound);
  }

  numberDiscoProbes(number, comparator = Query.EXACT) {
    return this._set("nbdiscoprobes", number, comparator);
  }

  numberDiscoprobesInterval(lowerBound, upperBound) {
    return this._setInterval("nbdiscoprobes", lowerBound, upperBound);
  }

  totalProbes(tProbes, comparator = Query.EXACT) {
    return this._set("totalprobes", tProbes, comparator);
  }

  totalProbesInterval(lowerBound, upperBound) {
    return this._setInterval("totalprobes", lowerBound, upperBound);
  }

  ongoing(_ongoing) {
    return this._set("ongoing", _ongoing);
  }

  orderedByStartTime(order = Query.ASC) {
    return this._setOrder("starttime", order);
  }

  orderedByEndTime(order = Query.ASC) {
    return this._setOrder("endtime", order);
  }

  orderedByAvgLevel(order = Query.ASC) {
    return this._setOrder("avglevel", order);
  }

  orderedByNdDiscoProbes(order = Query.ASC) {
    return this._setOrder("nbdiscoprobes", order);
  }

  orderedByTime() {
    return this.orderedByStartTime();
  }

  clone() {
    return new DiscoEventQuery(this._clone());
  }
}

class DiscoEventProbesQuery extends Query {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return DiscoEventProbesQuery.name;
  }

  static get ENTRY_POINT() {
    return "disco_probes/";
  }

  //methods

  probeId(probeId) {
    return this._set("probe_id", probeId);
  }

  event(event) {
    return this._set("event", event);
  }

  orderedByStartTime(order = Query.ASC) {
    return this._setOrder("starttime", order);
  }

  orderedByEndTime(order = Query.ASC) {
    return this._setOrder("endtime", order);
  }

  orderedByLevel(order = Query.ASC) {
    return this._setOrder("level", order);
  }

  clone() {
    return new DiscoEventProbesQuery(this._clone());
  }
}

class ForwardingAlarmsQuery extends TimeQuery {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return ForwardingAlarmsQuery.name;
  }

  static get ENTRY_POINT() {
    return "forwarding_alarms/";
  }

  //methods
  asNumber(asn) {
    return this._set("asn", asn);
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set("timebin", Query.dateFormatter(time), comparator);
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator);
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator);
  }

  correlation(_correlation, comparator = Query.EXACT) {
    return this._set("correlation", _correlation, comparator);
  }

  responsibility(_responsibility, comparator = Query.EXACT) {
    return this._set("responsibility", _responsibility, comparator);
  }

  /**
   * @param matchType accepted values Query.EXACT and Query.CONTAINS
   */
  ip(_ip, matchType = Query.EXACT) {
    return this._set("ip", _ip, matchType);
  }

  /**
   * @param matchType accepted values Query.EXACT and Query.CONTAINS
   */
  previousHop(_previousHop, matchType = Query.EXACT) {
    return this._set("previoushop", _previousHop, matchType);
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder("timebin", order);
  }

  orderedByMagnitude(order = Query.ASC) {
    return this._setOrder("magnitude", order);
  }

  clone() {
    return new ForwardingAlarmsQuery(this._clone());
  }
}

class DelayAlarmsQuery extends TimeQuery {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return DelayAlarmsQuery.name;
  }

  static get ENTRY_POINT() {
    return "delay_alarms/";
  }

  //methods
  asNumber(asn) {
    return this._set("asn", asn);
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set("timebin", Query.dateFormatter(time), comparator);
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator);
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator);
  }

  deviation(_deviation, comparator = Query.EXACT) {
    return this._set("deviation", _deviation, comparator);
  }

  medianDifference(diffmedian, comparator = Query.EXACT) {
    return this._set("diffmedian", diffmedian, comparator);
  }

  medianrtt(medianrtt, comparator = Query.EXACT) {
    return this._set("medianrtt", medianrtt, comparator);
  }

  numberOfProbes(nbprobes, comparator = Query.EXACT) {
    return this._set("nbprobes", nbprobes, comparator);
  }

  /**
   * @param matchType accepted values Query.EXACT and Query.CONTAINS
   */
  links(links, matchType = Query.EXACT) {
    return this._set("links", links, matchType);
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder("timebin", order);
  }

  orderedByMagnitude(order = Query.ASC) {
    return this._setOrder("magnitude", order);
  }

  orderedByDeviation(order = Query.ASC) {
    return this._setOrder("deviation", order);
  }

  orderedByNumberOfProbes(order = Query.ASC) {
    return this._setOrder("nbprobes", order);
  }

  orderedByMedianDifference(order = Query.ASC) {
    return this._setOrder("magnitude", order);
  }

  orderByMedianrtt(order = Query.ASC) {
    return this._setOrder("medianrtt", order);
  }

  clone() {
    return new DelayAlarmsQuery(this._clone());
  }
}

class DelayAndForwardingQuery extends TimeQuery {
  constructor() {
    super(...arguments);
  }

  asNumber(asn) {
    return this._set("asn", asn);
  }

  magnitude(_magnitude) {
    return this._set("magnitude", _magnitude);
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set("timebin", Query.dateFormatter(time), comparator);
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator);
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator);
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder("timebin", order);
  }

  orderedByMagnitude(order = Query.ASC) {
    return this._setOrder("magnitude", order);
  }
}

class DelayQuery extends DelayAndForwardingQuery {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return DelayQuery.name;
  }

  static get ENTRY_POINT() {
    return "delay/";
  }
}

class ForwardingQuery extends DelayAndForwardingQuery {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return ForwardingQuery.name;
  }

  static get ENTRY_POINT() {
    return "forwarding/";
  }
}

class CommonHegemonyQuery extends TimeQuery {
  constructor() {
    super(...arguments);
  }

  asNumber(asn) {
    return this._set("asn", asn);
  }

  timeBin(time, comparator = Query.EXACT) {
    return this._set("timebin", Query.dateFormatter(time), comparator);
  }

  startTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator);
  }

  endTime(time, comparator = Query.EXACT) {
    return this.timeBin(time, comparator);
  }

  asFamily(family) {
    return this._set("af", family);
  }

  orderedByTime(order = Query.ASC) {
    return this._setOrder("timebin", order);
  }

  orderedAsFamily(order = Query.ASC) {
    return this._setOrder("af", order);
  }
}

class HegemonyQuery extends CommonHegemonyQuery {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return HegemonyQuery.name;
  }

  static get ENTRY_POINT() {
    return "hegemony/";
  }

  //methods

  originAs(origin) {
    return this._set("originasn", origin);
  }

  hegemony(hege, comparator = Query.EXACT) {
    return this._set("hege", hege, comparator);
  }

  orderedByOriginAs(order = Query.ASC) {
    return this._setOrder("originasn", order);
  }

  orderedByHegemony(order = Query.ASC) {
    return this._setOrder("hege", order);
  }

  clone() {
    return new HegemonyQuery(this._clone());
  }
}

class HegemonyConeQuery extends CommonHegemonyQuery {
  constructor() {
    super(...arguments);
  }

  //static members
  static get FILTER_TYPE() {
    return HegemonyConeQuery.name;
  }

  static get ENTRY_POINT() {
    return "hegemony_cone/";
  }

  //methods

  orderedByAs(order = Query.ASC) {
    return this._setOrder("originasn", order);
  }

  clone() {
    return new HegemonyConeQuery(this._clone());
  }
}

export {
  AS_FAMILY,
  QueryBase,
  Query,
  NetworkQuery,
  DiscoEventQuery,
  DiscoEventProbesQuery,
  HegemonyQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAndForwardingQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery
};
