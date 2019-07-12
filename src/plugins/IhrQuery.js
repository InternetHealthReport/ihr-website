// convenience constant for readability
const _NO_FILTER = {};
const _ORDER_ASC = "";
const _ORDER_DESC = "-";
const _LTE = "__lte";
const _GTE = "__gte";
const _EXACT = "";

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
}

class NetworkQuery extends Query {
  constructor() {
    super(NetworkQuery.name, arguments);
  }

  containsName(name) {
    return this._set("name", name);
  }

  exactAsn(asn) {
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
}

class DiscoEventQuery extends Query {
  constructor() {
    super(DiscoEventQuery.name, arguments);
  }

  streamName(name) {
    return this._set("streamname", name);
  }

  streamType(name) {
    return this._set("streamtype", name);
  }

  startTime(time, comparator = Query.EXACT) {
    return this._set("startime", Query.date_formatter(time), comparator);
  }

  endTime(time, comparator = Query.EXACT) {
    return this._set("endtime", Query.date_formatter(time), comparator);
  }

  timeInterval(lowerBound, upperBound) {
    return this.startTime(lowerBound, Query.GTE).endTime(upperBound, Query.LTE);
  }

  today() {
    let todayEarly = new Date().setHours(0, 0, 0, 0);
    let todayLate = new Date().setHours(23, 59, 59, 0);
    return this.timeInterval(todayEarly, todayLate);
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
}

export { Query, NetworkQuery, DiscoEventQuery };
