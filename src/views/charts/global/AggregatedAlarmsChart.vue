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

export default {
  mixins: [CommonChartMixin],
  components: {
    AggregatedAlarmsMap,
  },
  props: {
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
    return {
      chart: chart
    }
  },
  methods: {
    apiCall() {
      this.loading = true
      if (this.networkDelayAlarms.length && this.hegemonyAlarms.length) {
        this.etlData()
      }
    },

    etlData() {
      this.extractData()
      this.transformData(this.networkDelayAlarms, this.hegemonyAlarms).then((alarms) => {
        this.loadAndDisplayPlot(alarms)
      })
        .catch(error => {
          console.error(error)
        })
    },

    extractData() {

    },

    transformData(networkDelayAlarms, hegemonyAlarms) {
      const request = () => {
        return new Promise((resolve, reject) => {
          const counts = {hegemonyAlarmCounts: 'hegemony_alarm_counts', networkDelayAlarmCounts: 'network_delay_alarm_counts'}
          const netDelayAlarmsFiltered = networkDelayAlarms.filter(alarm => alarm.startpoint_type === 'AS')
          const netDelayAlarmsAggregated = this.aggregateIHRAlarms(netDelayAlarmsFiltered, 'startpoint_name', counts.networkDelayAlarmCounts)
          const hegemonyAlarmsAggregated = this.aggregateIHRAlarms(hegemonyAlarms, 'asn', counts.hegemonyAlarmCounts)
          const hegemonyNetDelayAlarmsMerged = this.fullOuterJoinIHRAlarms(hegemonyAlarmsAggregated, netDelayAlarmsAggregated)
          this.addASNNameAndCountryIsoCode2(hegemonyNetDelayAlarmsMerged).then(() => {
            this.addCountryIsoCode3AndCountryName(hegemonyNetDelayAlarmsMerged, 'country_iso_code2')
            this.addTotalAlarmCounts(hegemonyNetDelayAlarmsMerged, Object.values(counts))
            this.addASNKeyValue(hegemonyNetDelayAlarmsMerged)
            const alarms = Object.values(hegemonyNetDelayAlarmsMerged).filter(alarm => alarm.country_iso_code3)
            const totalAlarmsByCountry = this.calculateTotalAlarmsByCountry(alarms)
            resolve(totalAlarmsByCountry)
          }).catch(error => {
            reject(error)
          })
        })
      }

      return request()
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

    addCountryIsoCode3AndCountryName(data, countryCode2Key) {
      for (let asnNumber in data) {
        const countryCode2 = data[asnNumber][countryCode2Key]
        data[asnNumber].country_iso_code3 = getCountryISOCode3(countryCode2)
        data[asnNumber].country_name = getCountryName(countryCode2)
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
          existingEntry.total_alarm_counts += obj.total_alarm_counts;
        } else {
          result.push({
            hegemony_alarm_counts: obj.hegemony_alarm_counts,
            network_delay_alarm_counts: obj.network_delay_alarm_counts,
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

    loadAndDisplayPlot(alarms) {
      const plotlyData = this.getPlotlyData(alarms)
      const customHoverData = this.getZippedCustomHoverData(['hegemony_alarm_counts', 'network_delay_alarm_counts'], plotlyData)
      this.updateChart(plotlyData, customHoverData);
      this.loading = false;
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
        'Network Delay Alarm Counts: %{customdata[1]}<br>'
    },
  },
}
</script>
