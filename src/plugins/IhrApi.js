/** @file ihr-api.js
 *  @brief Vue-js plugin wrapping IHR API
 */

import axios from "axios";
import {
  AS_FAMILY,
  QueryBase,
  Query,
  NetworkQuery,
  DiscoEventQuery,
  DiscoProbesQuery,
  HegemonyQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery
} from "./query/IhrQuery";
import { MonitoringUserQuery } from "./query/IhrUserQuery";

const IHR_API_BASE = "https://ihr.iijlab.net/ihr/api/"; ///base api url
const DEFAULT_TIMEOUT = 60000;
const PROJECT_START_DATE = new Date("2016-01-01T00:00:00");
const COOKIE_DURATION = 1 * 24 * 60 * 60 * 1000; //TODO synch with server
function createCookie(name, value) {
  let date = new Date();
  date.setTime(date.getTime() + (value != null ? COOKIE_DURATION : -100));
  document.cookie = `${name}=${value}; expires=${date.toGMTString()}; path=/`;
}
// Read cookie
function readCookie(name) {
  let regexp = new RegExp(`(?:^${name}| ${name})=([^;]+)`);
  let res = document.cookie.match(regexp);
  if (res === null || res.length === 0) {
    return null;
  }
  return res[1];
}

const IhrApi = {
  install(Vue /*, options*/) {
    let ihr_api = new Vue({
      data() {
        return {
          user: null,
          axios_base: null,
          local_base: null,
          headers: {}
        };
      },
      created() {
        !this._get_user() || this.userVerifyToken();
      },
      computed: {
        authenticated() {
          return this.user !== null;
        }
      },
      methods: {
        _save_user(email, token) {
          if (email === null || token === null) {
            this.user = null;
            delete this.headers["Authorization"];
            createCookie("user", null);
            createCookie("token", null);
          } else {
            this.user = email.split("@")[0];
            this.headers["Authorization"] = `Token ${token}`;
            createCookie("user", this.user);
            createCookie("token", token);
          }
          this._update_base();
        },
        _get_user() {
          this.user = readCookie("user");
          if (this.user == null) {
            this._update_base();
            return false;
          }
          this.headers["Authorization"] = `Token ${readCookie("token")}`;
          this._update_base();
          return true;
        },
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
        _localWrapper() {
          //TODO kill me please :D
          let base = this.axios_base;
          this.axios_base = this.local_base;
          this._generic(...arguments);
          this.axios_base = base;
        },
        _check_authorization(error_callback) {
          if (!this.authenticated) {
            if (error_callback instanceof Function)
              error_callback({
                status: 401,
                data: { datail: "need to login" }
              });
            return false;
          }
          return true;
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
          if (QueryBase.isPrototypeOf(query.constructor)) {
            console.log("call to:", query, query.toString());
            console.log("query url:", this.getUrl(query));
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
                success_callback(response.data, response);
            })
            .catch(error => {
              console.error("error:", error);
              if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error_callback instanceof Function)
                  error_callback(error.response);
              } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.error(error.request);
              }
              // Something happened in setting up the request that triggered an Error
              throw Error(error.message);
            });
        },

        getUrl(queryFilter) {
          if (queryFilter == null) {
            return "";
          }
          return IHR_API_BASE + queryFilter.toUrl();
        },
        /**
         * @brief delay endpoint wrapper see @ref _generic()
         */
        delay(delayQuery, success_callback, error_callback) {
          this._generic(
            DelayQuery.ENTRY_POINT,
            DelayQuery.HTTP_METHOD,
            delayQuery,
            success_callback,
            error_callback
          );
        },
        delay_alarms(delayAlarmsQuery, success_callback, error_callback) {
          this._generic(
            DelayAlarmsQuery.ENTRY_POINT,
            DelayAlarmsQuery.HTTP_METHOD,
            delayAlarmsQuery,
            success_callback,
            error_callback
          );
        },
        disco_events(discoEventQuery, success_callback, error_callback) {
          this._generic(
            DiscoEventQuery.ENTRY_POINT,
            DiscoEventQuery.HTTP_METHOD,
            discoEventQuery,
            success_callback,
            error_callback
          );
        },
        disco_probes(discoProbesQuery, success_callback, error_callback) {
          this._generic(
            DiscoProbesQuery.ENTRY_POINT,
            DiscoProbesQuery.HTTP_METHOD,
            discoProbesQuery,
            success_callback,
            error_callback
          );
        },
        forwarding(forwardingQuery, success_callback, error_callback) {
          this._generic(
            ForwardingQuery.ENTRY_POINT,
            ForwardingQuery.HTTP_METHOD,
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
            HegemonyQuery.HTTP_METHOD,
            hegemonyQuery,
            success_callback,
            error_callback
          );
        },
        hegemony_cone(hegemonyConeQuery, success_callback, error_callback) {
          this._generic(
            HegemonyConeQuery.ENTRY_POINT,
            HegemonyConeQuery.HTTP_METHOD,
            hegemonyConeQuery,
            success_callback,
            error_callback
          );
        },
        network(networkQuery, success_callback, error_callback) {
          this._generic(
            NetworkQuery.ENTRY_POINT,
            NetworkQuery.HTTP_METHOD,
            networkQuery,
            success_callback,
            error_callback
          );
        },
        // User management section
        userSignIn(
          email,
          password,
          recaptcha,
          success_callback,
          error_callback
        ) {
          this._localWrapper(
            "user/sign_in/",
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
              this._save_user(email, result.token);
              if (success_callback instanceof Function)
                success_callback(result);
            },
            error_callback
          );
        },
        userSignOut(success_callback, error_callback) {
          this._check_authorization(error_callback) &&
            this._localWrapper(
              "user/sign_out/",
              "post",
              {},
              result => {
                this._save_user(null);
                if (success_callback instanceof Function)
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
              this._save_user(email, result.token);
              if (success_callback instanceof Function)
                success_callback(result);
            },
            error_callback
          );
        },
        userLogout(success_callback, error_callback) {
          this._check_authorization(error_callback) &&
            this._localWrapper(
              "user/logout/",
              "post",
              {},
              result => {
                this._save_user(null);
                if (success_callback instanceof Function)
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
              this._save_user(email, result.token);
              if (success_callback instanceof Function)
                success_callback(result);
            },
            error_callback
          );
        },
        userVerifyToken: async function() {
          try {
            await this.local_base.get("user/verify_token/");
            return true;
          } catch (err) {
            this._save_user(null);
          }
          return false;
        },
        /**
         * Change user credential
         * @param {Dict} userChange not null but you can specify email, password or both
         */
        userChangeCredentials(userChange, success_callback, error_callback) {
          if (Object.keys(userChange).length == 0) {
            throw Error("invalid number of parameters!");
          }
          this._check_authorization(error_callback) &&
            this._localWrapper(
              "user/change_credentials/",
              "post",
              { ...userChange },
              success_callback,
              error_callback
            );
        },
        userChangeEmail(
          email,
          password,
          token,
          success_callback,
          error_callback
        ) {
          this._localWrapper(
            "user/change_email/",
            "post",
            { email: email, password: password, token: token },
            result => {
              this._save_user(email, result.token);
              if (success_callback instanceof Function)
                success_callback(result);
            },
            error_callback
          );
        },
        userShow(success_callback, error_callback) {
          this._check_authorization(error_callback) &&
            this._localWrapper(
              "user/show/",
              "post",
              {},
              success_callback,
              error_callback
            );
        },
        userAddMonitoring(
          monitoringUserQuery,
          success_callback,
          error_callback
        ) {
          this._check_authorization(error_callback) &&
            this._localWrapper(
              MonitoringUserQuery.ENTRY_POINT,
              MonitoringUserQuery.HTTP_METHOD,
              monitoringUserQuery,
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
  DiscoProbesQuery,
  HegemonyQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery,
  MonitoringUserQuery
};
