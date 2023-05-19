<template>
  <div class="IHR_chart">
    <div>
      <aggregated-alarms-map :chart="chart" :loading="loading" />
    </div>
  </div>
</template>

<script>
import { COMMON_FEATURE } from '../layouts.js'
import CommonChartMixin from '../CommonChartMixin'
import AggregatedAlarmsMap from './AggregatedAlarmsMap.vue'
import { NetworkQuery } from '@/plugins/IhrApi'
import getCountryISOCode3 from '@/plugins/countryISOCode3.js'
import getCountryName from '@/plugins/countryName.js'
import axios from 'axios'
import { format } from 'path'

export default {
  mixins: [CommonChartMixin],
  components: {
    AggregatedAlarmsMap,
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
  data() {
    let chart = {
      uuid: 'world-map',
      traces: [
        {
          type: 'choropleth',
          locations: [],
          z: [],
          text: [],
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
        margin: {
          t: 10,
          b: 10,
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
      alarmCounts: alarmCounts,
    }
  },
  methods: {
    apiCall() {
      this.loading = true
      if (this.networkDelayAlarms.length && this.hegemonyAlarms.length) {
        this.etlAlarms()
      }
    },

    etlAlarms() {
      this.extractAlarms().then((alarms) => {
        const gripAlarms = alarms.gripAlarms
        this.transformAlarms(gripAlarms, this.networkDelayAlarms, this.hegemonyAlarms).then((alarms) => {
          this.loadAndDisplayPlot(alarms)
        })
          .catch(error => {
            console.error(error)
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
          this.transformAlarmsHelper(hegemonyNetDelayAlarms, gripAlarmsTransformed).then((totalAlarmsByCountry) => {
            resolve(totalAlarmsByCountry)
          }).catch(error => {
            reject(error)
          })
        })
      }
      return request()
    },

    loadAndDisplayPlot(alarms) {
      const plotlyData = this.getPlotlyData(alarms)
      const customHoverData = this.getZippedCustomHoverData(Object.values(this.alarmCounts), plotlyData)
      this.updateChart(plotlyData, customHoverData);
      this.loading = false;
    },

    getGRIPAlarms() {
      const apiURL = 'https://api.grip.inetintel.cc.gatech.edu/json/events';
      const chunkSize = 100;

      const formatTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
        return formattedDate;
      };

      const params = {
        length: chunkSize,
        start: 0,
        ts_start: formatTime(this.startTime),
        ts_end: formatTime(this.endTime),
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

    transformGRIPAlarms(gripAlarms) {
      const gripAlarmsTransformed = this.filterAndGetGripAlarms(gripAlarms);
      const aggregatedAlarms = this.aggregateGripAlarms(gripAlarmsTransformed);
      return aggregatedAlarms;
    },

    filterAndGetGripAlarms(gripAlarms) {
      const gripAlarmsTransformed = [];

      gripAlarms.forEach((entry) => {
        const event_type = entry['event_type'];
        const summary = entry['summary'];
        const trWorthy = entry['summary']['tr_worthy'];

        if (trWorthy === true) {
          summary['victims'].forEach((victim) => {
            const bgpAlertAlarm = { asn_name: victim, event_type }
            gripAlarmsTransformed.push(bgpAlertAlarm);
          });
        }
      });

      return gripAlarmsTransformed;
    },

    aggregateGripAlarms(gripAlarmsTransformed) {
      const aggregatedAlarms = {};

      gripAlarmsTransformed.forEach(item => {
        const { asn_name, event_type } = item;

        if (!aggregatedAlarms[asn_name]) {
          aggregatedAlarms[asn_name] = {
            asn_name,
            moas_alarm_counts: 0,
            submoas_alarm_counts: 0,
            edges_alarm_counts: 0,
            defcon_alarm_counts: 0
          };
        }

        switch (event_type) {
          case 'moas':
            aggregatedAlarms[asn_name].moas_alarm_counts++;
            break;
          case 'submoas':
            aggregatedAlarms[asn_name].submoas_alarm_counts++;
            break;
          case 'defcon':
            aggregatedAlarms[asn_name].defcon_alarm_counts++;
            break;
          case 'edges':
            aggregatedAlarms[asn_name].edges_alarm_counts++;
            break;
          default:
            break;
        }
      });

      return aggregatedAlarms;
    },

    transformIHRAlarms(networkDelayAlarms, hegemonyAlarms) {
      const netDelayAlarmsFiltered = networkDelayAlarms.filter(alarm => alarm.startpoint_type === 'AS')
      const netDelayAlarmsAggregated = this.aggregateIHRAlarms(netDelayAlarmsFiltered, 'startpoint_name', this.alarmCounts.networkDelayAlarmCounts)
      const hegemonyAlarmsAggregated = this.aggregateIHRAlarms(hegemonyAlarms, 'asn', this.alarmCounts.hegemonyAlarmCounts)
      const hegemonyNetDelayAlarmsMerged = this.fullOuterJoinIHRAlarms(hegemonyAlarmsAggregated, netDelayAlarmsAggregated)
      return hegemonyNetDelayAlarmsMerged
    },

    aggregateIHRAlarms(alarms, asnKey, alarmCountsAccumlator) {
      const alarmsAggregated = alarms.reduce((acc, curr) => {
        acc[curr[asnKey]] = acc[curr[asnKey]] || {
          [alarmCountsAccumlator]: 0,
          asn_name: curr['asn_name'] || curr['startpoint_name'],
        }
        acc[curr[asnKey]][alarmCountsAccumlator]++
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
            this.addTotalAlarmCounts(alarms, Object.values(this.alarmCounts))
            this.addASNKeyValue(alarms)
            const alarmsWithCountryIsoCode3 = Object.values(alarms).filter(alarm => alarm.country_iso_code3)
            const totalAlarmsByCountry = this.calculateTotalAlarmsByCountry(alarmsWithCountryIsoCode3)
            resolve(totalAlarmsByCountry)
          }).catch(error => {
            reject(error)
          })
        })
      }
      return request()
    },

    fullOuterJoinGRIPAlarms(hegemonyNetDelayAlarms, gripAlarms) {
      const result = {};

      for (let key in hegemonyNetDelayAlarms) {
        result[key] = { ...hegemonyNetDelayAlarms[key], ...(gripAlarms[key] || { moas_alarm_counts: 0, submoas_alarm_counts: 0, edges_alarm_counts: 0, defcon_alarm_counts: 0 }) };
      }

      for (let key in gripAlarms) {
        if (!result[key]) {
          result[key] = { hegemony_alarm_counts: 0, network_delay_alarm_counts: 0, ...gripAlarms[key] };
        }
      }

      return result;
    },

    fullOuterJoinIHRAlarms(hegemonyAlarms, netDelayAlarms) {
      const result = {};

      for (const key in hegemonyAlarms) {
        if (hegemonyAlarms.hasOwnProperty(key)) {
          result[key] = { ...hegemonyAlarms[key], hegemony_alarm_counts: hegemonyAlarms[key].hegemony_alarm_counts, network_delay_alarm_counts: 0 };
        }
      }

      for (const key in netDelayAlarms) {
        if (netDelayAlarms.hasOwnProperty(key)) {
          if (result.hasOwnProperty(key)) {
            result[key].network_delay_alarm_counts = netDelayAlarms[key].network_delay_alarm_counts;
          } else {
            result[key] = { ...netDelayAlarms[key], hegemony_alarm_counts: 0 };
          }
        }
      }

      return result;
    },

    addASNNameAndCountryIsoCode2(data) {
      const promises = [];

      for (let asnNumber in data) {
        const asnName = data[asnNumber].asn_name.toString();
        console.log('asnName', asnName);
        if (isNaN(asnName)) {
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

    addTotalAlarmCounts(alarms, columnsToSum) {
      for (let i in alarms) {
        let totalAlarmCounts = 0;
        for (let j = 0; j < columnsToSum.length; j++) {
          totalAlarmCounts += alarms[i][columnsToSum[j]];
        }
        alarms[i].total_alarm_counts = totalAlarmCounts;
      }
    },

    addASNKeyValue(alarms) {
      for (const key in alarms) {
        alarms[key].asn = key;
      }
    },

    calculateTotalAlarmsByCountry(alarms) {
      const alarmsByCountry = alarms.reduce((result, obj) => {
        const existingEntry = result.find(
          entry =>
            entry.country_iso_code2 === obj.country_iso_code2 &&
            entry.country_iso_code3 === obj.country_iso_code3 &&
            entry.country_name === obj.country_name
        );

        if (existingEntry) {
          existingEntry.hegemony_alarm_counts += obj.hegemony_alarm_counts;
          existingEntry.network_delay_alarm_counts += obj.network_delay_alarm_counts;
          existingEntry.defcon_alarm_counts += obj.defcon_alarm_counts;
          existingEntry.edges_alarm_counts += obj.edges_alarm_counts;
          existingEntry.moas_alarm_counts += obj.moas_alarm_counts;
          existingEntry.submoas_alarm_counts += obj.submoas_alarm_counts;
          existingEntry.total_alarm_counts += obj.total_alarm_counts;
        } else {
          result.push({
            hegemony_alarm_counts: obj.hegemony_alarm_counts,
            network_delay_alarm_counts: obj.network_delay_alarm_counts,
            defcon_alarm_counts: obj.defcon_alarm_counts,
            edges_alarm_counts: obj.edges_alarm_counts,
            moas_alarm_counts: obj.moas_alarm_counts,
            submoas_alarm_counts: obj.submoas_alarm_counts,
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

    updateChart(ihrAlarms, customHoverData) {
      this.chart.layout.datarevision = new Date().getTime()
      this.chart.traces[0]['customdata'] = customHoverData
      this.chart.traces[0]['locations'] = ihrAlarms['country_iso_code3']
      this.chart.traces[0]['z'] = ihrAlarms['total_alarm_counts']
      this.chart.traces[0]['text'] = ihrAlarms['country_name']
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
