/** @file ihr-api.js
 *  @brief Vue-js plugin wrapping IHR API
 */

import axios from "axios";

const IHR_API_BASE = "https://ihr.iijlab.net/ihr/api/"; ///base api url

/** @brief all allowed filters in ihr-api
 */
class Query {
  constructor(filterType = "Generic", dictionary = {}) {
    this.filter = dictionary;
    this.filterType = filterType;
  }

  _set(name, value) {
    if (value === undefined) {
      delete this.filter[name];
      return this;
    }

    this.filter[name] = value;
    return this;
  }

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
const NO_FILTER = {};
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

  orderedByNumber() {
    return this._set("order", "number");
  }
}

const IhrApi = {
  install(Vue /*, options*/) {
    let ihr_api = new Vue({
      component: {
        axios
      },
      data() {
        return {
          axios_base: axios.create({
            baseURL: IHR_API_BASE,
            headers: {}
          })
        };
      },
      mounted() {},
      methods: {
        /**
         * @brief generic API wrapper
         * @param endpoint and-point name. it will be added to @ref
         *      ihr_api_base
         * @param success_callback <optional>
         *      If is a function will be called with the api result
         *      as parameter.
         * @param error_callback   <optional>
         *      If is a function will be called with the api error
         *      as parameter.
         */
        _generic: function(endpoint, query, success_callback, error_callback) {
          if (query instanceof Query) query = query.get_filter();
          console.log("call to: " + JSON.stringify(query));
          this.axios_base
            .get(endpoint, { params: query })
            .then(response => {
              if (success_callback instanceof Function)
                success_callback(response.data);
            })
            .catch(result => {
              console.log(result);
              if (error_callback instanceof Function)
                error_callback(result.response.data.error);
            });
        },
        /**
         * @brief delay endpoint wrapper see @ref _generic()
         */
        delay() {
          this._generic("delay/", arguments);
        },
        delay_alarms() {
          this._generic("delay_alarms/", arguments);
        },
        disco_events() {
          this._generic("disco_events/", arguments);
        },
        disco_probes() {
          this._generic("disco_probes/", arguments);
        },
        forwarding() {
          this._generic("forwarding/", arguments);
        },
        forwarding_alarms() {
          this._generic("forwarding_alarms/", arguments);
        },
        hegemony() {
          this._generic("hegemony/", arguments);
        },
        hegemony_cone() {
          this._generic("hegemony_cone/", arguments);
        },
        networks(networkQuery, success_callback, error_callback) {
          this._generic(
            "network/",
            networkQuery,
            success_callback,
            error_callback
          );
        }
      }
    });

    Vue.mixin({
      beforeCreate() {
        this.$ihr_api = ihr_api;
      }
    });
  }
};

export { NetworkQuery, IhrApi, NO_FILTER };
