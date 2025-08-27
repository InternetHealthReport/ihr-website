import axios from 'axios'
import {
  AS_FAMILY,
  QueryBase,
  Query,
  MetisAtlasSelectionQuery,
  MetisAtlasDeploymentQuery,
  DiscoEventQuery,
  HegemonyPrefixQuery,
  NetworkDelayQuery,
  NetworkDelayLocation,
  NetworkQuery,
  CountryQuery,
  HegemonyQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery,
  HegemonyCountryQuery,
  NetworkDelayAlarmsQuery,
  HegemonyAlarmsQuery
} from './query/IhrQuery'

/// Base url for api
const IHR_API_BASE = 'https://www.ihr.live/ihr/api/'
/// Default timeout before api call are considered failed
const DEFAULT_TIMEOUT = 180000
/// Data of the first available data
const PROJECT_START_DATE = new Date('2016-01-01T00:00:00')

const IhrApi = {
  install: (app, options) => {
    const axios_base = axios.create({
      baseURL: IHR_API_BASE,
      timeout: DEFAULT_TIMEOUT
    })

    const _resolveAxiosPromise = (endpoint, query, successCallback, errorCallback) => {
      axios_base
        .get(endpoint, { params: query })
        .then((res) => {
          if (res.headers['content-type'] === 'application/json') {
            if (successCallback instanceof Function) {
              successCallback(res.data, res)
            }
          }
        })
        .catch((error) => {
          console.error('error:', error)
          if (error.response) {
            if (errorCallback instanceof Function) {
              errorCallback(error.response)
            }
          } else if (error.request) {
            console.error(error.response)
          }
          throw Error(error.message)
        })
    }

    const _generic = (endpoint, query, successCallback, errorCallback) => {
      if (Object.prototype.isPrototypeOf.call(QueryBase, query.constructor)) {
        query = query.get_filter()

        if (successCallback instanceof Function) {
          const allResults = []

          const recursiveSuccess = (data, response) => {
            if (Array.isArray(data.results)) {
              allResults.push(...data.results)
            }

            if (data.next != null) {
              const nextUrl = data.next.replace(IHR_API_BASE, '')
              _resolveAxiosPromise(nextUrl, null, recursiveSuccess, errorCallback)
            } else {
              // Final page — call the original successCallback once
              const finalData = {
                ...data,
                results: allResults,
                next: null,
                previous: null,
                count: allResults.length
              }
              successCallback(finalData, response)
            }
          }

          _resolveAxiosPromise(endpoint, query, recursiveSuccess, errorCallback)
        }
      }
    }

    const getUrl = (queryFilter) => {
      if (queryFilter == null) {
        return ''
      }
      return IHR_API_BASE + queryFilter.toUrl()
    }

    const readableType = (type) => {
      if (type == 'CT') {
        return 'City'
      } else if (type == 'PB') {
        return 'Probe'
      } else {
        return type
      }
    }

    const ihr_NumberToAsOrIxp = (asn) => {
      if (asn == 0) {
        return 'unknown'
      }
      return (asn < 0 ? 'IXP' : 'AS') + Math.abs(asn)
    }

    const ihr_AsOrIxpToNumber = (asnString) => {
      if (asnString == null) {
        return null
      }
      if (asnString == 0) {
        return 0
      }
      const routePieces = asnString.match(/[0-9]+$/)
      const asNumber = Number(routePieces[0])
      return asnString.startsWith('IX') ? -asNumber : asNumber
    }

    const sortedKeys = (val) => {
      return Object.keys(val).sort(function (a, b) {
        return val[b] - val[a]
      })
    }

    const metisAtlasSelection = (metisAtlasSelectionQuery, successCallback, errorCallback) => {
      _generic(
        MetisAtlasSelectionQuery.ENTRY_POINT,
        metisAtlasSelectionQuery,
        successCallback,
        errorCallback
      )
    }

    const metisAtlasDeployment = (metisAtlasDeploymentQuery, successCallback, errorCallback) => {
      _generic(
        MetisAtlasDeploymentQuery.ENTRY_POINT,
        metisAtlasDeploymentQuery,
        successCallback,
        errorCallback
      )
    }

    const hegemony_prefix = (hegemonyPrefixQuery, successCallback, errorCallback) => {
      _generic(HegemonyPrefixQuery.ENTRY_POINT, hegemonyPrefixQuery, successCallback, errorCallback)
    }

    const network_delay = (networkDelayQuery, successCallback, errorCallback) => {
      _generic(NetworkDelayQuery.ENTRY_POINT, networkDelayQuery, successCallback, errorCallback)
    }

    const network = (networkQuery, successCallback, errorCallback) => {
      _generic(NetworkQuery.ENTRY_POINT, networkQuery, successCallback, errorCallback)
    }

    const network_delay_location = (networkDelayLocation, successCallback, errorCallback) => {
      _generic(
        NetworkDelayLocation.ENTRY_POINT,
        networkDelayLocation,
        successCallback,
        errorCallback
      )
    }

    const country = (countryQuery, successCallback, errorCallback) => {
      _generic(CountryQuery.ENTRY_POINT, countryQuery, successCallback, errorCallback)
    }

    const hegemony = (hegemonyQuery, successCallback, errorCallback) => {
      _generic(HegemonyQuery.ENTRY_POINT, hegemonyQuery, successCallback, errorCallback)
    }

    const hegemony_cone = (hegemonyConeQuery, successCallback, errorCallback) => {
      _generic(HegemonyConeQuery.ENTRY_POINT, hegemonyConeQuery, successCallback, errorCallback)
    }

    const delay_alarms = (delayAlarmsQuery, successCallback, errorCallback) => {
      _generic(DelayAlarmsQuery.ENTRY_POINT, delayAlarmsQuery, successCallback, errorCallback)
    }

    const forwarding_alarms = (forwardingAlarmsQuery, successCallback, errorCallback) => {
      _generic(
        ForwardingAlarmsQuery.ENTRY_POINT,
        forwardingAlarmsQuery,
        successCallback,
        errorCallback
      )
    }

    const forwarding = (forwardingQuery, successCallback, errorCallback) => {
      _generic(ForwardingQuery.ENTRY_POINT, forwardingQuery, successCallback, errorCallback)
    }

    const delay = (delayQuery, successCallback, errorCallback) => {
      _generic(DelayQuery.ENTRY_POINT, delayQuery, successCallback, errorCallback)
    }

    const disco_events = (discoEventQuery, successCallback, errorCallback) => {
      _generic(DiscoEventQuery.ENTRY_POINT, discoEventQuery, successCallback, errorCallback)
    }

    const hegemony_country = (hegemonyCountryQuery, successCallback, errorCallback) => {
      _generic(
        HegemonyCountryQuery.ENTRY_POINT,
        hegemonyCountryQuery,
        successCallback,
        errorCallback
      )
    }

    const network_delay_alarms = (networkDelayAlarmsQuery, successCallback, errorCallback) => {
      _generic(
        NetworkDelayAlarmsQuery.ENTRY_POINT,
        networkDelayAlarmsQuery,
        successCallback,
        errorCallback
      )
    }

    const hegemony_alarms = (hegemonyAlarmsQuery, successCallback, errorCallback) => {
      _generic(HegemonyAlarmsQuery.ENTRY_POINT, hegemonyAlarmsQuery, successCallback, errorCallback)
    }

    const ihr_api = {
      getUrl,
      readableType,
      ihr_NumberToAsOrIxp,
      ihr_AsOrIxpToNumber,
      sortedKeys,
      metisAtlasSelection,
      metisAtlasDeployment,
      hegemony_prefix,
      network_delay,
      network,
      network_delay_location,
      country,
      hegemony,
      hegemony_cone,
      delay_alarms,
      forwarding_alarms,
      forwarding,
      delay,
      disco_events,
      hegemony_country,
      network_delay_alarms,
      hegemony_alarms
    }
    app.provide('ihr_api', ihr_api)
  }
}

export {
  AS_FAMILY,
  PROJECT_START_DATE,
  IhrApi,
  Query,
  MetisAtlasSelectionQuery,
  MetisAtlasDeploymentQuery,
  DiscoEventQuery,
  HegemonyPrefixQuery,
  NetworkDelayQuery,
  NetworkDelayLocation,
  NetworkQuery,
  CountryQuery,
  HegemonyQuery,
  HegemonyConeQuery,
  ForwardingQuery,
  DelayQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery,
  HegemonyCountryQuery,
  NetworkDelayAlarmsQuery,
  HegemonyAlarmsQuery
}
