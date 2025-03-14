import * as TableAggregatedAlarmsDataModel from '../models/TableAggregatedAlarmsDataModel'
import { ALARMS_INFO } from '../metadata/AggregatedAlarmsMetadata'
import { ALARMS } from './resources/data'

describe('etlTableAggregatedAlarmsDataModel', () => {
  it('should correctly ETL TableAggregatedAlarmsDataModel when all data sources selected', () => {
    const selectedAlarmType = 'bgp'
    const selectedDataSource = 'ioda'
    const bgpTableColumns = ALARMS_INFO.ioda.alarm_types.bgp.metadata.table_columns
    const bgpTableAggregatedColumns =
      ALARMS_INFO.ioda.alarm_types.bgp.metadata.table_aggregated_columns
    const key = 'entity'
    const alternativeKey = null
    const severitiesSelectedList = ['low', 'medium', 'high']

    const result = TableAggregatedAlarmsDataModel.etl(
      ALARMS,
      selectedAlarmType,
      selectedDataSource,
      bgpTableColumns,
      bgpTableAggregatedColumns,
      key,
      alternativeKey,
      severitiesSelectedList
    )

    const expectedResult = {
      1: {
        bgp_entity: [1, 1],
        bgp_entity_type: ['asn', 'asn'],
        bgp_entity_name: ['LVLT-1', 'LVLT-1'],
        bgp_entity_country: ['United States of America', 'United States of America'],
        bgp_entity_country_iso_code2: ['US', 'US'],
        bgp_entity_country_iso_code3: ['USA', 'USA'],
        bgp_entity_af: ['4, 6', '4, 6'],
        bgp_entity_ip_count: [11416, 11416],
        bgp_entity_alarm_type: ['bgp', 'bgp'],
        bgp_condition: ['normal', '< 0.99'],
        bgp_value: [58, 56],
        bgp_historical_value: [57, 57],
        bgp_severity: ['medium', 'high'],
        bgp_timebin: [1697781600, 1697781900],
        bgp_count: [1, 1],
        bgp_key: 'entity',
        asn_overview: false,
        country_overview: false,
        entity: 'AS1',
        entity_name: 'LVLT-1',
        entity_af: '4/6',
        entity_country: 'United States of America',
        entity_country_iso_code3: 'USA',
        entity_ip_count: 11416,
        value_avg_percentage: 98.28,
        historical_value_avg_percentage: 100,
        value_median_percentage: 98.28,
        historical_value_median_percentage: 100,
        value_median: 57,
        historical_value_median: 57,
        value_avg: 57,
        historical_value_avg: 57,
        total_count: 2,
        high_severity_count: 1,
        medium_severity_count: 1,
        low_severity_count: 0,
        key_name_truncated: 'LVLT-1 (AS1)',
        key_normalized: 1,
        entity_type: ['asn', 'asn'],
        entity_country_iso_code2: ['US', 'US'],
        entity_alarm_type: ['bgp', 'bgp'],
        condition: ['normal', '< 0.99'],
        value: [58, 56],
        historical_value: [57, 57],
        severity: ['medium', 'high'],
        timebin: [1697781600, 1697781900],
        count: [1, 1],
        key: 'entity'
      }
    }
    expect(result[0]).toEqual(expect.objectContaining(expectedResult))
  })

  it('should handle empty alarms array', () => {
    const selectedAlarmType = 'bgp'
    const selectedDataSource = 'ioda'
    const bgpTableColumns = ALARMS_INFO.ioda.alarm_types.bgp.metadata.table_columns
    const bgpTableAggregatedColumns =
      ALARMS_INFO.ioda.alarm_types.bgp.metadata.table_aggregated_columns
    const key = 'entity'
    const alternativeKey = null
    const severitiesSelectedList = ['low', 'medium', 'high']

    const result = TableAggregatedAlarmsDataModel.etl(
      [],
      selectedAlarmType,
      selectedDataSource,
      bgpTableColumns,
      bgpTableAggregatedColumns,
      key,
      alternativeKey,
      severitiesSelectedList
    )

    expect(result[0]).toEqual({})
  })

  it('should handle empty severities array', () => {
    const selectedAlarmType = 'bgp'
    const selectedDataSource = 'ioda'
    const bgpTableColumns = ALARMS_INFO.ioda.alarm_types.bgp.metadata.table_columns
    const bgpTableAggregatedColumns =
      ALARMS_INFO.ioda.alarm_types.bgp.metadata.table_aggregated_columns
    const key = 'entity'
    const alternativeKey = null
    const severitiesSelectedList = []

    const result = TableAggregatedAlarmsDataModel.etl(
      [],
      selectedAlarmType,
      selectedDataSource,
      bgpTableColumns,
      bgpTableAggregatedColumns,
      key,
      alternativeKey,
      severitiesSelectedList
    )

    expect(result[0]).toEqual({})
  })
})
