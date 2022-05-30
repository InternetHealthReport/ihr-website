/** @file ihr-api.js
 *  @brief Vue-js plugin wrapping IHR API
 */

import axios from 'axios'
import {
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
  DelayAlarmsQuery,
  ForwardingAlarmsQuery,
  NetworkDelayQuery,
  NetworkDelayAlarmsQuery,
  NetworkDelayLocation,
  MetisAtlasSelectionQuery,
  MetisAtlasDeploymentQuery,
} from './query/IhrQuery'
import { MonitoringUserQuery } from './query/IhrUserQuery'

// Const section

/// Base url for api
const IHR_API_BASE = 'https://ihr.iijlab.net/ihr/api/'
/// Default timeout before api call are considered failed
const DEFAULT_TIMEOUT = 180000
/// Data of the first available data
const PROJECT_START_DATE = new Date('2016-01-01T00:00:00')
/// Default expire date of cookies
const COOKIE_DURATION = 1 * 24 * 60 * 60 * 1000 //TODO synch with server

// Internal function section

/**
 * Function to create/destroy cookie to avoid other dipendecies.
 *
 * this function create a cookie *name* with value *value*, it automatically
 * set its duration to *COOKIE_DURATION*. If *value* is null delete the cookie.
 * It overwrite the prexisting cokkie without warning.
 *
 * @param {String} name name of the cookie.
 * @param value if is null delete the cookie *name*, otherwise is the value of the coockie *name*.
 */
function createCookie(name, value) {
  let date = new Date()
  date.setTime(date.getTime() + (value != null ? COOKIE_DURATION : -100))
  document.cookie = `${name}=${value}; expires=${date.toGMTString()}; path=/`
}
/**
 * Function to obtain the value of the cookie as string.
 *
 * if the coockie is not present it return null.
 *
 * @param {String} name name of the coockie.
 */
function readCookie(name) {
  let regexp = new RegExp(`(?:^${name}| ${name})=([^;]+)`)
  let res = document.cookie.match(regexp)
  if (res === null || res.length === 0) {
    return null
  }
  return res[1]
}

// Actual plugin.

/**
 * ihr_api plugin.
 */
