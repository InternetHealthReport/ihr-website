import * as WorldMapAggregatedAlarmsDataModel from '../WorldMapAggregatedAlarmsDataModel'
import { ALARMS, ALARM_TYPES_MAP } from './data';

describe('etlWorldMapAggregatedAlarmsDataModel', () => {
  it('should correctly ETL World Map Data Viz when all data sources selected', () => {
    const alarmCountsSelected = ['hegemony_count', 'network_delay_count', 'network_disconnection_count', 'moas_count', 'defcon_count', 'bgp_count']
    const result = WorldMapAggregatedAlarmsDataModel.etl(ALARMS, alarmCountsSelected, ALARM_TYPES_MAP)
    const expectedResult = {
      customdata: [
        {
          hegemony_count: 0,
          network_delay_count: 0,
          network_disconnection_count: 0,
          moas_count: 2,
          defcon_count: 0,
          bgp_count: 2
        },
        {
          hegemony_count: 0,
          network_delay_count: 2,
          network_disconnection_count: 0,
          moas_count: 0,
          defcon_count: 0,
          bgp_count: 0
        }
      ],
      locations: ['USA', 'VEN'],
      z: [4, 2],
    }
    expect(result).toEqual(expect.objectContaining(expectedResult))
  });

  it('should correctly ETL World Map Data Viz with specific alarm counts selected', () => {
    const alarmCountsSelected = ['moas_count', 'bgp_count', 'not_exist_count'];
    const result = WorldMapAggregatedAlarmsDataModel.etl(ALARMS, alarmCountsSelected, ALARM_TYPES_MAP);
    const expectedResult = {
      customdata: [
        { moas_count: 2, bgp_count: 2, not_exist_count: 0 },
        { moas_count: 0, bgp_count: 0, not_exist_count: 0 }
      ],
      locations: ['USA', 'VEN'],
      z: [4, 0]
    }
    expect(result).toEqual(expect.objectContaining(expectedResult))
  });

  it('should handle empty input alarms array', () => {
    const alarms = [];
    const alarmCountsSelected = ['hegemony_count', 'network_delay_count'];
    const result = WorldMapAggregatedAlarmsDataModel.etl(alarms, alarmCountsSelected, ALARM_TYPES_MAP);
    expect(result).toEqual({});
  });

  it('should handle empty alarmCountsSelected but non-empty alarms', () => {
    const alarmCountsSelected = [];
    const result = WorldMapAggregatedAlarmsDataModel.etl(ALARMS, alarmCountsSelected, ALARM_TYPES_MAP);
    expect(result).toEqual({});
  });

  it('should handle alarmCountsSelected that doesnt exist in the alarms data', () => {
    const alarmCountsSelected = ['fake_alarm_counts_selected'];
    const result = WorldMapAggregatedAlarmsDataModel.etl(ALARMS, alarmCountsSelected, ALARM_TYPES_MAP);
    expect(result).toEqual({});
  });
})
