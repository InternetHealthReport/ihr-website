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
          showscale: false,
          marker: {
            line: {
              color: 'rgb(255,255,255)',
              width: 1,
            },
          },
          hoverlabel: {
            bgcolor: 'white',
          },
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
        const networkDelayAlarmsAggregated = this.getAggregatedAlarms(this.networkDelayAlarms, 'startpoint_name', 'network_delay_alarm_counts')
        const hegemonyAlarmsAggregated = this.getAggregatedAlarms(this.hegemonyAlarms, 'asn', 'hegemony_alarm_counts')
        const hegemonyNetworkDelayAlarmsMerged = this.fullOuterJoinAlarms(hegemonyAlarmsAggregated, networkDelayAlarmsAggregated, 'asn', { hegemony_alarm_counts: 0, network_delay_alarm_counts: 0 })
        this.addTotalAlarmCounts(hegemonyNetworkDelayAlarmsMerged, ['hegemony_alarm_counts', 'network_delay_alarm_counts'])
        this.initalizeASNNameAndIsoCodes2(hegemonyNetworkDelayAlarmsMerged).then(() => {
          this.initializeCountryCode3AndName(hegemonyNetworkDelayAlarmsMerged, 'country_iso_code2')
          const ihrAlarmsAggregated = this.getDataPreparedForPlotly(hegemonyNetworkDelayAlarmsMerged)
          this.updateChart(ihrAlarmsAggregated)
          this.loading = false
        })
          .catch(error => {
            console.error(error)
          })
      }
    },

    getAggregatedAlarms(alarms, asnKey, alarmCountsAccumlator) {
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

    fullOuterJoinAlarms(alarms1, alarms2, asnKey, accumulatedKeys) {
      const mergedData = []

      for (let prop in alarms1) {
        if (alarms1.hasOwnProperty(prop)) {
          const data = this.mergeAlarmData(prop, alarms1[prop], alarms2[prop], asnKey, accumulatedKeys);
          mergedData.push(data)
        }
      }

      for (let prop in alarms2) {
        if (alarms2.hasOwnProperty(prop) && !alarms1.hasOwnProperty(prop)) {
          const data = this.mergeAlarmData(prop, alarms1[prop], alarms2[prop], asnKey, accumulatedKeys);
          mergedData.push(data)
        }
      }

      return mergedData
    },

    mergeAlarmData(prop, alarm1, alarm2, asnKey, accumulatedKeys) {
      return Object.assign({ [asnKey]: prop, ...accumulatedKeys }, alarm1, alarm2);
    },

    addTotalAlarmCounts(alarms, columnsToSum) {
      for (let i = 0; i < alarms.length; i++) {
        let totalAlarmCounts = 0
        for (let j = 0; j < columnsToSum.length; j++) {
          totalAlarmCounts += alarms[i][columnsToSum[j]]
        }
        alarms[i]['total_alarm_counts'] = totalAlarmCounts
      }
    },

    initalizeASNNameAndIsoCodes2(data) {
      const promises = []
      for (let i = 0; i < data.length; i++) {
        const asnNumber = data[i].asn.toString()
        const asnName = data[i].asn_name.toString()
        if (!isNaN(asnName)) {
          const promise = this.getASNNameAndIsoCodeWithDelay(asnNumber, data, i)
          promises.push(promise)
        } else {
          data[i].country_iso_code2 = asnName.split(', ').splice(-1)[0]
        }
      }
      return Promise.all(promises)
    },

    getASNNameAndIsoCodeWithDelay(asnNumber, data, i, maxRetries = 5, delay = 1000) {
      let retries = 0;

      const request = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this.getASNNameAndIsoCode(asnNumber)
              .then(asnNameAndIsoCode2 => {
                data[i].country_iso_code2 = asnNameAndIsoCode2['country_iso_code2'];
                data[i].asn_name = asnNameAndIsoCode2['asn_name'];
                resolve();
              })
              .catch(error => {
                console.error(error);
                retries++;

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

    getASNNameAndIsoCode(asnNumber) {
      let networkQueryFilter = new NetworkQuery().asNumber(asnNumber)
      const request = () => {
        return new Promise((resolve, reject) => {
          this.$ihr_api.network(
            networkQueryFilter,
            results => {
              results.results.forEach(network => {
                if (network.number == asnNumber) {
                  let countryIsoCode2 = network.name.split(', ').slice(-1)[0]
                  resolve({
                    asn_name: network.name,
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

    initializeCountryCode3AndName(data, countryCode2Key) {
      for (let i = 0; i < data.length; i++) {
        const countryCode2 = data[i][countryCode2Key]
        const countryName = getCountryName(countryCode2)
        if (countryCode2 && countryName) {
          data[i]['country_iso_code3'] = getCountryISOCode3(countryCode2)
          data[i]['country_name'] = countryName
        }
      }
    },

    getDataPreparedForPlotly(inputData) {
      const data = {}
      for (let field in inputData[0]) {
        data[field] = inputData.map(item => item[field])
      }
      return data
    },

    getZippedHoverData(keys, alarmsData) {
      const zippedData = []
      const isSameLength = keys.every(key => alarmsData[key].length === alarmsData[keys[0]].length)

      if (isSameLength) {
        for (let i = 0; i < alarmsData[keys[0]].length; i++) {
          const tempObj = []
          keys.forEach(key => tempObj.push(alarmsData[key][i]))
          zippedData.push(tempObj)
        }
      }
      return zippedData
    },

    updateChart(ihrAlarms) {
      this.chart.layout.datarevision = new Date().getTime()
      this.chart.traces[0]['customdata'] = this.getZippedHoverData(['hegemony_alarm_counts', 'network_delay_alarm_counts'], ihrAlarms)
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
