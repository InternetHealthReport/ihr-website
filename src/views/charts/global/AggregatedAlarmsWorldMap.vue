<template>
  <div class="IHR_chart">
    <aggregated-alarms-world-map-reactive :chart="chart" :loading="loadingVal"
      @plotly-click="plotlyClickedData = $event" />
  </div>
</template>

<script>
import { formatTime } from '@/plugins/AggregatedAlarmsUtils.js'
import { NetworkQuery } from '@/plugins/IhrApi'
import { getCountryISOCode3 } from '@/plugins/countryISOCode3.js'
import getCountryName from '@/plugins/countryName.js'
import AggregatedAlarmsWorldMapReactive from './AggregatedAlarmsWorldMapReactive.vue'

export default {
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
      required: true,
    },
    alarmTypesFilter: {
      type: Object,
      required: true,
    },
    alarmDataSourcesFilter: {
      type: Object,
      required: true,
    },
    resetTimeFlag: {
      type: Boolean,
      required: true,
    },
    loadingVal: {
      type: Boolean,
      required: true,
    },
    severity: {
      type: Number,
      required: true,
    },
    ihrAggregatedAttrs: {
      type: Object,
      required: true
    },
    gripAggregatedAttrs: {
      type: Object,
      required: true
    },
    extractedAlarms: {
      type: Object,
      required: true
    },
    clearWorldMap: {
      type: Boolean,
      required: true
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
      alarms: null,
      plotlyClickedData: null,
      startDate: formatTime(this.startTime),
      endDate: formatTime(this.endTime),
      minStartDate: formatTime(this.startTime),
      maxEndDate: formatTime(this.endTime),
      timeFilteredAlarms: [],
    }
  },
  computed: {
    alarmCountsSelected() {
      let alarmCountsDict = {}
      for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
        if (isSelected) {
          alarmCountsDict[alarmType + '_alarm_counts'] = alarmType + '_alarm_counts'
        }
      }
      return alarmCountsDict
    },
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
          this.loadAndDisplayWorldMap(newTimeFilteredAlarms, this.alarmCountsSelected)
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
        if (newResetTimeFlag && this.alarms) {
          this.resetWorldMap(this.alarms, this.alarmCountsSelected)
        }
      }
    },

    alarmTypesFilter: {
      handler: function (newAlarmTypesFilter) {
        const anyAlarmTypesSelected = Object.values(newAlarmTypesFilter).includes(true)
        if (this.alarms && anyAlarmTypesSelected) {
          const dataContainsSelectedAlarmTypes = this.dictionaryContainsKeys(Object.values(this.alarms)[0], this.alarmCountsSelected)
          if (dataContainsSelectedAlarmTypes) {
            this.loadAndDisplayWorldMap(this.alarms, this.alarmCountsSelected)
          }
        }
      },
      deep: true
    },

    extractedAlarms: {
      handler: function () {
        this.apiCall()
      },
      deep: true
    },

    clearWorldMap: {
      handler: function() {
        this.clearMap()
      }
    }

  },
  methods: {
    resetWorldMap(alarms, alarmCounts) {
      this.loadAndDisplayWorldMap(alarms, alarmCounts)
      this.$emit('aggregated-alarms-data-loaded', alarms)
    },

    filterAlarmsByTime(startDateTime, endDateTime) {
      this.timeFilteredAlarms = this.deepCopy(this.alarms).filter(alarm => {
        return this.isAlarmTimebinInRange(alarm, startDateTime, endDateTime);
      });
      this.timeFilteredAlarms = this.timeFilteredAlarms.filter(alarm => alarm !== null);
      this.$emit('aggregated-alarms-data-loaded', this.timeFilteredAlarms);
    },

    isAlarmTimebinInRange(alarm, startDateTime, endDateTime) {
      let allTimebinsEmpty = true;
      for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
        if (isSelected) {
          const filteredTimebins = alarm[`${alarmType}_alarm_timebins`].filter(
            timebin => timebin >= startDateTime && timebin <= endDateTime
          );
          alarm[`${alarmType}_alarm_timebins`] = filteredTimebins;
          allTimebinsEmpty = allTimebinsEmpty && filteredTimebins.length === 0;
        }
      }

      if (allTimebinsEmpty) {
        return null;
      } else {
        for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
          if (isSelected) {
            alarm[`${alarmType}_alarm_counts`] = Array(alarm[`${alarmType}_alarm_timebins`].length).fill(1);
          }
        }
        return alarm;
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
      if (!this.loadingVal) {
        this.$emit('loading', true)
        this.etlAlarms().then((alarms) => {
          this.alarms = alarms
          this.$emit('aggregated-alarms-data-loaded', this.alarms)
          this.$emit('loading', false)
        }).catch(error => {
          console.error(error)
        })
      }
    },

    etlAlarms() {
      return new Promise((resolve, reject) => {
        const { extractedAlarms } = this
        this.transformAlarms(extractedAlarms.hegemoneyAlarms, extractedAlarms.networkDelayAlarms, extractedAlarms.gripAlarms).then((alarms) => {
          this.loadAndDisplayWorldMap(alarms, this.alarmCountsSelected)
          resolve(alarms)
        }).catch(error => {
          reject(error)
        })
      })
    },

    transformAlarms(hegemonyAlarms, networkDelayAlarms, gripAlarms) {
      const request = () => {
        return new Promise((resolve, reject) => {
          const ihrAlarms = this.transformIHRAlarms(hegemonyAlarms, networkDelayAlarms)
          const gripAlarmsTransformed = this.alarmDataSourcesFilter.grip ? this.transformGRIPAlarms(gripAlarms) : []
          const ihrAggregatedAttrsFlattened = this.flattenDictionary(this.ihrAggregatedAttrs)
          const alarmsWithGripOptional = this.alarmDataSourcesFilter.grip ? this.fullOuterJoinAlarms(ihrAlarms, gripAlarmsTransformed, ihrAggregatedAttrsFlattened, this.gripAggregatedAttrs) : ihrAlarms
          if (this.alarms) {
            const dataContainsSelectedAlarmTypes = this.dictionaryContainsKeys(Object.values(this.alarms)[0], this.alarmCountsSelected)
            if (dataContainsSelectedAlarmTypes) {
              return resolve(this.deepCopy(this.alarms))
            }
          }
          this.transformAlarmsHelper(alarmsWithGripOptional).then((alarms) => {
            resolve(alarms)
          }).catch(error => {
            reject(error)
          })
        })
      }
      return request()
    },
    flattenDictionary(inputDict) {
      let flattenedDict = {};

      for (let key in inputDict) {
        let nestedDict = inputDict[key];
        for (let nestedKey in nestedDict) {
          flattenedDict[nestedKey] = nestedDict[nestedKey];
        }
      }

      return flattenedDict;
    },
    loadAndDisplayWorldMap(alarms, alarmCountsSelected) {
      const totalAlarmsByCountry = this.groupTotalAlarmCountsByCountry(alarms)
      this.addTotalAlarmCountsColumn(totalAlarmsByCountry, alarmCountsSelected)
      const plotlyData = this.getPlotlyData(totalAlarmsByCountry)
      const customHoverData = alarms.length ? this.getZippedCustomHoverData(Object.values(alarmCountsSelected), plotlyData) : []
      this.updateChart(plotlyData, customHoverData);
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
            ...this.deepCopy(this.gripAggregatedAttrs)
          };
        }

        switch (event_type) {
          case 'moas':
            this.updateAlarmAggregatedAttrs(acc[asn], curr.timebin, this.severity);
            break;
          case 'submoas':
            this.updateAlarmAggregatedAttrs(acc[asn], curr.timebin, this.severity);
            break;
          case 'defcon':
            this.updateAlarmAggregatedAttrs(acc[asn], curr.timebin, this.severity);
            break;
          case 'edges':
            this.updateAlarmAggregatedAttrs(acc[asn], curr.timebin, this.severity);
            break;
          default:
            break;
        }

        return acc;
      }, {});

      return aggregatedAlarms;
    },

    updateAlarmAggregatedAttrs(alarm, timebin, deviation) {
      const alarmCountsAttr = this.getKeyEndingWithSuffix(alarm, '_alarm_counts')
      const alarmTimebinsAttr = this.getKeyEndingWithSuffix(alarm, '_alarm_timebins')
      const alarmSeveritiesAttr = this.getKeyEndingWithSuffix(alarm, '_alarm_severities')

      alarm[alarmCountsAttr].push(1);
      alarm[alarmTimebinsAttr].push(new Date(timebin));

      let severity;
      if (deviation >= 0 && deviation < 21) {
        severity = 'low';
      } else if (deviation >= 21 && deviation < 80) {
        severity = 'mid';
      } else if (deviation >= 80) {
        severity = 'high';
      } else {
        severity = 'low';
      }

      alarm[alarmSeveritiesAttr].push(severity);
    },

    getKeyEndingWithSuffix(obj, suffix) {
      for (const key in obj) {
        if (key.endsWith(suffix)) {
          return key;
        }
      }
    },

    transformIHRAlarms(hegemonyAlarms, networkDelayAlarms) {
      const hegemonyAlarmsAggregated = this.aggregateIHRAlarms(hegemonyAlarms, this.ihrAggregatedAttrs.HEGEMONY)
      const netDelayAlarms = this.processNetDelayAlarms(networkDelayAlarms)
      const netDelayAlarmsAggregated = this.aggregateIHRAlarms(netDelayAlarms, this.ihrAggregatedAttrs.NETWORK_DELAY)
      const hegemonyNetDelayAlarmsMerged = this.fullOuterJoinAlarms(hegemonyAlarmsAggregated, netDelayAlarmsAggregated, this.ihrAggregatedAttrs.HEGEMONY, this.ihrAggregatedAttrs.NETWORK_DELAY)
      return hegemonyNetDelayAlarmsMerged
    },

    processNetDelayAlarms(networkDelayAlarms) {
      return networkDelayAlarms
        .filter(alarm => alarm.startpoint_type === 'AS')
        .map(alarm => ({ ...alarm, asn: alarm.startpoint_name, asn_name: alarm.startpoint_name }));
    },

    aggregateIHRAlarms(alarms, alarmAggregatedAttrs) {
      const alarmsAggregated = alarms.reduce((acc, curr) => {
        const asnNumber = curr.asn
        acc[asnNumber] = acc[asnNumber] || { asn_name: curr.asn_name, ...this.deepCopy(alarmAggregatedAttrs) }
        this.updateAlarmAggregatedAttrs(acc[asnNumber], curr.timebin, curr.deviation)
        return acc
      }, {})
      return alarmsAggregated
    },

    transformAlarmsHelper(alarms) {
      const request = () => {
        return new Promise((resolve, reject) => {
          this.addASNNameAndCountryIsoCode2(alarms).then((alarms) => {
            const alarmsWithCountries = this.addCountryIsoCode3AndCountryName(alarms)
            const alarmsList = this.convertAlarmsDictToList(alarmsWithCountries)
            const filteredAlarms = this.filterAlarmsByCountryIsoCode3(alarmsList)
            resolve(filteredAlarms)
          }).catch(error => {
            reject(error)
          })
        })
      }
      return request()
    },

    filterAlarmsByCountryIsoCode3(alarmsList) {
      return Object.values(alarmsList).filter(alarm => alarm.country_iso_code3)
    },

    fullOuterJoinAlarms(alarms1, alarms2, alarmsAggregatedAttrs1, alarmsAggregatedAttrs2) {
      const fullOuterJoin = (alarmsInput, alarmAggregatedAttrs) => {
        const mergedResult = {};
        for (const asnNumber in alarmsInput) {
          const alarmAggregated = alarmsInput[asnNumber];
          const alarmAggregatedAttrsCopied = this.deepCopy(alarmAggregatedAttrs);
          mergedResult[asnNumber] = { ...alarmAggregated, ...alarmAggregatedAttrsCopied };
        }
        return mergedResult
      }

      const updateMergedAlarms = (mergedAlarms, alarmsInput, alarmAggregatedAttrsASNNotFound) => {
        for (const asnNumber in alarmsInput) {
          const alarmAggregated = alarmsInput[asnNumber];
          if (mergedAlarms[asnNumber]) {
            Object.assign(mergedAlarms[asnNumber], alarmAggregated);
          } else {
            const alarmAggregatedAttrsASNNotFoundCopied = this.deepCopy(alarmAggregatedAttrsASNNotFound);
            mergedAlarms[asnNumber] = { ...alarmAggregated, ...alarmAggregatedAttrsASNNotFoundCopied }
          }
        }
      }

      let mergedAlarms = {}

      const mergedAlarms1 = fullOuterJoin(alarms1, alarmsAggregatedAttrs2);
      updateMergedAlarms(mergedAlarms, mergedAlarms1, alarmsAggregatedAttrs2);

      const mergedAlarms2 = fullOuterJoin(alarms2, alarmsAggregatedAttrs1);
      updateMergedAlarms(mergedAlarms, mergedAlarms2, alarmsAggregatedAttrs1);
      return mergedAlarms;
    },

    dictionaryContainsKeys(dictionary, keysList) {
      for (let key in keysList) {
        if (!dictionary.hasOwnProperty(key)) {
          return false;
        }
      }
      return true;
    },

    addASNNameAndCountryIsoCode2(data) {
      const alarms = this.deepCopy(data);
      const asnNumbers = [];
      for (let asnNumber in alarms) {
        const asnName = alarms[asnNumber].asn_name.toString();
        const isValidASNName = asnName.length && isNaN(asnName)
        if (isValidASNName) {
          this.updateASNNameAndCountryIsoCode2(alarms, asnNumber, asnName);
        } else {
          asnNumbers.push(asnNumber);
        }
      }

      const needToGetASNNamesAndIsoCodes = asnNumbers.length > 0;
      if (needToGetASNNamesAndIsoCodes) {
        return this.getASNNamesAndIsoCodes(alarms, asnNumbers);
      } else {
        return Promise.resolve(alarms);
      }
    },

    updateASNNameAndCountryIsoCode2(alarms, asnNumber, asnName) {
      alarms[asnNumber].country_iso_code2 = this.normalizeCountryIsoCode2(asnName);
      alarms[asnNumber].asn_name = this.normalizeASNName(asnName);
    },

    getASNNamesAndIsoCodes(alarms, asnNumbers) {
      return new Promise((resolve, reject) => {
        const asnNumbersCommaSeparated = asnNumbers.join(',');
        this.getASNNameAndCountryIsoCode2Proxy(asnNumbersCommaSeparated)
          .then(asnNamesAndIsoCodes2 => {
            for (const asnNameAndIsoCode2 of asnNamesAndIsoCodes2) {
              const { asn_number } = asnNameAndIsoCode2;
              alarms[asn_number].country_iso_code2 = asnNameAndIsoCode2.country_iso_code2;
              alarms[asn_number].asn_name = asnNameAndIsoCode2.asn_name;
            }
            resolve(alarms);
          })
          .catch(error => {
            console.error('Error retrieving ASN name and country ISO code:', error);
            reject(error);
          });
      });
    },

    dateReviver(_, value) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      if (typeof value === 'string' && dateRegex.test(value)) {
        return new Date(value);
      }
      return value;
    },

    getASNNameAndCountryIsoCode2Proxy(asnNumbersCommaSeperated, maxRetries = 5, delay = 1000) {
      let retries = 0;

      const request = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this.getASNNameAndCountryIsoCode2(asnNumbersCommaSeperated)
              .then(asnNamesAndIsoCodes2 => {
                resolve(asnNamesAndIsoCodes2);
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

    getASNNameAndCountryIsoCode2(asnNumbersCommaSeperated) {
      const asnNamesAndIsoCodes2 = []

      let networkQueryFilter = new NetworkQuery().asNumber(asnNumbersCommaSeperated)
      const request = () => {
        return new Promise((resolve, reject) => {
          this.$ihr_api.network(
            networkQueryFilter,
            results => {
              results.results.forEach(network => {
                for (let asnNumber of asnNumbersCommaSeperated.split(',')) {
                  if (network.number == asnNumber) {
                    const countryIsoCode2 = this.normalizeCountryIsoCode2(network.name)
                    const asnName = this.normalizeASNName(network.name)
                    asnNamesAndIsoCodes2.push({
                      asn_number: asnNumber,
                      asn_name: asnName,
                      country_iso_code2: countryIsoCode2,
                    })
                  }
                }
              })
              resolve(asnNamesAndIsoCodes2)
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

    addCountryIsoCode3AndCountryName(data) {
      const alarms = this.deepCopy(data)
      for (let asnNumber in alarms) {
        const countryCode2 = alarms[asnNumber].country_iso_code2
        Object.assign(alarms[asnNumber], this.getCountryIsoCode3AndName(countryCode2))
      }
      return alarms
    },

    getCountryIsoCode3AndName(countryIsoCode2) {
      const country_iso_code3 = getCountryISOCode3(countryIsoCode2)
      const country_name = getCountryName(countryIsoCode2)
      return { country_iso_code3, country_name }
    },

    addTotalAlarmCountsColumn(alarms, alarmCountsSelected) {
      const alarmsToSum = Object.values(alarmCountsSelected)
      alarms.forEach(alarm => {
        let totalAlarmCounts = 0
        alarmsToSum.forEach(column => {
          totalAlarmCounts += alarm[column]
        });
        alarm.total_alarm_counts = totalAlarmCounts
      });
    },

    convertAlarmsDictToList(alarms) {
      const alarmsCopied = this.deepCopy(alarms)
      for (const asnNumber in alarmsCopied) {
        alarmsCopied[asnNumber].asn = asnNumber;
      }
      const alarmsArray = Object.values(alarmsCopied)
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
          for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
            if (isSelected) {
              existingEntry[`${alarmType}_alarm_counts`] += obj[`${alarmType}_alarm_counts`].length
            }
          }

        } else {
          let alarmsInitial = {
            country_iso_code2: obj.country_iso_code2,
            country_iso_code3: obj.country_iso_code3,
            country_name: obj.country_name,
            total_alarm_counts: obj.total_alarm_counts
          }
          for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
            if (isSelected) {
              alarmsInitial[`${alarmType}_alarm_counts`] = obj[`${alarmType}_alarm_counts`].length
            }
          }
          result.push(alarmsInitial);
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
      this.chart.traces[0]['locations'] = alarms['country_iso_code3'] ? alarms['country_iso_code3'] : []
      this.chart.traces[0]['z'] = alarms['total_alarm_counts'] ? alarms['total_alarm_counts'] : []
      this.chart.traces[0]['text'] = alarms['country_name'] ? alarms['country_name'] : []
      this.chart.traces[0]['hovertemplate'] =
        '<b>%{text}</b><br>' +
        'Total Alarm Counts: %{z}<br>'
      for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
        if (isSelected) {
          this.chart.traces[0]['hovertemplate'] += `${alarmType} Alarm Counts: %{customdata.${alarmType}_alarm_counts}<br>`
        }
      }
    },

    clearMap() {
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