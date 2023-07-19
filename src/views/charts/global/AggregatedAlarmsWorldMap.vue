<template>
  <div class="IHR_chart">
    <aggregated-alarms-world-map-reactive :chart="chart" :loading="loading" @plotly-click="plotlyClickedData = $event" />
  </div>
</template>

<script>
import CommonChartMixin from '../CommonChartMixin'
import AggregatedAlarmsWorldMapReactive from './AggregatedAlarmsWorldMapReactive.vue'
import { NetworkQuery } from '@/plugins/IhrApi'
import getCountryISOCode3 from '@/plugins/countryISOCode3.js'
import getCountryName from '@/plugins/countryName.js'
import axios from 'axios'

export default {
  mixins: [CommonChartMixin],
  components: {
    AggregatedAlarmsWorldMapReactive,
  },
  props: {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    dateTimeFilter: {
      type: Object,
      required: false,
      default: () => {
        return {
          startDateTime: null,
          endDateTime: null,
        }
      },
    },
    alarmTypesFilter: {
      type: Object,
      required: false,
      default: () => {
        return {
          hegemony: true,
          network_delay: true,
        }
      }
    },
    alarmDataSourcesFilter: {
      type: Object,
      required: false,
      default: () => { }
    },
    resetTimeFlag: {
      type: Boolean,
      required: false,
      default: false,
    },
    resetGranularityFlag: {
      type: Boolean,
      required: false,
      default: false,
    },
    networkDelayAlarms: {
      type: Array,
      required: true,
      default: () => []
    },
    hegemonyAlarms: {
      type: Array,
      required: true,
      default: () => []
    },
    loading: {
      type: Boolean,
      required: true,
    }
  },
  emits: {
    'country-click': function (countryIsoCode3Clicked) {
      if (countryIsoCode3Clicked) {
        return true;
      } else {
        return false;
      }
    },
  },

  data() {
    let chart = {
      uuid: 'world-map',
      traces: [
        {
          type: 'choropleth',
          locations: [],
          z: [],
          text: [],
          name: '',
          customdata: [],
          hovertemplate: '',
          colorscale: 'Viridis',
          showscale: true,
          marker: {
            line: {
              color: 'rgb(255,255,255)',
              width: 1,
            },
          },
          hoverlabel: {
            bgcolor: 'white',
          },
          colorbar: {
            title: 'Alarm Counts',
            len: 0.9,
          }
        },
      ],
      layout: {
        hovermode: 'closest',
        margin: { t: 80, b: 10, l: 80, r: 80 },
        title: 'Aggregated Alarm Counts across Countries',
        geo: {
          showframe: false,
          showcoastlines: false,
          showland: true,
          landcolor: 'rgb(215, 215, 215)',
          countrycolor: 'rgb(235, 235, 235)',
          showcountries: true,
        },
      },
    }


    return {
      chart: chart,
      alarms: [],
      gripAlarms: { downloading: false, data: null },
      plotlyClickedData: null,
      gripAlarmsToggled: false,
      startDate: this.formatTime(this.startTime),
      endDate: this.formatTime(this.endTime),
      minStartDate: this.formatTime(this.startTime),
      maxEndDate: this.formatTime(this.endTime),
      timeFilteredAlarms: [],
    }
  },
  computed: {
    alarmCounts() {
      let alarmCountsDict = {}
      for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
        if (isSelected) {
          alarmCountsDict[alarmType + '_alarm_counts'] = alarmType + '_alarm_counts'
        }
      }
      return alarmCountsDict
    }
  },
  watch: {
    plotlyClickedData: {
      handler: function (newPlotlyClickedData) {
        if (newPlotlyClickedData) {
          let countryIsoCode3Clicked = newPlotlyClickedData.points[0].location
          this.$emit('country-click', countryIsoCode3Clicked)
        }
      }
    },
    timeFilteredAlarms: {
      handler: function (newTimeFilteredAlarms) {
        if (newTimeFilteredAlarms) {
          this.loadAndDisplayWorldMap(newTimeFilteredAlarms, this.alarmCounts)
        }
      },
    },
    dateTimeFilter: {
      handler: function (newDateTimeFilter) {
        if (newDateTimeFilter) {
          this.filterAlarmsByTime(newDateTimeFilter.startDateTime, newDateTimeFilter.endDateTime)
        }
      }
    },
    resetTimeFlag: {
      handler: function (newResetTimeFlag) {
        if (newResetTimeFlag) {
          this.resetWorldMap(this.alarms, this.alarmCounts)
        }
      }
    },
    alarmTypesFilter: {
      handler: function () {
        this.apiCall()
      },
      deep: true,
    },
    alarmDataSourcesFilter: {
      handler: function () {
        this.apiCall()
      },
      deep: true
    },
  },
  methods: {
    resetWorldMap(alarms, alarmCounts) {
      this.loadAndDisplayWorldMap(alarms, alarmCounts)
      this.$emit('aggregated-alarms-data-loaded', alarms)
    },

    filterAlarmsByTime(startDateTime, endDateTime) {
      this.timeFilteredAlarms = this.deepCopy(this.alarms).map(alarm => {
        if (this.alarmTypesFilter.hegemony) {
          alarm.hegemony_alarm_timebins = alarm.hegemony_alarm_timebins.filter((timebin) => {
            return timebin >= startDateTime && timebin <= endDateTime
          })
        }

        if (this.alarmTypesFilter.network_delay) {
          alarm.network_delay_alarm_timebins = alarm.network_delay_alarm_timebins.filter((timebin) => {
            return timebin >= startDateTime && timebin <= endDateTime
          })
        }

        if (this.alarmTypesFilter.moas) {
          alarm.moas_alarm_timebins = alarm.moas_alarm_timebins.filter((timebin) => {
            return timebin >= startDateTime && timebin <= endDateTime
          })
        }

        if (this.alarmTypesFilter.submoas) {
          alarm.submoas_alarm_timebins = alarm.submoas_alarm_timebins.filter((timebin) => {
            return timebin >= startDateTime && timebin <= endDateTime
          })
        }

        if (this.alarmTypesFilter.defcon) {
          alarm.defcon_alarm_timebins = alarm.defcon_alarm_timebins.filter((timebin) => {
            return timebin >= startDateTime && timebin <= endDateTime
          })
        }

        if (this.alarmTypesFilter.edges) {
          alarm.edges_alarm_timebins = alarm.edges_alarm_timebins.filter((timebin) => {
            return timebin >= startDateTime && timebin <= endDateTime
          })
        }

        let allTimebinsEmpty;

        if (this.alarmTypesFilter.hegmeony) {
          allTimebinsEmpty = alarm.hegemony_alarm_timebins.length === 0
        }

        if (this.alarmTypesFilter.network_delay) {
          allTimebinsEmpty = allTimebinsEmpty && alarm.network_delay_alarm_timebins.length === 0
        }

        if (this.alarmTypesFilter.moas) {
          allTimebinsEmpty = allTimebinsEmpty && alarm.moas_alarm_timebins.length === 0
        }

        if (this.alarmTypesFilter.submaos) {
          allTimebinsEmpty = allTimebinsEmpty && alarm.submoas_alarm_timebins.length === 0
        }

        if (this.alarmTypesFilter.defcon) {
          allTimebinsEmpty = allTimebinsEmpty && alarm.defcon_alarm_timebins.length === 0
        }

        if (this.alarmTypesFilter.edges) {
          allTimebinsEmpty = allTimebinsEmpty && alarm.edges_alarm_timebins.length === 0
        }

        if (allTimebinsEmpty) {
          return null
        } else {
          if (this.alarmTypesFilter.hegemony) {
            alarm.hegemony_alarm_counts = Array(alarm.hegemony_alarm_timebins.length).fill(1)
          }

          if (this.alarmTypesFilter.network_delay) {
            alarm.network_delay_alarm_counts = Array(alarm.network_delay_alarm_timebins.length).fill(1)
          }

          if (this.alarmTypesFilter.moas) {
            alarm.moas_alarm_counts = Array(alarm.moas_alarm_timebins.length).fill(1)
          }

          if (this.alarmTypesFilter.submoas) {
            alarm.submoas_alarm_counts = Array(alarm.submoas_alarm_timebins.length).fill(1)
          }

          if (this.alarmTypesFilter.defcon) {
            alarm.defcon_alarm_counts = Array(alarm.defcon_alarm_timebins.length).fill(1)
          }

          if (this.alarmTypesFilter.edges) {
            alarm.edges_alarm_counts = Array(alarm.edges_alarm_timebins.length).fill(1)
          }

          return alarm
        }
      })
      this.timeFilteredAlarms = this.timeFilteredAlarms.filter(alarm => alarm !== null)
      this.$emit('aggregated-alarms-data-loaded', this.timeFilteredAlarms)
    },

    deepCopy(obj) {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }

      const copy = Array.isArray(obj) ? [] : {};

      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = this.deepCopy(obj[key]);
        }
      }

      return copy;
    },

    apiCall() {
      this.$emit('loading', true)
      if (this.networkDelayAlarms.length && this.hegemonyAlarms.length && Object.values(this.alarmDataSourcesFilter).includes(true)) {
        this.etlAlarms().then(() => {
          this.$emit('loading', false)
        }).catch(error => {
          console.error(error)
        })
      } else if (!Object.values(this.alarmDataSourcesFilter).includes(true)) {
        this.clearWorldMap()
        this.$emit('aggregated-alarms-data-loaded', [])
        this.$emit('loading', false)
      }
    },

    etlAlarms() {
      return new Promise((resolve, reject) => {
        if (this.alarmDataSourcesFilter.grip) {
          this.extractAlarms().then((extractedAlarms) => {
            this.transformAlarms(this.networkDelayAlarms, this.hegemonyAlarms, extractedAlarms.gripAlarms).then(() => {
              this.loadAndDisplayWorldMap(this.alarms, this.alarmCounts)
              resolve()
            })
              .catch(error => {
                reject(error)
              })

          })
        } else {
          this.transformAlarms(this.networkDelayAlarms, this.hegemonyAlarms).then(() => {
            this.loadAndDisplayWorldMap(this.alarms, this.alarmCounts)
            resolve()
          })
            .catch(error => {
              reject(error)
            })
        }
      })
    },

    extractAlarms() {
      const request = () => {
        return new Promise((resolve, reject) => {
          if (this.alarmDataSourcesFilter.grip && !this.gripAlarms.data && !this.gripAlarms.downloading) {
            this.gripAlarms.downloading = true
            this.getGRIPAlarms().then((gripAlarms) => {
              this.gripAlarms.downloading = false
              this.gripAlarms.data = gripAlarms
              resolve({ gripAlarms })
            })
              .catch(error => {
                reject(error)
              })
          } else if (this.alarmDataSourcesFilter.grip && this.gripAlarms.data) {
            resolve({ gripAlarms: this.gripAlarms.data })
          }
        })

      }
      return request()
    },

    transformAlarms(networkDelayAlarms, hegemonyAlarms, gripAlarms = []) {
      const request = () => {
        return new Promise((resolve, reject) => {
          const hegemonyNetDelayAlarms = this.transformIHRAlarms(networkDelayAlarms, hegemonyAlarms)
          if (this.alarmDataSourcesFilter.grip) {
            const gripAlarmsTransformed = this.transformGRIPAlarms(gripAlarms)
            const alarms = this.fullOuterJoinGRIPAlarms(hegemonyNetDelayAlarms, gripAlarmsTransformed)
            this.transformAlarmsHelper(alarms).then(() => {
              resolve()
            }).catch(error => {
              reject(error)
            })
          } else {
            this.transformAlarmsHelper(hegemonyNetDelayAlarms).then(() => {
              resolve()
            }).catch(error => {
              reject(error)
            })
          }
        })
      }
      return request()
    },

    loadAndDisplayWorldMap(alarms, alarmCounts) {
      const totalAlarmsByCountry = this.groupTotalAlarmCountsByCountry(alarms)
      this.addTotalAlarmCountsColumn(totalAlarmsByCountry)
      const plotlyData = this.getPlotlyData(totalAlarmsByCountry)
      const customHoverData = alarms.length ? this.getZippedCustomHoverData(Object.values(alarmCounts), plotlyData) : []
      this.updateChart(plotlyData, customHoverData);
    },

    getGRIPAlarms() {
      const apiURL = 'https://api.grip.inetintel.cc.gatech.edu/json/events';
      const chunkSize = 100;

      const params = {
        length: chunkSize,
        start: 0,
        // ts_start: '2023-07-01 14:45:00',
        // ts_end: '2023-07-01 15:45:00',
        ts_start: this.formatTime(this.startTime),
        ts_end: this.formatTime(this.endTime),
        min_susp: 80,
        max_susp: chunkSize,
        event_type: 'all'
      };

      const request = () => {
        return axios.get(apiURL, { params })
          .then(handleResponse)
          .catch(handleError);
      };

      const handleResponse = (response) => {
        const data = response.data;
        const totalRecords = parseInt(data.recordsTotal);
        const bgpAlertsData = [];
        const getPageDataPromises = createGetPageDataPromises(totalRecords, bgpAlertsData, params);

        return Promise.all(getPageDataPromises)
          .then(() => {
            return bgpAlertsData;
          }).catch(error => {
            reject(error)
          });
      };

      const createGetPageDataPromises = (totalRecords, bgpAlertsData, params) => {
        const getPageDataPromises = [];

        for (let i = 0; i < totalRecords; i += 100) {
          params.start = i;
          const getPromise = getPageData(apiURL, params)
            .then(pageData => {
              bgpAlertsData.push(...pageData);
              return delay(0.5);
            })
            .catch(_ => {
              console.log('Error getting page data, retrying...');
              return delay(1000);
            });

          getPageDataPromises.push(getPromise);
        }

        return getPageDataPromises;
      };

      const getPageData = (url, params) => {
        return axios.get(url, { params })
          .then(response => response.data.data);
      };

      const handleError = (error) => {
        throw error;
      };

      const delay = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      };

      return request();
    },

    formatTime(date) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      return formattedDate;
    },

    transformGRIPAlarms(gripAlarms) {
      const gripAlarmsTransformed = this.filterAndGetGripAlarms(gripAlarms);
      const gripAlarmsAggregated = this.aggregateGripAlarms(gripAlarmsTransformed);
      return gripAlarmsAggregated;
    },

    filterAndGetGripAlarms(gripAlarms) {
      const gripAlarmsTransformed = gripAlarms.reduce((acc, curr) => {
        const trWorthy = curr.summary.tr_worthy;

        if (trWorthy === true) {
          curr.summary.victims.forEach((victim) => {
            const asnInfo = curr.asinfo[victim]
            const asn_name = asnInfo && asnInfo.asrank && asnInfo.asrank.organization ? asnInfo.asrank.asnName.trim() + `, ${asnInfo.asrank.organization.country.iso}` : victim

            let bgpAlertAlarm = {
              asn_name,
              asn: victim,
              timebin: new Date(curr.last_modified_ts * 1000),
              event_type: curr.event_type,
            };

            acc.push(bgpAlertAlarm);
          });
        }

        return acc;
      }, []);
      return gripAlarmsTransformed;
    },

    aggregateGripAlarms(gripAlarmsTransformed) {
      const aggregatedAlarms = gripAlarmsTransformed.reduce((acc, curr) => {
        const { asn, asn_name, event_type } = curr;

        if (!acc[asn]) {
          acc[asn] = {
            asn_name,
            asn,
            moas_alarm_counts: [],
            submoas_alarm_counts: [],
            edges_alarm_counts: [],
            defcon_alarm_counts: [],
            moas_alarm_timebins: [],
            submoas_alarm_timebins: [],
            defcon_alarm_timebins: [],
            edges_alarm_timebins: []
          };
        }

        switch (event_type) {
          case 'moas':
            this.updateAlarmData(acc[asn].moas_alarm_counts, acc[asn].moas_alarm_timebins, curr['timebin']);
            break;
          case 'submoas':
            this.updateAlarmData(acc[asn].submoas_alarm_counts, acc[asn].submoas_alarm_timebins, curr['timebin']);
            break;
          case 'defcon':
            this.updateAlarmData(acc[asn].defcon_alarm_counts, acc[asn].defcon_alarm_timebins, curr['timebin']);
            break;
          case 'edges':
            this.updateAlarmData(acc[asn].edges_alarm_counts, acc[asn].edges_alarm_timebins, curr['timebin']);
            break;
          default:
            break;
        }

        return acc;
      }, {});

      return aggregatedAlarms;
    },

    updateAlarmData(alarmCounts, timebins, timebin) {
      alarmCounts.push(1);
      timebins.push(new Date(timebin));
    },

    transformIHRAlarms(networkDelayAlarms, hegemonyAlarms) {
      const netDelayAlarms = this.processNetDelayAlarms(networkDelayAlarms)
      const netDelayAlarmsAggregated = this.aggregateIHRAlarms(netDelayAlarms, this.alarmCounts.network_delay_alarm_counts, 'network_delay_alarm_timebins')
      const hegemonyAlarmsAggregated = this.aggregateIHRAlarms(hegemonyAlarms, this.alarmCounts.hegemony_alarm_counts, 'hegemony_alarm_timebins')
      const hegemonyNetDelayAlarmsMerged = this.fullOuterJoinIHRAlarms(hegemonyAlarmsAggregated, netDelayAlarmsAggregated)
      return hegemonyNetDelayAlarmsMerged
    },

    processNetDelayAlarms(networkDelayAlarms) {
      return networkDelayAlarms
        .filter(alarm => alarm.startpoint_type === 'AS')
        .map(alarm => ({ ...alarm, asn: alarm.startpoint_name, asn_name: alarm.startpoint_name }));
    },

    aggregateIHRAlarms(alarms, alarmCountsAccumlator, timebinsAccumulator) {
      const alarmsAggregated = alarms.reduce((acc, curr) => {
        const asnNumber = curr['asn']
        acc[asnNumber] = acc[asnNumber] || { asn_name: curr['asn_name'], [alarmCountsAccumlator]: [], [timebinsAccumulator]: [] }
        this.updateAlarmData(acc[asnNumber][alarmCountsAccumlator], acc[asnNumber][timebinsAccumulator], curr['timebin'])
        return acc
      }, {})
      return alarmsAggregated
    },

    transformAlarmsHelper(alarms) {
      const request = () => {
        return new Promise((resolve, reject) => {
          this.addASNNameAndCountryIsoCode2(alarms).then(() => {
            this.addCountryIsoCode3AndCountryNameProxy(alarms, 'country_iso_code2')
            const alarmsList = this.addASNNumberToAlarmsAndConvertToArray(alarms)
            const alarmsFiltered = Object.values(alarmsList).filter(alarm => alarm.country_iso_code3)
            this.alarms = alarmsFiltered
            this.$emit('aggregated-alarms-data-loaded', this.alarms)
            resolve()
          }).catch(error => {
            reject(error)
          })
        })
      }
      return request()
    },

    fullOuterJoinIHRAlarms(hegemonyAlarms, netDelayAlarms) {
      const performFullOuterJoin = (hegemonAlarmsInput) => {
        const mergedResult = {};
        for (const asnNumber in hegemonAlarmsInput) {
          if (hegemonAlarmsInput.hasOwnProperty(asnNumber)) {
            const hegemonyAlarmAggregated = hegemonAlarmsInput[asnNumber];
            mergedResult[asnNumber] = { ...hegemonyAlarmAggregated, network_delay_alarm_counts: [], network_delay_alarm_timebins: [] };
          }
        }
        return mergedResult
      }

      const updateResultWithNetDelayAlarms = (result, netDelayAlarmsInput) => {
        for (const asnNumber in netDelayAlarmsInput) {
          if (netDelayAlarmsInput.hasOwnProperty(asnNumber)) {
            const netDelayAlarmAggregated = netDelayAlarmsInput[asnNumber];
            if (result[asnNumber]) {
              result[asnNumber].network_delay_alarm_counts = netDelayAlarmAggregated.network_delay_alarm_counts
              result[asnNumber].network_delay_alarm_timebins = netDelayAlarmAggregated.network_delay_alarm_timebins
            } else {
              result[asnNumber] = { ...netDelayAlarmAggregated, hegemony_alarm_counts: [], hegemony_alarm_timebins: [] }
            }
          }
        }
      }

      let mergedAlarms = performFullOuterJoin(hegemonyAlarms);
      updateResultWithNetDelayAlarms(mergedAlarms, netDelayAlarms);
      return mergedAlarms;
    },

    fullOuterJoinGRIPAlarms(hegemonyNetDelayAlarms, gripAlarms) {
      const performFullOuterJoin = (hegemonyNetDelayAlarmsInput) => {
        const mergedResult = {}
        for (const asnNumber in hegemonyNetDelayAlarmsInput) {
          if (hegemonyNetDelayAlarmsInput.hasOwnProperty(asnNumber)) {
            const entry = hegemonyNetDelayAlarmsInput[asnNumber];
            mergedResult[asnNumber] = {
              ...entry,
              moas_alarm_counts: [],
              submoas_alarm_counts: [],
              defcon_alarm_counts: [],
              edges_alarm_counts: [],
              moas_alarm_timebins: [],
              submoas_alarm_timebins: [],
              defcon_alarm_timebins: [],
              edges_alarm_timebins: [],
            }
          }
        }
        return mergedResult
      }

      const updateResultWithGripAlarms = (result, gripAlarms) => {
        for (const asnNumber in gripAlarms) {
          if (gripAlarms.hasOwnProperty(asnNumber)) {
            const gripAlarmAggregatedEntry = gripAlarms[asnNumber];
            if (result[asnNumber]) {
              result[asnNumber].moas_alarm_counts = gripAlarmAggregatedEntry.moas_alarm_counts
              result[asnNumber].submoas_alarm_counts = gripAlarmAggregatedEntry.submoas_alarm_counts
              result[asnNumber].defcon_alarm_counts = gripAlarmAggregatedEntry.defcon_alarm_counts
              result[asnNumber].edges_alarm_counts = gripAlarmAggregatedEntry.edges_alarm_counts
              result[asnNumber].moas_alarm_timebins = gripAlarmAggregatedEntry.moas_alarm_timebins
              result[asnNumber].submoas_alarm_timebins = gripAlarmAggregatedEntry.submoas_alarm_timebins
              result[asnNumber].defcon_alarm_timebins = gripAlarmAggregatedEntry.defcon_alarm_timebins
              result[asnNumber].edges_alarm_timebins = gripAlarmAggregatedEntry.edges_alarm_timebins
            } else {
              result[asnNumber] = {
                ...gripAlarmAggregatedEntry, hegemony_alarm_counts: [], network_delay_alarm_counts: [],
                hegemony_alarm_timebins: [], network_delay_alarm_timebins: []
              }
            }
          }
        }
      }

      let mergedAlarms = performFullOuterJoin(hegemonyNetDelayAlarms);
      updateResultWithGripAlarms(mergedAlarms, gripAlarms);
      return mergedAlarms;
    },

    addASNNameAndCountryIsoCode2(data) {
      const promises = [];

      for (let asnNumber in data) {
        const asnName = data[asnNumber].asn_name.toString();
        if (asnName || isNaN(asnName)) {
          data[asnNumber].country_iso_code2 = this.normalizeCountryIsoCode2(asnName);
          data[asnNumber].asn_name = this.normalizeASNName(asnName);
        } else {
          const promise = this.getASNNameAndCountryIsoCode2Proxy(asnNumber)
            .then(asnNameAndIsoCode2 => {
              data[asnNumber].country_iso_code2 = asnNameAndIsoCode2['country_iso_code2'];
              data[asnNumber].asn_name = asnNameAndIsoCode2['asn_name'];
            })
            .catch(error => {
              console.error('Error retrieving ASN name and country ISO code:', error);
              throw error;
            });

          promises.push(promise);
        }

      }

      return Promise.all(promises);
    },

    getASNNameAndCountryIsoCode2Proxy(asnNumber, maxRetries = 5, delay = 1000) {
      let retries = 0;

      const request = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this.getASNNameAndCountryIsoCode2(asnNumber)
              .then(asnNameAndIsoCode2 => {
                resolve(asnNameAndIsoCode2);
              })
              .catch(error => {
                if (retries < maxRetries) {
                  retryRequest(asnNumber, resolve, reject)
                } else {
                  console.error(`Maximum retries reached for ASN ${asnNumber}`)
                  reject(error);
                }
              });
          }, delay)
        });
      };

      const retryRequest = (asnNumber, resolve, reject) => {
        retries++;
        console.log(`Retrying request for ASN ${asnNumber} (Attempt ${retries + 1})...`);
        setTimeout(() => {
          request().then(resolve).catch(reject);
        }, delay);
      };

      return request();
    },

    getASNNameAndCountryIsoCode2(asnNumber) {
      let networkQueryFilter = new NetworkQuery().asNumber(asnNumber)
      const request = () => {
        return new Promise((resolve, reject) => {
          this.$ihr_api.network(
            networkQueryFilter,
            results => {
              results.results.forEach(network => {
                if (network.number == asnNumber) {
                  const countryIsoCode2 = this.normalizeCountryIsoCode2(network.name)
                  const asnName = this.normalizeASNName(network.name)
                  resolve({
                    asn_name: asnName,
                    country_iso_code2: countryIsoCode2,
                  })
                }
              })
            },
            error => {
              reject(error)
            }
          )
        })
      }

      return request();
    },

    normalizeCountryIsoCode2(asnName) {
      return asnName.split(',').splice(-1)[0].trim()
    },

    normalizeASNName(asnName) {
      return asnName.split(',').splice(0, asnName.split(',').length - 1).join(',').trim()
    },

    addCountryIsoCode3AndCountryNameProxy(data, countryCode2Key) {
      for (let asnNumber in data) {
        const countryCode2 = data[asnNumber][countryCode2Key]
        Object.assign(data[asnNumber], this.getCountryIsoCode3AndCountryName(countryCode2))
      }
    },

    getCountryIsoCode3AndCountryName(countryCode2) {
      return {
        country_iso_code3: getCountryISOCode3(countryCode2),
        country_name: getCountryName(countryCode2),
      }
    },

    addTotalAlarmCountsColumn(alarms) {
      const alarmsToSum = Object.values(this.alarmCounts)
      alarms.forEach(alarm => {
        let totalAlarmCounts = 0
        alarmsToSum.forEach(column => {
          totalAlarmCounts += alarm[column]
        });
        alarm.total_alarm_counts = totalAlarmCounts
      });
    },

    addASNNumberToAlarmsAndConvertToArray(alarms) {
      for (const asnNumber in alarms) {
        alarms[asnNumber].asn = asnNumber;
      }
      const alarmsArray = Object.values(alarms)
      return alarmsArray
    },

    groupTotalAlarmCountsByCountry(alarms) {
      const alarmsByCountry = alarms.reduce((result, obj) => {
        const existingEntry = result.find(
          entry =>
            entry.country_iso_code2 === obj.country_iso_code2 &&
            entry.country_iso_code3 === obj.country_iso_code3 &&
            entry.country_name === obj.country_name
        );


        if (existingEntry) {
          if (this.alarmTypesFilter.hegmeony) {
            existingEntry.hegemony_alarm_counts += obj.hegemony_alarm_counts.length
          }
          if (this.alarmTypesFilter.network_delay) {
            existingEntry.network_delay_alarm_counts += obj.network_delay_alarm_counts.length
          }

          if (this.alarmTypesFilter.moas) {
            existingEntry.moas_alarm_counts += obj.moas_alarm_counts.length
          }

          if (this.alarmTypesFilter.submoas) {
            existingEntry.submoas_alarm_counts += obj.submoas_alarm_counts.length
          }

          if (this.alarmTypesFilter.defcon) {
            existingEntry.defcon_alarm_counts += obj.defcon_alarm_counts.length
          }

          if (this.alarmTypesFilter.edges) {
            existingEntry.edges_alarm_counts += obj.edges_alarm_counts.length
          }

        } else {
          let alarmsInitial = {
            country_iso_code2: obj.country_iso_code2,
            country_iso_code3: obj.country_iso_code3,
            country_name: obj.country_name,
            total_alarm_counts: obj.total_alarm_counts
          }

          if (this.alarmTypesFilter.hegemony) {
            alarmsInitial = {
              ...alarmsInitial,
              hegemony_alarm_counts: obj.hegemony_alarm_counts.length,
            }
          }

          if (this.alarmTypesFilter.network_delay) {
            alarmsInitial = {
              ...alarmsInitial,
              network_delay_alarm_counts: obj.network_delay_alarm_counts.length,
            }
          }

          if (this.alarmTypesFilter.moas) {
            alarmsInitial = {
              ...alarmsInitial,
              moas_alarm_counts: obj.moas_alarm_counts.length,
            }
          }

          if (this.alarmTypesFilter.submoas) {
            alarmsInitial = {
              ...alarmsInitial,
              submoas_alarm_counts: obj.submoas_alarm_counts.length,
            }
          }

          if (this.alarmTypesFilter.defcon) {
            alarmsInitial = {
              ...alarmsInitial,
              defcon_alarm_counts: obj.defcon_alarm_counts.length,
            }
          }

          if (this.alarmTypesFilter.edges) {
            alarmsInitial = {
              ...alarmsInitial,
              edges_alarm_counts: obj.edges_alarm_counts.length,
            }
          }

          result.push(alarmsInitial);
        }

        return result;
      }, []);
      return alarmsByCountry
    },

    sumIntegers(array) {
      return array.reduce((a, b) => a + b, 0)
    },

    getPlotlyData(inputData) {
      const data = {}
      for (let field in inputData[0]) {
        for (let index in inputData) {
          if (!data[field]) {
            data[field] = []
          }
          data[field].push(inputData[index][field])
        }
      }
      return data
    },

    getZippedCustomHoverData(keys, alarmsData) {
      const zippedData = []
      for (let i = 0; i < alarmsData[keys[0]].length; i++) {
        const customDataElement = {};
        keys.forEach(key => {
          let alarmCountsValue = alarmsData[key][i];
          customDataElement[key] = alarmCountsValue;
        });
        zippedData.push(customDataElement)
      }
      return zippedData
    },

    updateChart(alarms, customHoverData) {
      this.chart.layout.datarevision = new Date().getTime()
      this.chart.traces[0]['customdata'] = customHoverData
      this.chart.traces[0]['locations'] = alarms['country_iso_code3']
      this.chart.traces[0]['z'] = alarms['total_alarm_counts']
      this.chart.traces[0]['text'] = alarms['country_name']
      this.chart.traces[0]['hovertemplate'] =
        '<b>%{text}</b><br>' +
        'Total Alarm Counts: %{z}<br>' +
        (this.alarmTypesFilter.hegemony ? 'Hegemony Dependency Alarm Counts: %{customdata.hegemony_alarm_counts}<br>' : '') +
        (this.alarmTypesFilter.network_delay ? 'Network Delay Alarm Counts: %{customdata.network_delay_alarm_counts}<br>' : '') +
        (this.alarmTypesFilter.moas ? 'Moas Alarm Counts: %{customdata.moas_alarm_counts}<br>' : '') +
        (this.alarmTypesFilter.submoas ? 'Submoas Alarm Counts: %{customdata.submoas_alarm_counts}<br>' : '') +
        (this.alarmTypesFilter.defcon ? 'Defcon Alarm Counts: %{customdata.defcon_alarm_counts}<br>' : '') +
        (this.alarmTypesFilter.edges ? 'Edges Alarm Counts: %{customdata.edges_alarm_counts}<br>' : '')
    },
    clearWorldMap() {
      this.chart.traces[0].locations = []
      this.chart.traces[0].z = []
      this.chart.traces[0].text = []
      this.chart.traces[0].customdata = []
      this.chart.traces[0].hovertemplate = ''
      this.chart.traces[0].name = ''
    }
  },
}
</script>

<style>
.IHR_chart {
  height: 380px;
}
</style>