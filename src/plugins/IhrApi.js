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
const COOKIE_REGEX = /token=([^;]+);/;
function get_token_from_cookie() {
  let res = document.cookie.match(COOKIE_REGEX);
  return res.length === 0 ? null : res[0];
}

function put_token_into_cookie(token) {
  if (token === null) {
    document.cookie = document.cookie.replace(COOKIE_REGEX, `test=${token};`);
    return;
  }
  let replacement = document.cookie.replace(COOKIE_REGEX, `test=${token};`);
  if (replacement === document.cookie) {
    if (document.cookie != "") document.cookie += ";";
    document.cookie += `test=${token}`;
  }
}

const IhrApi = {
  install(Vue /*, options*/) {
    let ihr_api = new Vue({
      data() {
        return {
          authenticated: false,
          user: null,
          axios_base: null,
          local_base: null,
          headers: {}
        };
      },
      created() {
        this._update_base();
      },
      mounted() {
        this._setToken(get_token_from_cookie());
      },
      methods: {
        _update_base() {
          this.axios_base = axios.create({
            baseURL: IHR_API_BASE,
            timeout: DEFAULT_TIMEOUT,
            headers: this.headers
          });
          this.local_base = axios.create({
            //TODO remove me please
            baseURL: "http://localhost:8000/",
            timeout: DEFAULT_TIMEOUT,
            headers: this.headers
          });
        },
        _setToken(token) {
          put_token_into_cookie(token);
          if (token == null) {
            delete this.headers["Authorization"];
            this.authenticated = false;
          } else {
            this.headers["Authorization"] = "Token " + token;
            this.authenticated = true;
          }
          this._update_base();
        },
        _localWrapper() {
          //TODO kill me please :D
          let base = this.axios_base;
          this.axios_base = this.local_base;
          this._generic(...arguments);
          this.axios_base = base;
        },
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
        _generic: function(
          endpoint,
          method,
          query,
          success_callback,
          error_callback
        ) {
          if (Query.isPrototypeOf(query.constructor)) {
            console.log("call to:", query);
            query = query.get_filter();
          } else {
            console.log("call with non Query object:", JSON.stringify(query));
          }

          let promise =
            method === "get"
              ? this.axios_base.get(endpoint, { params: query })
              : this.axios_base.post(endpoint, query);

          promise
            .then(response => {
              if (success_callback instanceof Function)
                success_callback(response.data);
            })
            .catch(response => {
              console.error(response);
              if (error_callback instanceof Function)
                error_callback(response.data);
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
            "get",
            delayQuery,
            success_callback,
            error_callback
          );
        },
        delay_alarms(delayAlarmsQuery, success_callback, error_callback) {
          this._generic(
            DelayAlarmsQuery.ENTRY_POINT,
            "get",
            delayAlarmsQuery,
            success_callback,
            error_callback
          );
        },
        disco_events(discoEventQuery, success_callback, error_callback) {
          this._generic(
            DiscoEventQuery.ENTRY_POINT,
            "get",
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
            "get",
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
            "get",
            hegemonyQuery,
            success_callback,
            error_callback
          );
        },
        hegemony_cone(hegemonyConeQuery, success_callback, error_callback) {
          this._generic(
            HegemonyConeQuery.ENTRY_POINT,
            "get",
            hegemonyConeQuery,
            success_callback,
            error_callback
          );
        },
        network(networkQuery, success_callback, error_callback) {
          this._generic(
            NetworkQuery.ENTRY_POINT,
            "get",
            networkQuery,
            success_callback,
            error_callback
          );
        },
        userSignIn(
          email,
          password,
          recaptcha,
          success_callback,
          error_callback
        ) {
          this._localWrapper(
            "user/sign_up/",
            "post",
            { email: email, password: password, recaptcha: recaptcha },
            success_callback,
            error_callback
          );
        },
        userValidate(email, password, token, success_callback, error_callback) {
          this._localWrapper(
            "user/validate/",
            "post",
            { email: email, password: password, token: token },
            result => {
              this._setToken(result.token);
              this.email = null;
              success_callback(result);
            },
            error_callback
          );
        },
        userSignOut(success_callback, error_callback) {
          if (!this.authenticated) {
            error_callback("not authorized");
          }

          this._localWrapper(
            "user/sign_out/",
            "post",
            {},
            result => {
              this._setToken(null);
              this.email = null;
              success_callback(result);
            },
            error_callback
          );
        },
        userLogin(email, password, success_callback, error_callback) {
          this._localWrapper(
            "user/login/",
            "post",
            { email: email, password: password },
            result => {
              console.log(result);
              this._setToken(result.token);
              this.email = email;
              success_callback(result);
            },
            error_callback
          );
        },
        userLogout(success_callback, error_callback) {
          this._localWrapper(
            "user/logout/",
            "post",
            {},
            result => {
              this._setToken(null);
              this.email = null;
              success_callback(result);
            },
            error_callback
          );
        },
        userResetPasswordRequest(
          email,
          recaptcha,
          success_callback,
          error_callback
        ) {
          this._localWrapper(
            "user/request_reset_password/",
            "post",
            { email: email, recaptcha: recaptcha },
            result => {
              success_callback(result);
            },
            error_callback
          );
        },
        userResetPassword(
          email,
          password,
          token,
          success_callback,
          error_callback
        ) {
          this._localWrapper(
            "user/reset_password/",
            "post",
            { email: email, password: password, token: token },
            result => {
              this._setToken(result.token);
              this.email = email;
              success_callback(result);
            },
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
