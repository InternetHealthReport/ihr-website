// convenience constant for readability
const _NO_FILTER = {};
const _ORDER_ASC = "";
const _ORDER_DESC = "-";
const _LTE = "__lte";
const _GTE = "__gte";
const _EXACT = "";
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

/** @brief all allowed filters in ihr-api
 */
class Query {
  constructor(filterType = "Generic", dictionary = {}) {
    this.filter = dictionary;
    this.filterType = filterType;
  }

  // static members

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

  static date_formatter(date) {
    return encodeURI(date.toISOString());
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
    return order === null
      ? this._set("order")
      : this._set("order", order + name);
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
    return this.filterType + ": " + JSON.stringify(this.filter);
  }

  clone() {
    throw new MustBeImplemented("clone");
  }
}

class NetworksQuery extends Query {
  constructor() {
    super(NetworksQuery.name, ...arguments);
  }

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
    return new NetworksQuery(this._clone());
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
    super(DiscoEventQuery.name, ...arguments);
  }

  streamName(name) {
    return this._set("streamname", name);
  }

  streamType(name) {
    return this._set("streamtype", name);
  }

  startTime(time, comparator = Query.GTE) {
    return this._set("timebin", Query.date_formatter(time), comparator);
  }

  endTime(time, comparator = Query.LTE) {
    return this.startTime(time, comparator);
  }

  timeInterval(lowerBound, upperBound) {
    return this.startTime(lowerBound, Query.GTE).endTime(upperBound, Query.LTE);
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

  startTime(time, comparator = Query.EXACT) {
    return this._set("timebin", Query.date_formatter(time), comparator);
  }

  endTime(time, comparator = Query.EXACT) {
    return this.startTime(time, comparator);
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
    super(DelayQuery.name, ...arguments);
  }
}

class ForwardingQuery extends DelayAndForwardingQuery {
  constructor() {
    super(ForwardingQuery.name, ...arguments);
  }
}

class CommonHegemonyQuery extends TimeQuery {
  constructor() {
    super(...arguments);
  }

  asNumber(asn) {
    return this._set("asn", asn);
  }

  startTime(time, comparator = Query.EXACT) {
    return this._set("timebin", Query.date_formatter(time), comparator);
  }

  endTime(time, comparator = Query.EXACT) {
    return this.startTime(time, comparator);
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
    super(HegemonyQuery.name, ...arguments);
  }

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
    super(HegemonyConeQuery.name, ...arguments);
  }

  orderedByAs(order = Query.ASC) {
    return this._setOrder("originasn", order);
  }

  clone() {
    return new HegemonyConeQuery(this._clone());
  }
}

export {
  AS_FAMILY,
  Query,
  NetworksQuery,
  DiscoEventQuery,
  HegemonyQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery
};