const IhrApi = {
  install(Vue) {
    let ihr_api = new Vue({
      /**
       * Internal data of the plugin.
       *
       * **user** will contain the part of the email before the '@'.
       *
       * **axios_base** will contain the axios object to make the query call. It change
       * when the user login.
       *
       * **headers** contain request headers to feede axios constructor.
       */
      data() {
        return {
          user: null,
          axios_base: null,
          headers: {},
        }
      },
      created() {
        //if user is alread logged verify the token
        !this._get_user() || this.userVerifyToken()
      },
      computed: {
        /**
         * Use this to check if the user is autheticated
         *
         * it can be used into templates.
         *
         * @return {Boolean}
         */
        authenticated() {
          return this.user !== null
        },
      },
      methods: {
        /**
         * @internal
         * @brief save/delete user.
         *
         * used for delete using with a parameter setted to null, or
         * to safe a user specifing both parameters.
         *
         * @parameter {String} email email of the user it is not stored but used
         * to calculate a user name.
         *
         * @parameter {String} json token returned by API.
         * @endinternal
         */
        _save_user(email, token) {
          if (email === null || token === null) {
            this.user = null
            delete this.headers['Authorization']
            createCookie('user', null)
            createCookie('token', null)
          } else {
            this.user = email.split('@')[0]
            this.headers['Authorization'] = `Token ${token}`
            createCookie('user', this.user)
            createCookie('token', token)
          }
          this._update_base()
        },
        /**
         * @internal
         * @brief get user from cookie, set it and return true if the coockie exists or false otherwise.
         *
         * @return {Boolean} if the user exists true otherwise false.
         * @endinternal
         */
        _get_user() {
          this.user = readCookie('user')
          if (this.user == null) {
            this._update_base()
            return false
          }
          this.headers['Authorization'] = `Token ${readCookie('token')}`
          this._update_base()
          return true
        },
        _update_base() {
          this.axios_base = axios.create({
            baseURL: IHR_API_BASE,
            timeout: DEFAULT_TIMEOUT,
            headers: this.headers,
          })
        },
        _check_authorization(errorCallback) {
          if (!this.authenticated) {
            if (errorCallback instanceof Function)
              errorCallback({
                status: 401,
                data: { datail: 'need to login' },
              })
            return false
          }
          return true
        },

        _resolveAxiosPromise(endpoint, method, query, successCallback, errorCallback) {
          let promise = method === 'get' ? this.axios_base.get(endpoint, { params: query }) : this.axios_base.post(endpoint, query)

          promise
            .then(response => {
              if (successCallback instanceof Function) {
                successCallback(response.data, response)
              }
            })
            .catch(error => {
              console.error('error:', error)
              if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (errorCallback instanceof Function) {
                  errorCallback(error.response)
                }
              } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.error(error.request)
              }
              // Something happened in setting up the request that triggered an Error
              throw Error(error.message)
            })
        },
        /**
         * @brief generic API wrapper
         * @param endpoint end-point name. it will be added to @ref
         *      ihr_api_base
         * @param successCallback <optional>
         *      If is a function will be called with the api result
         *      as parameter.
         * @param errorCallback   <optional>
         *      If is a function will be called with the api error
         *      as parameter.
         */
        _generic: function (endpoint, method, query, successCallback, errorCallback) {
          if (Object.prototype.isPrototypeOf.call(QueryBase, query.constructor)) {
            console.log('call to:', query, query.toString())
            console.log('query url:', this.getUrl(query))
            let resolvePagination = query.resolvePagination
            query = query.get_filter()
            if (resolvePagination && successCallback instanceof Function) {
              let singleSuccess = successCallback
              let recursiveSuccess = (data, response) => {
                singleSuccess(data, response)
                if (data.next != null) {
                  console.log(data.next)
                  this._resolveAxiosPromise(data.next, method, '', recursiveSuccess, errorCallback)
                }
              }
              successCallback = recursiveSuccess
            }
          } else {
            console.log('call with non Query object:', JSON.stringify(query), endpoint, method)
          }

          this._resolveAxiosPromise(endpoint, method, query, successCallback, errorCallback)
        },

        getUrl(queryFilter) {
          if (queryFilter == null) {
            return ''
          }
          return IHR_API_BASE + queryFilter.toUrl()
        },
        /**
         * @brief delay endpoint wrapper see @ref _generic()
         */
        delay(delayQuery, successCallback, errorCallback) {
          this._generic(DelayQuery.ENTRY_POINT, DelayQuery.HTTP_METHOD, delayQuery, successCallback, errorCallback)
        },
        delay_alarms(delayAlarmsQuery, successCallback, errorCallback) {
          this._generic(DelayAlarmsQuery.ENTRY_POINT, DelayAlarmsQuery.HTTP_METHOD, delayAlarmsQuery, successCallback, errorCallback)
        },
        disco_events(discoEventQuery, successCallback, errorCallback) {
          this._generic(DiscoEventQuery.ENTRY_POINT, DiscoEventQuery.HTTP_METHOD, discoEventQuery, successCallback, errorCallback)
        },
        disco_probes(discoProbesQuery, successCallback, errorCallback) {
          this._generic(DiscoProbesQuery.ENTRY_POINT, DiscoProbesQuery.HTTP_METHOD, discoProbesQuery, successCallback, errorCallback)
        },
        forwarding(forwardingQuery, successCallback, errorCallback) {
          this._generic(ForwardingQuery.ENTRY_POINT, ForwardingQuery.HTTP_METHOD, forwardingQuery, successCallback, errorCallback)
        },
        forwarding_alarms(forwardingAlarmsQuery, successCallback, errorCallback) {
          this._generic(
            ForwardingAlarmsQuery.ENTRY_POINT,
            ForwardingAlarmsQuery.HTTP_METHOD,
            forwardingAlarmsQuery,
            successCallback,
            errorCallback
          )
        },
        hegemony(hegemonyQuery, successCallback, errorCallback) {
          this._generic(HegemonyQuery.ENTRY_POINT, HegemonyQuery.HTTP_METHOD, hegemonyQuery, successCallback, errorCallback)
        },
        hegemony_country(hegemonyCountryQuery, successCallback, errorCallback) {
          this._generic(
            HegemonyCountryQuery.ENTRY_POINT,
            HegemonyCountryQuery.HTTP_METHOD,
            hegemonyCountryQuery,
            successCallback,
            errorCallback
          )
        },
        hegemony_prefix(hegemonyPrefixQuery, successCallback, errorCallback) {
          this._generic(
            HegemonyPrefixQuery.ENTRY_POINT,
            HegemonyPrefixQuery.HTTP_METHOD,
            hegemonyPrefixQuery,
            successCallback,
            errorCallback
          )
        },
        hegemony_cone(hegemonyConeQuery, successCallback, errorCallback) {
          this._generic(HegemonyConeQuery.ENTRY_POINT, HegemonyConeQuery.HTTP_METHOD, hegemonyConeQuery, successCallback, errorCallback)
        },
        network(networkQuery, successCallback, errorCallback) {
          this._generic(NetworkQuery.ENTRY_POINT, NetworkQuery.HTTP_METHOD, networkQuery, successCallback, errorCallback)
        },
        country(countryQuery, successCallback, errorCallback) {
          this._generic(CountryQuery.ENTRY_POINT, CountryQuery.HTTP_METHOD, countryQuery, successCallback, errorCallback)
        },
        network_delay(networkDelayQuery, successCallback, errorCallback) {
          this._generic(NetworkDelayQuery.ENTRY_POINT, NetworkDelayQuery.HTTP_METHOD, networkDelayQuery, successCallback, errorCallback)
        },
        hegemony_alarms(hegemonyAlarmsQuery, successCallback, errorCallback) {
          this._generic(
            HegemonyAlarmsQuery.ENTRY_POINT,
            HegemonyAlarmsQuery.HTTP_METHOD,
            hegemonyAlarmsQuery,
            successCallback,
            errorCallback
          )
        },
        network_delay_alarms(networkDelayAlarmsQuery, successCallback, errorCallback) {
          this._generic(
            NetworkDelayAlarmsQuery.ENTRY_POINT,
            NetworkDelayAlarmsQuery.HTTP_METHOD,
            networkDelayAlarmsQuery,
            successCallback,
            errorCallback
          )
        },
        network_delay_location(networkDelayLocation, successCallback, errorCallback) {
          this._generic(
            NetworkDelayLocation.ENTRY_POINT,
            NetworkDelayLocation.HTTP_METHOD,
            networkDelayLocation,
            successCallback,
            errorCallback
          )
        },
        metisAtlasSelection(metisAtlasSelectionQuery, successCallback, errorCallback) {
          this._generic(
            MetisAtlasSelectionQuery.ENTRY_POINT,
            MetisAtlasSelectionQuery.HTTP_METHOD,
            metisAtlasSelectionQuery,
            successCallback,
            errorCallback
          )
        },
        metisAtlasDeployment(metisAtlasDeploymentQuery, successCallback, errorCallback) {
          this._generic(
            MetisAtlasDeploymentQuery.ENTRY_POINT,
            MetisAtlasDeploymentQuery.HTTP_METHOD,
            metisAtlasDeploymentQuery,
            successCallback,
            errorCallback
          )
        },

        // User management section
        userSignIn(email, password, recaptcha, successCallback, errorCallback) {
          this._generic('user/sign_in/', 'post', { email: email, password: password, recaptcha: recaptcha }, successCallback, errorCallback)
        },
        userValidate(email, password, token, successCallback, errorCallback) {
          this._generic(
            'user/validate/',
            'post',
            { email: email, password: password, token: token },
            result => {
              this._save_user(email, result.token)
              if (successCallback instanceof Function) successCallback(result)
            },
            errorCallback
          )
        },
        userSignOut(successCallback, errorCallback) {
          this._check_authorization(errorCallback) &&
            this._generic(
              'user/sign_out/',
              'post',
              {},
              result => {
                this._save_user(null)
                if (successCallback instanceof Function) successCallback(result)
              },
              errorCallback
            )
        },
        userLogin(email, password, successCallback, errorCallback) {
          this._generic(
            'user/login/',
            'post',
            { email: email, password: password },
            result => {
              this._save_user(email, result.token)
              if (successCallback instanceof Function) successCallback(result)
            },
            errorCallback
          )
        },
        userLogout(successCallback, errorCallback) {
          this._check_authorization(errorCallback) &&
            this._generic(
              'user/logout/',
              'post',
              {},
              result => {
                this._save_user(null)
                if (successCallback instanceof Function) successCallback(result)
              },
              errorCallback
            )
        },
        userResetPasswordRequest(email, recaptcha, successCallback, errorCallback) {
          this._generic(
            'user/request_reset_password/',
            'post',
            { email: email, recaptcha: recaptcha },
            result => {
              successCallback(result)
            },
            errorCallback
          )
        },
        userResetPassword(email, password, token, successCallback, errorCallback) {
          this._generic(
            'user/reset_password/',
            'post',
            { email: email, password: password, token: token },
            result => {
              this._save_user(email, result.token)
              if (successCallback instanceof Function) successCallback(result)
            },
            errorCallback
          )
        },
        userVerifyToken: async function () {
          try {
            await this.axios_base.get('user/verify_token/')
            return true
          } catch (err) {
            this._save_user(null)
          }
          return false
        },
        /**
         * Change user credential
         * @param {Dict} userChange not null but you can specify email, password or both
         */
        userChangeCredentials(userChange, successCallback, errorCallback) {
          if (Object.keys(userChange).length == 0) {
            throw Error('invalid number of parameters!')
          }
          this._check_authorization(errorCallback) &&
            this._generic('user/change_credentials/', 'post', { ...userChange }, successCallback, errorCallback)
        },
        userChangeEmail(email, password, token, successCallback, errorCallback) {
          this._generic(
            'user/change_email/',
            'post',
            { email: email, password: password, token: token },
            result => {
              this._save_user(email, result.token)
              if (successCallback instanceof Function) successCallback(result)
            },
            errorCallback
          )
        },
        userShow(successCallback, errorCallback) {
          this._check_authorization(errorCallback) && this._generic('user/show/', 'post', {}, successCallback, errorCallback)
        },
        userAddMonitoring(monitoringUserQuery, successCallback, errorCallback) {
          this._check_authorization(errorCallback) &&
            this._generic(
              MonitoringUserQuery.ENTRY_POINT,
              MonitoringUserQuery.HTTP_METHOD,
              monitoringUserQuery,
              successCallback,
              errorCallback
            )
        },
      },
    })

    Vue.mixin({
      beforeCreate() {
        this.$ihr_api = ihr_api
      },
      filters: {
        // utilities
        readableType(type) {
          if (type == 'CT') {
            return 'City'
          } else if (type == 'PB') {
            return 'Probe'
          } else {
            return type
          }
        },
        ihr_NumberToAsOrIxp(asn) {
          if (asn == 0) {
            return 'unknown'
          }
          return (asn < 0 ? 'IXP' : 'AS') + Math.abs(asn)
        },
        ihr_AsOrIxpToNumber(asnString) {
          if (asnString == null) {
            return null
          }
          if (asnString == 0) {
            return 0
          }
          let routePieces = asnString.match(/[0-9]+$/)
          let asNumber = Number(routePieces[0])
          return asnString.startsWith('IXP') ? -asNumber : asNumber
        },
        sortedKeys(val) {
          return Object.keys(val).sort(function (a, b) {
            return val[b] - val[a]
          })
        },
      },
    })
  },
}

export {
  AS_FAMILY,
  PROJECT_START_DATE,
  IhrApi,
  Query,
  NetworkQuery,
  CountryQuery,
  DiscoEventQuery,
  DiscoProbesQuery,
  HegemonyQuery,
  HegemonyCountryQuery,
  HegemonyPrefixQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery,
  MonitoringUserQuery,
  NetworkDelayQuery,
  NetworkDelayAlarmsQuery,
  HegemonyAlarmsQuery,
  NetworkDelayLocation,
  MetisAtlasSelectionQuery,
  MetisAtlasDeploymentQuery,
}
