/** @file ihr-api.js
 *  @brief Vue-js plugin wrapping IHR API
 */

import axios from "axios";
import {
  AS_FAMILY,
  Query,
  NetworkQuery,
  DiscoEventQuery,
  HegemonyQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery
} from "./IhrQuery";

const IHR_API_BASE = "https://ihr.iijlab.net/ihr/api/"; ///base api url
const DEFAULT_TIMEOUT = 60000;
const PROJECT_START_DATE = new Date("2016-01-01T00:00:00");

const IhrApi = {
  install(Vue /*, options*/) {
    let ihr_api = new Vue({
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
          if (Query.isPrototypeOf(query.constructor)) {
            console.log("call to: " + query);
            query = query.get_filter();
          } else {
            console.log("call with non Query object: " + JSON.stringify(query));
          }
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

        getUrl(queryFilter) {
          return IHR_API_BASE + queryFilter.toUrl();
        },
        /**
         * @brief delay endpoint wrapper see @ref _generic()
         */
        delay(delayQuery, success_callback, error_callback) {
          this._generic(
            DelayQuery.ENTRY_POINT,
            delayQuery,
            success_callback,
            error_callback
          );
        },
        delay_alarms(delayAlarmsQuery, success_callback, error_callback) {
          this._generic(
            DelayAlarmsQuery.ENTRY_POINT,
            delayAlarmsQuery,
            success_callback,
            error_callback
          );
        },
        disco_events(discoEventQuery, success_callback, error_callback) {
          this._generic(
            DiscoEventQuery.ENTRY_POINT,
            discoEventQuery,
            success_callback,
            error_callback
          );
        },
        disco_probes() {
          this._generic("disco_probes/", ...arguments);
        },
        forwarding(forwardingQuery, success_callback, error_callback) {
          this._generic(
            ForwardingQuery.ENTRY_POINT,
            forwardingQuery,
            success_callback,
            error_callback
          );
        },
        forwarding_alarms() {
          this._generic("forwarding_alarms/", ...arguments);
        },
        hegemony(hegemonyQuery, success_callback, error_callback) {
          this._generic(
            HegemonyQuery.ENTRY_POINT,
            hegemonyQuery,
            success_callback,
            error_callback
          );
        },
        hegemony_cone(hegemonyConeQuery, success_callback, error_callback) {
          this._generic(
            HegemonyConeQuery.ENTRY_POINT,
            hegemonyConeQuery,
            success_callback,
            error_callback
          );
        },
        network(networkQuery, success_callback, error_callback) {
          this._generic(
            NetworkQuery.ENTRY_POINT,
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
      },
      filters: {
        // utilities
        ihr_getAsOrIxp(asn) {
          return asn < 0 ? "IXP" : "AS" + Math.abs(asn);
        }
      }
    });
  }
};

export {
  AS_FAMILY,
  PROJECT_START_DATE,
  IhrApi,
  Query,
  NetworkQuery,
  DiscoEventQuery,
  HegemonyQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery
};
