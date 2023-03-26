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
import { Query, NetworkDelayAlarmsQuery, HegemonyAlarmsQuery, NetworkQuery } from '@/plugins/IhrApi'
import getCountryISOCode3 from '@/plugins/countryISOCode3.js'
import getCountryName from '@/plugins/countryName.js'

const DEFAULT_NETWORK_DELAY_MIN_DEVIATION = 10
const DEFAULT_HEGEMONY_MIN_DEVIATION = 20

export default {
  mixins: [CommonChartMixin],
  components: {
    AggregatedAlarmsMap,
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
      networkDelayAlarmsFilter: new NetworkDelayAlarmsQuery()
        .deviation(DEFAULT_NETWORK_DELAY_MIN_DEVIATION, Query.GTE)
        .startPointType(this.selectedType)
        .timeInterval(this.startTime, this.endTime),
      hegemonyAlarmsFilter: new HegemonyAlarmsQuery().deviation(DEFAULT_HEGEMONY_MIN_DEVIATION, Query.GTE).timeInterval(this.startTime, this.endTime),
      chart: chart,
    }
  },
  methods: {
    apiCall() {
      this.loading = true

      this.getAlarms('network_delay_alarms', this.networkDelayAlarmsFilter)
        .then(networkDelayAlarms => {
          this.getAlarms('hegemony_alarms', this.hegemonyAlarmsFilter)
            .then(hegemonyAlarms => {
              if (networkDelayAlarms.length == 0 && hegemonyAlarms.length == 0) {
                this.loading = false
                return
              }
              const networkDelayAlarmsAggregated = this.getAggregatedAlarms(
                networkDelayAlarms,
                'startpoint_name',
                'network_delay_alarm_counts'
              )
              const hegemonyAlaramsAggregated = this.getAggregatedAlarms(hegemonyAlarms, 'asn', 'hegemony_alarm_counts')
              const hegemonyNetworkDelayAlarmsMerged = this.fullOuterJoinAlarms(
                hegemonyAlaramsAggregated,
                networkDelayAlarmsAggregated,
                'asn',
                {
                  hegemony_alarm_counts: 0,
                  network_delay_alarm_counts: 0,
                }
              )
              this.addTotalAlarmCounts(hegemonyNetworkDelayAlarmsMerged, ['hegemony_alarm_counts', 'network_delay_alarm_counts'])
              this.initalizeASNNameAndIsoCodes2(hegemonyNetworkDelayAlarmsMerged).then(() => {
                this.initializeCountryCode3AndName(hegemonyNetworkDelayAlarmsMerged, 'country_iso_code2')
                const ihrAlarmsAggregated = this.getDataPreparedForPlotly(hegemonyNetworkDelayAlarmsMerged)
                this.updateChart(ihrAlarmsAggregated)
                this.loading = false
              })
            })
            .catch(error => {
              console.error(error)
            })
        })
        .catch(error => {
          console.error(error)
        })
    },

    getAlarms(alarmType, filter) {
      let data = []
      return new Promise((resolve, reject) => {
        this.$ihr_api[alarmType](
          filter,
          result => {
            result.results.forEach(alarm => {
              if (alarmType === 'network_delay_alarms' && alarm['startpoint_type'] !== 'AS') {
                return
              }
              data.push(alarm)
            })
            resolve(data)
          },
          error => {
            reject(error)
          }
        )
      })
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
    fullOuterJoinAlarms(alarms1, alarms2, asnKey, accumlatedKeys) {
      const mergedData = []

      for (let prop in alarms1) {
        if (alarms1.hasOwnProperty(prop)) {
          let data = Object.assign({ [asnKey]: prop, ...accumlatedKeys }, alarms1[prop], alarms2[prop])
          mergedData.push(data)
        }
      }

      for (let prop in alarms2) {
        if (alarms2.hasOwnProperty(prop) && !alarms1.hasOwnProperty(prop)) {
          let data = Object.assign({ [asnKey]: prop, ...accumlatedKeys }, alarms1[prop], alarms2[prop])
          mergedData.push(data)
        }
      }

      return mergedData
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
          const promise = this.getASNNameAndIsoCode(asnNumber)
            .then(asnNameAndIsoCode2 => {
              data[i].country_iso_code2 = asnNameAndIsoCode2['country_iso_code2']
              data[i].asn_name = asnNameAndIsoCode2['asn_name']
            })
            .catch(error => {
              console.error(error)
              reject(error)
            })
          promises.push(promise)
        } else {
          data[i].country_iso_code2 = data[i].asn_name.split(', ').splice(-1)[0]
        }
      }
      return Promise.all(promises)
    },
    getASNNameAndIsoCode(asnNumber) {
      let networkQueryFilter = new NetworkQuery().asNumber(asnNumber)
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
