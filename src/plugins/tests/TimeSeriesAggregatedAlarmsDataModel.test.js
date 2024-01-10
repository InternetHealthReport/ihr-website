import * as TimeSeriesAggregatedAlarmsDataModel from '../models/TimeSeriesAggregatedAlarmsDataModel'
import { ALARMS, ALARM_TYPES_MAP } from './resources/data';

describe('etlTimeSeriesAggregatedAlarmsDataModel', () => {
  it('should correctly ETL TimeSeriesAggregatedAlarmsDataModel when all data sources selected', () => {
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

    const result = TimeSeriesAggregatedAlarmsDataModel.etl(ALARMS, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity)
    const expectedResult = [
      {
        x: [
          '2023-10-20T06:00:00.000Z',
          '2023-10-20T06:05:00.000Z',
          '2023-10-20T06:50:25.000Z',
          '2023-10-20T09:30:26.000Z',
          '2023-10-20T19:15:00.000Z'
        ],
        y: [1, 1, 1, 1, 2],
        name: 'All',
        customdata: [
          {
            hegemony_count: 0,
            network_delay_count: 0,
            network_disconnection_count: 0,
            moas_count: 0,
            defcon_count: 0,
            bgp_count: 1
          },
          {
            hegemony_count: 0,
            network_delay_count: 0,
            network_disconnection_count: 0,
            moas_count: 0,
            defcon_count: 0,
            bgp_count: 1
          },
          {
            hegemony_count: 0,
            network_delay_count: 0,
            network_disconnection_count: 0,
            moas_count: 1,
            defcon_count: 0,
            bgp_count: 0
          },
          {
            hegemony_count: 0,
            network_delay_count: 0,
            network_disconnection_count: 0,
            moas_count: 1,
            defcon_count: 0,
            bgp_count: 0
          },
          {
            hegemony_count: 0,
            network_delay_count: 2,
            network_disconnection_count: 0,
            moas_count: 0,
            defcon_count: 0,
            bgp_count: 0
          }
        ]
      },
      {
        x: [
          '2023-10-20T06:00:00.000Z',
          '2023-10-20T06:05:00.000Z',
          '2023-10-20T06:50:25.000Z',
          '2023-10-20T09:30:26.000Z'
        ],
        y: [1, 1, 1, 1],
        name: 'United States',
        customdata: [
          {
            hegemony_count: 0,
            network_delay_count: 0,
            network_disconnection_count: 0,
            moas_count: 0,
            defcon_count: 0,
            bgp_count: 1
          },
          {
            hegemony_count: 0,
            network_delay_count: 0,
            network_disconnection_count: 0,
            moas_count: 0,
            defcon_count: 0,
            bgp_count: 1
          },
          {
            hegemony_count: 0,
            network_delay_count: 0,
            network_disconnection_count: 0,
            moas_count: 1,
            defcon_count: 0,
            bgp_count: 0
          },
          {
            hegemony_count: 0,
            network_delay_count: 0,
            network_disconnection_count: 0,
            moas_count: 1,
            defcon_count: 0,
            bgp_count: 0
          }
        ]
      },
      {
        x: ['2023-10-20T19:15:00.000Z'],
        y: [2],
        name: 'Venezuela',
        customdata: [
          {
            hegemony_count: 0,
            network_delay_count: 2,
            network_disconnection_count: 0,
            moas_count: 0,
            defcon_count: 0,
            bgp_count: 0
          }
        ]
      }
    ]

    result.forEach((entry, index) => {
      const expectedEntry = expectedResult[index];
      expect(entry).toEqual(expect.objectContaining(expectedEntry))
    });
  });

  it('should handle empty alarms array', () => {
    const alarms = [];
    const aggregatedAttrsZipped = [
      [
        'hegemony_count',
        'hegemony_timebin',
        'hegemony_severity',
        [
          'hegemony_origin_asn_af',
          'hegemony_asn_af'
        ]
      ]
    ];
    const countryName = null; const legend = null; const isASGranularity = false;

    const result = TimeSeriesAggregatedAlarmsDataModel.etl(alarms, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity)

    expect(result).toHaveLength(0);
  });

  it('should handle empty aggregatedAttrsZipped array', () => {
    const aggregatedAttrsZipped = [];
    const countryName = null; const legend = null; const isASGranularity = false;

    const result = TimeSeriesAggregatedAlarmsDataModel.etl(ALARMS, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity)

    expect(result).toHaveLength(0);
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

    const result = TimeSeriesAggregatedAlarmsDataModel.etl(ALARMS, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity);
    const expectedResult = [
      {
        x: ['2023-10-20T06:00:00.000Z', '2023-10-20T06:05:00.000Z'],
        y: [1, 1],
        name: 'All',
        customdata: [{ bgp_count: 1 }, { bgp_count: 1 }]
      },
      {
        x: ['2023-10-20T06:00:00.000Z', '2023-10-20T06:05:00.000Z'],
        y: [1, 1],
        name: 'LVLT-1 (AS1)',
        customdata: [{ bgp_count: 1 }, { bgp_count: 1 }]
      }
    ]

    result.forEach((entry, index) => {
      const expectedEntry = expectedResult[index];
      expect(entry).toEqual(expect.objectContaining(expectedEntry))
    });
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
    const countryName = 'not existing country'; const legend = null; const isASGranularity = false;
    const result = TimeSeriesAggregatedAlarmsDataModel.etl(ALARMS, aggregatedAttrsZipped, countryName, ALARM_TYPES_MAP, legend, isASGranularity)
    expect(result).toHaveLength(0)
  })
})
