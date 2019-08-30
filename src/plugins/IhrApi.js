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
  ForwardingAlarmsQuery,
  NetworkDelayQuery,
  NetworkDelayLocation
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
        _check_authorization(errorCallback) {
          if (!this.authenticated) {
            if (errorCallback instanceof Function)
              errorCallback({
                status: 401,
                data: { datail: "need to login" }
              });
            return false;
          }
          return true;
        },

        _resolveAxiosPromise(
          endpoint,
          method,
          query,
          successCallback,
          errorCallback
        ) {
          let promise =
            method === "get"
              ? this.axios_base.get(endpoint, { params: query })
              : this.axios_base.post(endpoint, query);

          promise
            .then(response => {
              if (successCallback instanceof Function) {
                successCallback(response.data, response);
              }
            })
            .catch(error => {
              console.error("error:", error);
              if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (errorCallback instanceof Function) {
                  errorCallback(error.response);
                }
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
        /**
         * @brief generic API wrapper
         * @param endpoint and-point name. it will be added to @ref
         *      ihr_api_base
         * @param successCallback <optional>
         *      If is a function will be called with the api result
         *      as parameter.
         * @param errorCallback   <optional>
         *      If is a function will be called with the api error
         *      as parameter.
         */
        _generic: function(
          endpoint,
          method,
          query,
          successCallback,
          errorCallback
        ) {
          if (QueryBase.isPrototypeOf(query.constructor)) {
            console.log("call to:", query, query.toString());
            console.log("query url:", this.getUrl(query));
            let resolvePagination = query.resolvePagination;
            query = query.get_filter();
            if (resolvePagination && successCallback instanceof Function) {
              let singleSuccess = successCallback;
              let recursiveSuccess = (data, response) => {
                singleSuccess(data, response);
                if (data.next != null) {
                  console.log(data.next);
                  this._resolveAxiosPromise(
                    data.next,
                    method,
                    "",
                    recursiveSuccess,
                    errorCallback
                  );
                }
              };
              successCallback = recursiveSuccess;
            }
          } else {
            console.log("call with non Query object:", JSON.stringify(query));
          }

          this._resolveAxiosPromise(
            endpoint,
            method,
            query,
            successCallback,
            errorCallback
          );
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
        delay(delayQuery, successCallback, errorCallback) {
          this._generic(
            DelayQuery.ENTRY_POINT,
            DelayQuery.HTTP_METHOD,
            delayQuery,
            successCallback,
            errorCallback
          );
        },
        delay_alarms(delayAlarmsQuery, successCallback, errorCallback) {
          this._generic(
            DelayAlarmsQuery.ENTRY_POINT,
            DelayAlarmsQuery.HTTP_METHOD,
            delayAlarmsQuery,
            successCallback,
            errorCallback
          );
        },
        disco_events(discoEventQuery, successCallback, errorCallback) {
          this._generic(
            DiscoEventQuery.ENTRY_POINT,
            DiscoEventQuery.HTTP_METHOD,
            discoEventQuery,
            successCallback,
            errorCallback
          );
        },
        disco_probes(discoProbesQuery, successCallback, errorCallback) {
          this._generic(
            DiscoProbesQuery.ENTRY_POINT,
            DiscoProbesQuery.HTTP_METHOD,
            discoProbesQuery,
            successCallback,
            errorCallback
          );
        },
        forwarding(forwardingQuery, successCallback, errorCallback) {
          this._generic(
            ForwardingQuery.ENTRY_POINT,
            ForwardingQuery.HTTP_METHOD,
            forwardingQuery,
            successCallback,
            errorCallback
          );
        },
        forwarding_alarms(
          forwardingAlarmsQuery,
          successCallback,
          errorCallback
        ) {
          this._generic(
            ForwardingAlarmsQuery.ENTRY_POINT,
            ForwardingAlarmsQuery.HTTP_METHOD,
            forwardingAlarmsQuery,
            successCallback,
            errorCallback
          );
        },
        hegemony(hegemonyQuery, successCallback, errorCallback) {
          this._generic(
            HegemonyQuery.ENTRY_POINT,
            HegemonyQuery.HTTP_METHOD,
            hegemonyQuery,
            successCallback,
            errorCallback
          );
        },
        hegemony_cone(hegemonyConeQuery, successCallback, errorCallback) {
          this._generic(
            HegemonyConeQuery.ENTRY_POINT,
            HegemonyConeQuery.HTTP_METHOD,
            hegemonyConeQuery,
            successCallback,
            errorCallback
          );
        },
        network(networkQuery, successCallback, errorCallback) {
          this._generic(
            NetworkQuery.ENTRY_POINT,
            NetworkQuery.HTTP_METHOD,
            networkQuery,
            successCallback,
            errorCallback
          );
        },
        network_delay(networkDelayQuery, successCallback, errorCallback) {
          this._generic(
            NetworkDelayQuery.ENTRY_POINT,
            NetworkDelayQuery.HTTP_METHOD,
            networkDelayQuery,
            successCallback,
            errorCallback
          );
        },
        network_delay_location(
          networkDelayLocation,
          successCallback,
          errorCallback
        ) {
          this._generic(
            NetworkDelayLocation.ENTRY_POINT,
            NetworkDelayLocation.HTTP_METHOD,
            networkDelayLocation,
            successCallback,
            errorCallback
          );
        },
        // User management section
        userSignIn(email, password, recaptcha, successCallback, errorCallback) {
          this._localWrapper(
            "user/sign_in/",
            "post",
            { email: email, password: password, recaptcha: recaptcha },
            successCallback,
            errorCallback
          );
        },
        userValidate(email, password, token, successCallback, errorCallback) {
          this._localWrapper(
            "user/validate/",
            "post",
            { email: email, password: password, token: token },
            result => {
              this._save_user(email, result.token);
              if (successCallback instanceof Function) successCallback(result);
            },
            errorCallback
          );
        },
        userSignOut(successCallback, errorCallback) {
          this._check_authorization(errorCallback) &&
            this._localWrapper(
              "user/sign_out/",
              "post",
              {},
              result => {
                this._save_user(null);
                if (successCallback instanceof Function)
                  successCallback(result);
              },
              errorCallback
            );
        },
        userLogin(email, password, successCallback, errorCallback) {
          this._localWrapper(
            "user/login/",
            "post",
            { email: email, password: password },
            result => {
              this._save_user(email, result.token);
              if (successCallback instanceof Function) successCallback(result);
            },
            errorCallback
          );
        },
        userLogout(successCallback, errorCallback) {
          this._check_authorization(errorCallback) &&
            this._localWrapper(
              "user/logout/",
              "post",
              {},
              result => {
                this._save_user(null);
                if (successCallback instanceof Function)
                  successCallback(result);
              },
              errorCallback
            );
        },
        userResetPasswordRequest(
          email,
          recaptcha,
          successCallback,
          errorCallback
        ) {
          this._localWrapper(
            "user/request_reset_password/",
            "post",
            { email: email, recaptcha: recaptcha },
            result => {
              successCallback(result);
            },
            errorCallback
          );
        },
        userResetPassword(
          email,
          password,
          token,
          successCallback,
          errorCallback
        ) {
          this._localWrapper(
            "user/reset_password/",
            "post",
            { email: email, password: password, token: token },
            result => {
              this._save_user(email, result.token);
              if (successCallback instanceof Function) successCallback(result);
            },
            errorCallback
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
        userChangeCredentials(userChange, successCallback, errorCallback) {
          if (Object.keys(userChange).length == 0) {
            throw Error("invalid number of parameters!");
          }
          this._check_authorization(errorCallback) &&
            this._localWrapper(
              "user/change_credentials/",
              "post",
              { ...userChange },
              successCallback,
              errorCallback
            );
        },
        userChangeEmail(
          email,
          password,
          token,
          successCallback,
          errorCallback
        ) {
          this._localWrapper(
            "user/change_email/",
            "post",
            { email: email, password: password, token: token },
            result => {
              this._save_user(email, result.token);
              if (successCallback instanceof Function) successCallback(result);
            },
            errorCallback
          );
        },
        userShow(successCallback, errorCallback) {
          this._check_authorization(errorCallback) &&
            this._localWrapper(
              "user/show/",
              "post",
              {},
              successCallback,
              errorCallback
            );
        },
        userAddMonitoring(monitoringUserQuery, successCallback, errorCallback) {
          this._check_authorization(errorCallback) &&
            this._localWrapper(
              MonitoringUserQuery.ENTRY_POINT,
              MonitoringUserQuery.HTTP_METHOD,
              monitoringUserQuery,
              successCallback,
              errorCallback
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
        ihr_NumberToAsOrIxp(asn) {
          if (asn == 0) {
            return "unknown";
          }
          return (asn < 0 ? "IXP" : "AS") + Math.abs(asn);
        },
        ihr_AsOrIxpToNumber(asnString) {
          if (asnString == 0) {
            return 0;
          }
          let routePieces = asnString.match(/[0-9]+$/);
          let asNumber = Number(routePieces[0]);
          return asnString.startsWith("IXP") ? -asNumber : asNumber;
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
  MonitoringUserQuery,
  NetworkDelayQuery,
  NetworkDelayLocation
};
