<template>
  <div style="height: 450px;" class="IHR_chart">
    <div style="margin: 3px 3px 3px 3px;" class="filters">
      <div>
        <label for="start-date">Start Date and Time:</label>
        <input style="margin-left: 5px;" type="datetime-local" id="start-date" v-model="startDate" :min="minStartDate"
          :max="maxEndDate">
      </div>
      <div style="margin: 5px 3px 3px 3px;">
        <label for="end-date">End Date and Time:</label>
        <input style="margin-left: 9px;" type="datetime-local" id="end-date" v-model="endDate" :min="minStartDate"
          :max="maxEndDate">
      </div>
      <div style="margin-top: 6px;" class="button-container">
        <button @click="applyTimeFiltersWorldMap">Apply Filters</button>
        <button @click="resetWorldMap" style="margin-left: 3px;" class="reset-button">Reset</button>
      </div>
    </div>
    <aggregated-alarms-world-map-reactive :chart="chart" :loading="loading" @plotly-click="plotlyClickedData = $event" />
  </div>
</template>

<script>
import { COMMON_FEATURE } from '../layouts.js'
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
    networkDelayAlarms: {
      type: Array,
      required: true,
      default: () => []
    },
    hegemonyAlarms: {
      type: Array,
      required: true,
      default: () => []
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
        ...COMMON_FEATURE,
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
    let alarmCounts = {
      hegemonyAlarmCounts: 'hegemony_alarm_counts', networkDelayAlarmCounts: 'network_delay_alarm_counts',
      moasAlarmCounts: 'moas_alarm_counts', submoasAlarmCounts: 'submoas_alarm_counts', defconAlarmCounts: 'defcon_alarm_counts',
      edgesAlarmCounts: 'edges_alarm_counts',
    }
    return {
      chart: chart,
      alarms: [],
      timeFilteredAlarms: [],
      backupAlarms: [],
      alarmCounts: alarmCounts,
      plotlyClickedData: null,
      startDate: this.formatTime(this.startTime),
      endDate: this.formatTime(this.endTime),
      minStartDate: this.formatTime(this.startTime),
      maxEndDate: this.formatTime(this.endTime),
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
  },
  methods: {
    resetWorldMap() {
      this.loadAndDisplayWorldMap(this.alarms, this.alarmCounts)
      this.$emit('aggregated-alarms-data-loaded', this.alarms)
      this.startDate = null
      this.endDate = null
    },
    applyTimeFiltersWorldMap() {
      if (this.alarms && this.alarms.length && this.startDate && this.endDate) {
        let startDate = new Date(this.startDate)
        let endDate = new Date(this.endDate)

        if (startDate > endDate) {
          alert('Start Date cannot be greater than End Date')
          return
        }

        const formattedStartDate = startDate.toISOString().slice(0, 16);
        const formattedEndDate = endDate.toISOString().slice(0, 16);

        startDate = new Date(formattedStartDate);
        endDate = new Date(formattedEndDate);

        const timeFilteredAlarms = this.deepCopy(this.alarms).map(alarm => {
          alarm.hegemony_alarm_timebins = alarm.hegemony_alarm_timebins.filter((timebin) => {
            return timebin >= startDate && timebin <= endDate
          })
          alarm.network_delay_alarm_timebins = alarm.network_delay_alarm_timebins.filter((timebin) => {
            return timebin >= startDate && timebin <= endDate
          })
          alarm.moas_alarm_timebins = alarm.moas_alarm_timebins.filter((timebin) => {
            return timebin >= startDate && timebin <= endDate
          })
          alarm.submoas_alarm_timebins = alarm.submoas_alarm_timebins.filter((timebin) => {
            return timebin >= startDate && timebin <= endDate
          })
          alarm.defcon_alarm_timebins = alarm.defcon_alarm_timebins.filter((timebin) => {
            return timebin >= startDate && timebin <= endDate
          })
          alarm.edges_alarm_timebins = alarm.edges_alarm_timebins.filter((timebin) => {
            return timebin >= startDate && timebin <= endDate
          })
          const allTimebinsEmpty =
            alarm.hegemony_alarm_timebins.length === 0 &&
            alarm.network_delay_alarm_timebins.length === 0 &&
            alarm.moas_alarm_timebins.length === 0 &&
            alarm.submoas_alarm_timebins.length === 0 &&
            alarm.defcon_alarm_timebins.length === 0 &&
            alarm.edges_alarm_timebins.length === 0

          if (allTimebinsEmpty) {
            return null
          } else {
            alarm.hegemony_alarm_counts = Array(alarm.hegemony_alarm_timebins.length).fill(1)
            alarm.network_delay_alarm_counts = Array(alarm.network_delay_alarm_timebins.length).fill(1)
            alarm.moas_alarm_counts = Array(alarm.moas_alarm_timebins.length).fill(1)
            alarm.submoas_alarm_counts = Array(alarm.submoas_alarm_timebins.length).fill(1)
            alarm.defcon_alarm_counts = Array(alarm.defcon_alarm_timebins.length).fill(1)
            alarm.edges_alarm_counts = Array(alarm.edges_alarm_timebins.length).fill(1)
            return alarm
          }
        })
        this.timeFilteredAlarms = timeFilteredAlarms.filter(alarm => alarm !== null)
        this.$emit('aggregated-alarms-data-loaded', this.timeFilteredAlarms)
      }
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
      this.loading = true
      if (this.networkDelayAlarms.length && this.hegemonyAlarms.length) {
        this.etlAlarms().then(() => {
          this.loading = false;
        }).catch(error => {
          console.error(error)
        })
      }
    },

    etlAlarms() {
      return new Promise((resolve, reject) => {
        this.extractAlarms().then((alarms) => {
          this.transformAlarms(alarms.gripAlarms, this.networkDelayAlarms, this.hegemonyAlarms).then(() => {
            this.loadAndDisplayWorldMap(this.alarms, this.alarmCounts)
            resolve()
          })
            .catch(error => {
              reject(error)
            })

        })
      })
    },

    extractAlarms() {
      const request = () => {
        return new Promise((resolve, reject) => {
          this.getGRIPAlarms().then((gripAlarms) => {
            resolve({ gripAlarms })
          })
            .catch(error => {
              reject(error)
            })
        })

      }
      return request()
    },

    transformAlarms(gripAlarms, networkDelayAlarms, hegemonyAlarms) {
      const gripAlarmsTransformed = this.transformGRIPAlarms(gripAlarms)
      const request = () => {
        return new Promise((resolve, reject) => {
          const hegemonyNetDelayAlarms = this.transformIHRAlarms(networkDelayAlarms, hegemonyAlarms)
          this.transformAlarmsHelper(hegemonyNetDelayAlarms, gripAlarmsTransformed).then(() => {
            resolve()
          }).catch(error => {
            reject(error)
          })
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
      const netDelayAlarmsAggregated = this.aggregateIHRAlarms(netDelayAlarms, this.alarmCounts.networkDelayAlarmCounts, 'network_delay_alarm_timebins')
      const hegemonyAlarmsAggregated = this.aggregateIHRAlarms(hegemonyAlarms, this.alarmCounts.hegemonyAlarmCounts, 'hegemony_alarm_timebins')
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

    transformAlarmsHelper(hegemonyNetDelayAlarms, gripAlarms) {
      const request = () => {
        return new Promise((resolve, reject) => {
          const alarms = this.fullOuterJoinGRIPAlarms(hegemonyNetDelayAlarms, gripAlarms)
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
          existingEntry.hegemony_alarm_counts += obj.hegemony_alarm_counts.length
          existingEntry.network_delay_alarm_counts += obj.network_delay_alarm_counts.length
          existingEntry.defcon_alarm_counts += obj.defcon_alarm_counts.length
          existingEntry.edges_alarm_counts += obj.edges_alarm_counts.length
          existingEntry.moas_alarm_counts += obj.moas_alarm_counts.length
          existingEntry.submoas_alarm_counts += obj.submoas_alarm_counts.length
        } else {
          result.push({
            hegemony_alarm_counts: obj.hegemony_alarm_counts.length,
            network_delay_alarm_counts: obj.network_delay_alarm_counts.length,
            defcon_alarm_counts: obj.defcon_alarm_counts.length,
            edges_alarm_counts: obj.edges_alarm_counts.length,
            moas_alarm_counts: obj.moas_alarm_counts.length,
            submoas_alarm_counts: obj.submoas_alarm_counts.length,
            country_iso_code2: obj.country_iso_code2,
            country_iso_code3: obj.country_iso_code3,
            country_name: obj.country_name,
            total_alarm_counts: obj.total_alarm_counts
          });
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
        const tempObj = []
        keys.forEach(key => tempObj.push(alarmsData[key][i]))
        zippedData.push(tempObj)
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
        'Hegemony Dependency Alarm Counts: %{customdata[0]}<br>' +
        'Network Delay Alarm Counts: %{customdata[1]}<br>' +
        'Moas Alarm Counts: %{customdata[2]}<br>' +
        'SubMoas Alarm Counts: %{customdata[3]}<br>' +
        'Defcon Alarm Counts: %{customdata[4]}<br>' +
        'Edges Alarm Counts: %{customdata[5]}<br>'
    },
  },
}
</script>

<style></style>
