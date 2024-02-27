import * as TreeMapAggregatedAlarmsDataModel from '../models/TreeMapAggregatedAlarmsDataModel'
import { ALARMS, ALARM_TYPES_MAP } from './resources/data';

describe('etlTreeMapAggregatedAlarmsDataModel', () => {

  it('should correctly ETL TreeMapAggregatedAlarmsDataModel when all data sources selected', () => {

    const aggregatedAttrsZipped = [
      [
        'hegemony_count',
        'hegemony_timebin',
        'hegemony_severity',
        [
          'hegemony_origin_asn_af',
          'hegemony_asn_af'
        ]
      ],
      [
        'network_delay_count',
        'network_delay_timebin',
        'network_delay_severity',
        [
          'network_delay_startpoint_af',
          'network_delay_endpoint_af'
        ]
      ],
      [
        'network_disconnection_count',
        'network_disconnection_timebin',
        'network_disconnection_severity',
        [
          'network_disconnection_stream_af'
        ]
      ],
      [
        'moas_count',
        'moas_timebin',
        'moas_severity',
        [
          'moas_asn_attacker_af',
          'moas_asn_victim_af'
        ]
      ],
      [
        'defcon_count',
        'defcon_timebin',
        'defcon_severity',
        [
          'defcon_asn_attacker_af',
          'defcon_asn_victim_af'
        ]
      ],
      [
        'bgp_count',
        'bgp_timebin',
        'bgp_severity',
        [
          'bgp_entity_af'
        ]
      ]
    ]
    const countryName = null; const legend = null; const isASGranularity = false

    const result = TreeMapAggregatedAlarmsDataModel.etl(ALARMS, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity)

    const expectedResult = {
      ids: [
        'Venezuela',
        'United States',
        'Venezuela-Network Delay',
        'Venezuela-Moas',
        'Venezuela-Bgp',
        'United States-Network Delay',
        'United States-Moas',
        'United States-Bgp',
        'Venezuela-Network Delay-Low',
        'United States-Moas-High',
        'United States-Bgp-High',
        'United States-Bgp-Medium'
      ],
      labels: [
        'Venezuela', 'United States',
        'Network Delay', 'MOAS',
        'BGP', 'Network Delay',
        'MOAS', 'BGP',
        'Low', 'High',
        'High', 'Medium'
      ],
      parents: [
        '',
        '',
        'Venezuela',
        'Venezuela',
        'Venezuela',
        'United States',
        'United States',
        'United States',
        'Venezuela-Network Delay',
        'United States-Moas',
        'United States-Bgp',
        'United States-Bgp'
      ],
      values: [
        0, 0, 0, 0, 0,
        0, 0, 0, 2, 2,
        1, 1
      ],
    }
    expect(result).toEqual(expect.objectContaining(expectedResult))
  });

  it('should handle empty alarms array', () => {
    const alarms = [];
    const aggregatedAttrsZipped = [
      [
        'bgp_count',
        'bgp_timebin',
        'bgp_severity',
        [
          'bgp_entity_af'
        ]
      ]
    ];
    const countryName = null; const legend = null; const isASGranularity = false

    const result = TreeMapAggregatedAlarmsDataModel.etl(alarms, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity)

    expect(result).toEqual({});
  });

  it('should handle empty aggregatedAttrsZipped array', () => {
    const aggregatedAttrsZipped = [];
    const countryName = null; const legend = null; const isASGranularity = false;

    const result = TreeMapAggregatedAlarmsDataModel.etl(ALARMS, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity);

    expect(result).toEqual({});
  });

  it('should handle non-nullable countryName', () => {
    const aggregatedAttrsZipped = [
      [
        'bgp_count',
        'bgp_timebin',
        'bgp_severity',
        [
          'bgp_entity_af'
        ]
      ]
    ];
    const countryName = 'United States'; const legend = null; const isASGranularity = false;

    const result = TreeMapAggregatedAlarmsDataModel.etl(ALARMS, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity);

    const expectedResult = {
      ids: [
        'LVLT-1 (AS1)',
        'LVLT-1 (AS1)-Bgp',
        'LVLT-1 (AS1)-Bgp-Medium',
        'LVLT-1 (AS1)-Bgp-High'
      ],
      labels: [ 'LVLT-1 (AS1)', 'BGP', 'Medium', 'High' ],
      parents: [ '', 'LVLT-1 (AS1)', 'LVLT-1 (AS1)-Bgp', 'LVLT-1 (AS1)-Bgp' ],
      values: [ 0, 0, 1, 1 ],
    }
    expect(result).toEqual(expect.objectContaining(expectedResult))
  });

  it('should handle non-existing country', () => {
    const aggregatedAttrsZipped = [
      [
        'bgp_count',
        'bgp_timebin',
        'bgp_severity',
        [
          'bgp_entity_af'
        ]
      ]
    ];
    const countryName = 'Non-existing Country'; const legend = null; const isASGranularity = false
    const result = TreeMapAggregatedAlarmsDataModel.etl(ALARMS, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity)
    expect(result).toEqual({})
  })

})
