/** @file ihr-api.js
 *  @brief Vue-js plugin wrapping IHR API
 */

import axios from "axios";
import { Query, NetworksQuery, DiscoEventQuery } from "./IhrQuery";

const IHR_API_BASE = "https://ihr.iijlab.net/ihr/api/"; ///base api url
const DEFAULT_TIMEOUT = 2000;
const PROJECT_START_DATE = new Date("2016-01-01T00:00:00");

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
            .get(endpoint, { params: query, timeout: DEFAULT_TIMEOUT })
            .then(response => {
              if (success_callback instanceof Function)
                success_callback(response.data);
            })
            .catch(result => {
              console.error(result);
              if (error_callback instanceof Function) error_callback(result);
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
        disco_events(discoEventQuery, success_callback, error_callback) {
          this._generic(
            "disco_events/",
            discoEventQuery,
            success_callback,
            error_callback
          );
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

export { PROJECT_START_DATE, IhrApi, Query, NetworksQuery, DiscoEventQuery };
