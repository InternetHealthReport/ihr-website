import * as AggregatedAlarmsUtils from '../AggregatedAlarmsUtils'
import * as AggregatedAlarmsDataModel from '../AggregatedAlarmsDataModel'

const HEGEMONY_ALARMS_MOCKED = [
  {
    'timebin': '2023-08-10T00:00:00Z',
    'originasn': 34467,
    'asn': 400480,
    'deviation': 52.3119707131186,
    'af': 4,
    'asn_name': 'G12-CORE-ASN, US',
    'originasn_name': 'SOTCOM-AS JSC Telephone Company "Sotcom", RU'
  },
  {
    'timebin': '2023-08-10T00:00:00Z',
    'originasn': 34469,
    'asn': 400480,
    'deviation': 52.3119707131186,
    'af': 4,
    'asn_name': 'G12-CORE-ASN, US',
    'originasn_name': 'CONNETRO-AS CONNET - RO SRL, RO'
  }
]

const NETWORK_DELAY_ALARMS_MOCKED = [
  {
    'timebin': '2023-08-10T00:15:00Z',
    'startpoint_type': 'AS',
    'startpoint_name': '34467',
    'startpoint_af': 4,
    'endpoint_type': 'AS',
    'endpoint_name': '0',
    'endpoint_af': 4,
    'deviation': 51.6704803785636
  },
  {
    'timebin': '2023-08-10T00:15:00Z',
    'startpoint_type': 'Country',
    'startpoint_name': 'Egypt',
    'startpoint_af': 4,
    'endpoint_type': 'Country',
    'endpoint_name': 'America',
    'endpoint_af': 4,
    'deviation': 56.6704803785636
  },
]

const GRIP_ALARMS_MOCKED = [
  {
    'event_type': 'moas',
    'finished_ts': 1691663400,
    'id': 'moas-1691663100-328892_60064',
    'insert_ts': 1691664977,
    'last_modified_ts': 1691666126,
    'summary': {
      'inference_result': {
        'inferences': [
          {
            'suspicion_level': 80
          }
        ],
        'primary_inference': {
          'suspicion_level': 80
        }
      },
      'tr_worthy': true,
      'victims': [
        '34467'
      ]
    },
    'view_ts': 1691663100
  }
]

const IODA_ALARMS_MOCKED = [
  {
    'datasource': 'bgp',
    'entity': {
      'code': '36040',
      'name': 'AS36040 (YOUTUBE)',
      'type': 'asn',
      'attrs': {
        'fqid': 'asn.36040',
        'name': 'YOUTUBE',
        'org': 'Google LLC',
        'ip_count': '11264'
      }
    },
    'time': 1691625600,
    'level': 'critical',
    'condition': '< 0.99',
    'value': 32,
    'historyValue': 33,
    'method': 'median'
  }
]

const IHR_NETWORK_INFO = [
  {
    number: 34467,
    name: 'SOTCOM-AS JSC Telephone Company "Sotcom", RU',
    hegemony: true,
    delay_forwarding: false,
    disco: false
  },
  {
    number: 36040,
    name: 'YOUTUBE, US',
    hegemony: true,
    delay_forwarding: false,
    disco: false
  }
]

const ALARMS_INFO = {
  data_sources: {
    ihr: {
      hegemony_alarm_counts: [],
      hegemony_alarm_timebins: [],
      hegemony_alarm_severities: [],
      network_delay_alarm_counts: [],
      network_delay_alarm_timebins: [],
      network_delay_alarm_severities: []
    },
    grip: {
      moas_alarm_counts: [],
      moas_alarm_timebins: [],
      moas_alarm_severities: [],
      submoas_alarm_counts: [],
      submoas_alarm_timebins: [],
      submoas_alarm_severities: [],
      defcon_alarm_counts: [],
      defcon_alarm_timebins: [],
      defcon_alarm_severities: [],
      edges_alarm_counts: [],
      edges_alarm_timebins: [],
      edges_alarm_severities: [],
    },
    ioda: {
      ping_slash24_alarm_counts: [],
      ping_slash24_alarm_timebins: [],
      ping_slash24_alarm_severities: [],
      bgp_alarm_counts: [],
      bgp_alarm_timebins: [],
      bgp_alarm_severities: [],
      ucsd_nt_alarm_counts: [],
      ucsd_nt_alarm_timebins: [],
      ucsd_nt_alarm_severities: [],
    }
  },
  metadata: {
    data_sources: {
      ihr: {
        alarm_types: {
          hegemony: {
            description: 'Hegemony Alarm Type',
            showHelpModal: false
          },
          network_delay: {
            description: 'Network Delay Alarm Type',
            showHelpModal: false
          }
        },
        description: 'IHR Data Source',
        showHelpModal: false
      },
      grip: {
        alarm_types: {
          moas: {
            description: 'Moas Alarm Type',
            showHelpModal: false
          },
          submoas: {
            description: 'Submoas Alarm type',
            showHelpModal: false
          },
          defcon: {
            description: 'Defcon Alarm Type',
            showHelpModal: false
          },
          edges: {
            description: 'Edges Alarm Type',
            showHelpModal: false
          },
        },
        description: 'Grip Data Source',
        showHelpModal: false
      },
      ioda: {
        alarm_types: {
          ping_slash24: {
            description: 'Ping Slash24 Alarm Type',
            showHelpModal: false
          },
          bgp: {
            description: 'BGP Alarm Type',
            showHelpModal: false
          },
          ucsd_nt: {
            description: 'UCSD NT Alarm Type',
            showHelpModal: false
          },
        },
        description: 'IODA Data Source',
        showHelpModal: false
      }
    }

  }
}

jest.mock('../../plugins/GripApi', () => ({
  getGripAlarms: jest.fn().mockResolvedValue(GRIP_ALARMS_MOCKED),
}));

jest.mock('../../plugins/IodaApi', () => ({
  getIodaAlarms: jest.fn().mockResolvedValue(IODA_ALARMS_MOCKED),
}));

jest.mock('../NetworkIhr', () => ({
  getNetworkInfo: jest.fn().mockResolvedValue(IHR_NETWORK_INFO)
}));

describe('etlAggregatedAlarmsDataModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const timeoutMilliseconds = 10000;
  it('should correctly ETL AggregatedAlarmsDataModel for IHR, Grip, and IODA when all data sources are selected', async () => {
    const dataSourcesMetadata = ALARMS_INFO.metadata.data_sources
    const dataSourcesSelected = { 'ihr': true, 'grip': true, 'ioda': true }
    const thirdPartyAlarmsStates = { grip: { downloading: false, data: null }, ioda: { downloading: false, data: null } };

    const aggregatedAttrs = Object.values(ALARMS_INFO.data_sources)
    const aggregatedAttrsFlattened = AggregatedAlarmsUtils.flattenDictionary(aggregatedAttrs)

    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setHours(endTime.getHours() - 1);

    const result = await AggregatedAlarmsDataModel.etl(dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsFlattened, HEGEMONY_ALARMS_MOCKED, NETWORK_DELAY_ALARMS_MOCKED, thirdPartyAlarmsStates, startTime, endTime)

    const expectedResult =
            [
              {
                asn_name: 'SOTCOM-AS JSC Teleph (AS34467)',
                asn: '34467',
                country_iso_code2: 'RU',
                hegemony_alarm_counts: [1],
                hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
                hegemony_alarm_severities: ['high'],
                network_delay_alarm_counts: [1],
                network_delay_alarm_timebins: ['2023-08-10T00:15:00Z'],
                network_delay_alarm_severities: ['high'],
                moas_alarm_counts: [1],
                moas_alarm_timebins: ['2023-08-10T11:15:00Z'],
                moas_alarm_severities: ['high'],
                submoas_alarm_counts: [],
                submoas_alarm_timebins: [],
                submoas_alarm_severities: [],
                defcon_alarm_counts: [],
                defcon_alarm_timebins: [],
                defcon_alarm_severities: [],
                edges_alarm_counts: [],
                edges_alarm_timebins: [],
                edges_alarm_severities: [],
                ping_slash24_alarm_counts: [],
                ping_slash24_alarm_timebins: [],
                ping_slash24_alarm_severities: [],
                bgp_alarm_counts: [],
                bgp_alarm_timebins: [],
                bgp_alarm_severities: [],
                ucsd_nt_alarm_counts: [],
                ucsd_nt_alarm_timebins: [],
                ucsd_nt_alarm_severities: [],
                country_iso_code3: 'RUS',
                country_name: 'Russia'
              },
              {
                asn_name: 'CONNETRO-AS CONNET - (AS34469)',
                asn: '34469',
                country_iso_code2: 'RO',
                hegemony_alarm_counts: [1],
                hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
                hegemony_alarm_severities: ['high'],
                network_delay_alarm_counts: [],
                network_delay_alarm_timebins: [],
                network_delay_alarm_severities: [],
                moas_alarm_counts: [],
                moas_alarm_timebins: [],
                moas_alarm_severities: [],
                submoas_alarm_counts: [],
                submoas_alarm_timebins: [],
                submoas_alarm_severities: [],
                defcon_alarm_counts: [],
                defcon_alarm_timebins: [],
                defcon_alarm_severities: [],
                edges_alarm_counts: [],
                edges_alarm_timebins: [],
                edges_alarm_severities: [],
                ping_slash24_alarm_counts: [],
                ping_slash24_alarm_timebins: [],
                ping_slash24_alarm_severities: [],
                bgp_alarm_counts: [],
                bgp_alarm_timebins: [],
                bgp_alarm_severities: [],
                ucsd_nt_alarm_counts: [],
                ucsd_nt_alarm_timebins: [],
                ucsd_nt_alarm_severities: [],
                country_iso_code3: 'ROU',
                country_name: 'Romania'
              },
              {
                asn_name: 'YOUTUBE (AS36040)',
                asn: '36040',
                country_iso_code2: 'US',
                ping_slash24_alarm_counts: [],
                ping_slash24_alarm_timebins: [],
                ping_slash24_alarm_severities: [],
                bgp_alarm_counts: [1],
                bgp_alarm_timebins: ['2023-08-10T00:00:00Z'],
                bgp_alarm_severities: ['high'],
                ucsd_nt_alarm_counts: [],
                ucsd_nt_alarm_timebins: [],
                ucsd_nt_alarm_severities: [],
                hegemony_alarm_counts: [],
                network_delay_alarm_counts: [],
                moas_alarm_counts: [],
                submoas_alarm_counts: [],
                defcon_alarm_counts: [],
                edges_alarm_counts: [],
                hegemony_alarm_timebins: [],
                network_delay_alarm_timebins: [],
                moas_alarm_timebins: [],
                submoas_alarm_timebins: [],
                defcon_alarm_timebins: [],
                edges_alarm_timebins: [],
                hegemony_alarm_severities: [],
                network_delay_alarm_severities: [],
                moas_alarm_severities: [],
                submoas_alarm_severities: [],
                defcon_alarm_severities: [],
                edges_alarm_severities: [],
                country_iso_code3: 'USA',
                country_name: 'United States'
              }
            ]

    expect(result).toEqual(expectedResult)
  }, timeoutMilliseconds);

  it('should correctly ETL AggregatedAlarmsDataModel for IHR only', async () => {
    const dataSourcesMetadata = ALARMS_INFO.metadata.data_sources
    const dataSourcesSelected = { 'ihr': true, 'grip': false, 'ioda': false }
    const thirdPartyAlarmsStates = { grip: { downloading: false, data: null }, ioda: { downloading: false, data: null } };

    const aggregatedAttrs = Object.values(ALARMS_INFO.data_sources)
    const aggregatedAttrsFlattened = AggregatedAlarmsUtils.flattenDictionary(aggregatedAttrs)

    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setHours(endTime.getHours() - 1);

    const result = await AggregatedAlarmsDataModel.etl(dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsFlattened, HEGEMONY_ALARMS_MOCKED, NETWORK_DELAY_ALARMS_MOCKED, thirdPartyAlarmsStates, startTime, endTime)


    const expectedResult =
            [
              {
                asn_name: 'SOTCOM-AS JSC Teleph (AS34467)',
                asn: '34467',
                country_iso_code2: 'RU',
                hegemony_alarm_counts: [1],
                hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
                hegemony_alarm_severities: ['high'],
                network_delay_alarm_counts: [1],
                network_delay_alarm_timebins: ['2023-08-10T00:15:00Z'],
                network_delay_alarm_severities: ['high'],
                country_iso_code3: 'RUS',
                country_name: 'Russia'
              },
              {
                asn_name: 'CONNETRO-AS CONNET - (AS34469)',
                asn: '34469',
                country_iso_code2: 'RO',
                hegemony_alarm_counts: [1],
                hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
                hegemony_alarm_severities: ['high'],
                network_delay_alarm_counts: [],
                network_delay_alarm_timebins: [],
                network_delay_alarm_severities: [],
                country_iso_code3: 'ROU',
                country_name: 'Romania'
              }
            ]

    expect(result).toEqual(expectedResult)
  });

  it('should correctly ETL AggregatedAlarmsDataModel for third party alarms only', async () => {
    const dataSourcesMetadata = ALARMS_INFO.metadata.data_sources
    const dataSourcesSelected = { 'ihr': false, 'grip': true, 'ioda': true }
    const thirdPartyAlarmsStates = { grip: { downloading: false, data: null }, ioda: { downloading: false, data: null } };

    const aggregatedAttrs = Object.values(ALARMS_INFO.data_sources)
    const aggregatedAttrsFlattened = AggregatedAlarmsUtils.flattenDictionary(aggregatedAttrs)

    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setHours(endTime.getHours() - 1);

    const result = await AggregatedAlarmsDataModel.etl(dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsFlattened, HEGEMONY_ALARMS_MOCKED, NETWORK_DELAY_ALARMS_MOCKED, thirdPartyAlarmsStates, startTime, endTime)

    const expectedResult =
            [
              {
                asn_name: 'SOTCOM-AS JSC Teleph (AS34467)',
                asn: '34467',
                country_iso_code2: 'RU',
                moas_alarm_counts: [1],
                moas_alarm_timebins: ['2023-08-10T11:15:00Z'],
                moas_alarm_severities: ['high'],
                submoas_alarm_counts: [],
                submoas_alarm_timebins: [],
                submoas_alarm_severities: [],
                defcon_alarm_counts: [],
                defcon_alarm_timebins: [],
                defcon_alarm_severities: [],
                edges_alarm_counts: [],
                edges_alarm_timebins: [],
                edges_alarm_severities: [],
                ping_slash24_alarm_counts: [],
                ping_slash24_alarm_timebins: [],
                ping_slash24_alarm_severities: [],
                bgp_alarm_counts: [],
                bgp_alarm_timebins: [],
                bgp_alarm_severities: [],
                ucsd_nt_alarm_counts: [],
                ucsd_nt_alarm_timebins: [],
                ucsd_nt_alarm_severities: [],
                country_iso_code3: 'RUS',
                country_name: 'Russia'
              },
              {
                asn_name: 'YOUTUBE (AS36040)',
                asn: '36040',
                country_iso_code2: 'US',
                ping_slash24_alarm_counts: [],
                ping_slash24_alarm_timebins: [],
                ping_slash24_alarm_severities: [],
                bgp_alarm_counts: [1],
                bgp_alarm_timebins: ['2023-08-10T00:00:00Z'],
                bgp_alarm_severities: ['high'],
                ucsd_nt_alarm_counts: [],
                ucsd_nt_alarm_timebins: [],
                ucsd_nt_alarm_severities: [],
                moas_alarm_counts: [],
                submoas_alarm_counts: [],
                defcon_alarm_counts: [],
                edges_alarm_counts: [],
                moas_alarm_timebins: [],
                submoas_alarm_timebins: [],
                defcon_alarm_timebins: [],
                edges_alarm_timebins: [],
                moas_alarm_severities: [],
                submoas_alarm_severities: [],
                defcon_alarm_severities: [],
                edges_alarm_severities: [],
                country_iso_code3: 'USA',
                country_name: 'United States'
              }
            ]

    expect(result).toEqual(expectedResult)
  });

  it('should handle the case where there is no alarms selected', async () => {
    const dataSourcesMetadata = ALARMS_INFO.metadata.data_sources
    const dataSourcesSelected = { 'ihr': false, 'grip': false, 'ioda': false }
    const thirdPartyAlarmsStates = { grip: { downloading: false, data: null }, ioda: { downloading: false, data: null } };

    const aggregatedAttrs = Object.values(ALARMS_INFO.data_sources)
    const aggregatedAttrsFlattened = AggregatedAlarmsUtils.flattenDictionary(aggregatedAttrs)

    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setHours(endTime.getHours() - 1);

    const result = await AggregatedAlarmsDataModel.etl(dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsFlattened, HEGEMONY_ALARMS_MOCKED, NETWORK_DELAY_ALARMS_MOCKED, thirdPartyAlarmsStates, startTime, endTime)

    const expectedResult = []

    expect(result).toEqual(expectedResult)
  });

})

describe('filterAlarmsByTime', () => {
  const alarms =
        [
          {
            asn_name: 'SOTCOM-AS JSC Teleph (AS34467)',
            asn: '34467',
            country_iso_code2: 'RU',
            hegemony_alarm_counts: [1],
            hegemony_alarm_timebins: ['2023-08-10T00:00:00Z', '2023-08-10T00:35:00Z'],
            hegemony_alarm_severities: ['high', 'normal'],
            network_delay_alarm_counts: [1, 2],
            network_delay_alarm_timebins: ['2023-08-10T00:15:00Z'],
            network_delay_alarm_severities: ['high'],
            country_iso_code3: 'RUS',
            country_name: 'Russia'
          },
          {
            asn_name: 'CONNETRO-AS CONNET - (AS34469)',
            asn: '34469',
            country_iso_code2: 'RO',
            hegemony_alarm_counts: [1],
            hegemony_alarm_timebins: ['2023-08-10T00:20:00Z'],
            hegemony_alarm_severities: ['high'],
            network_delay_alarm_counts: [],
            network_delay_alarm_timebins: [],
            network_delay_alarm_severities: [],
            country_iso_code3: 'ROU',
            country_name: 'Romania'
          },
          {
            asn_name: 'CONNETRO-AS CONNET - (AS34469)',
            asn: '34469',
            country_iso_code2: 'RO',
            hegemony_alarm_counts: [1],
            hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
            hegemony_alarm_severities: ['high'],
            network_delay_alarm_counts: [],
            network_delay_alarm_timebins: [],
            network_delay_alarm_severities: [],
            country_iso_code3: 'ROU',
            country_name: 'Romania'
          },
        ]
  const startDateTime = '2023-08-10T00:00:00Z';
  const endDateTime = '2023-08-10T00:15:00Z';
  const aggregatedAttrsZipped = [
    [
      'hegemony_alarm_counts',
      'hegemony_alarm_timebins',
      'hegemony_alarm_severities'
    ],
    [
      'network_delay_alarm_counts',
      'network_delay_alarm_timebins',
      'network_delay_alarm_severities'
    ]
  ];

  it('should filter alarms by time range and aggregated attributes', () => {
    const result = AggregatedAlarmsDataModel.filterAlarmsByTime(alarms, startDateTime, endDateTime, aggregatedAttrsZipped);

    const expectedResult =
            [
              {
                asn_name: 'SOTCOM-AS JSC Teleph (AS34467)',
                asn: '34467',
                country_iso_code2: 'RU',
                hegemony_alarm_counts: [1],
                hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
                hegemony_alarm_severities: ['high'],
                network_delay_alarm_counts: [1],
                network_delay_alarm_timebins: ['2023-08-10T00:15:00Z'],
                network_delay_alarm_severities: ['high'],
                country_iso_code3: 'RUS',
                country_name: 'Russia'
              },
              {
                asn_name: 'CONNETRO-AS CONNET - (AS34469)',
                asn: '34469',
                country_iso_code2: 'RO',
                hegemony_alarm_counts: [1],
                hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
                hegemony_alarm_severities: ['high'],
                network_delay_alarm_counts: [],
                network_delay_alarm_timebins: [],
                network_delay_alarm_severities: [],
                country_iso_code3: 'ROU',
                country_name: 'Romania'
              }
            ]

    expect(result).toEqual(expectedResult);
  });

  it('should return an empty array if no alarms match the time range', () => {
    const startTime = '2023-08-11T00:00:00Z'
    const endTime = '2023-08-11T00:15:00Z'
    const filteredAlarms = AggregatedAlarmsDataModel.filterAlarmsByTime(alarms, startTime, endTime, aggregatedAttrsZipped);
    expect(filteredAlarms).toHaveLength(0);
  });

  it('should handle edge case with no aggregated attributes', () => {
    const emptyAggregatedAttrs = [];
    const filteredAlarms = AggregatedAlarmsDataModel.filterAlarmsByTime(alarms, startDateTime, endDateTime, emptyAggregatedAttrs);
    expect(filteredAlarms).toHaveLength(3);
  });
});

describe('filterAlarmsBySeverity', () => {
  const alarms =
        [
          {
            asn_name: 'SOTCOM-AS JSC Teleph (AS34467)',
            asn: '34467',
            country_iso_code2: 'RU',
            hegemony_alarm_counts: [1, 1],
            hegemony_alarm_timebins: ['2023-08-10T00:00:00Z', '2023-08-10T00:35:00Z'],
            hegemony_alarm_severities: ['high', 'normal'],
            network_delay_alarm_counts: [1],
            network_delay_alarm_timebins: ['2023-08-10T00:15:00Z'],
            network_delay_alarm_severities: ['high'],
            country_iso_code3: 'RUS',
            country_name: 'Russia'
          },
          {
            asn_name: 'CONNETRO-AS CONNET - (AS34469)',
            asn: '34469',
            country_iso_code2: 'RO',
            hegemony_alarm_counts: [1],
            hegemony_alarm_timebins: ['2023-08-10T00:20:00Z'],
            hegemony_alarm_severities: ['high'],
            network_delay_alarm_counts: [],
            network_delay_alarm_timebins: [],
            network_delay_alarm_severities: [],
            country_iso_code3: 'ROU',
            country_name: 'Romania'
          },
          {
            asn_name: 'CONNETRO-AS CONNET - (AS34469)',
            asn: '34469',
            country_iso_code2: 'RO',
            hegemony_alarm_counts: [1],
            hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
            hegemony_alarm_severities: ['high'],
            network_delay_alarm_counts: [],
            network_delay_alarm_timebins: [],
            network_delay_alarm_severities: [],
            country_iso_code3: 'ROU',
            country_name: 'Romania'
          },
        ]

  const aggregatedAttrsZipped = [
    [
      'hegemony_alarm_counts',
      'hegemony_alarm_timebins',
      'hegemony_alarm_severities'
    ],
    [
      'network_delay_alarm_counts',
      'network_delay_alarm_timebins',
      'network_delay_alarm_severities'
    ]
  ];

  it('should filter alarms by high severity and aggregated attributes', () => {
    const severitiesSelected = ['high']

    const result = AggregatedAlarmsDataModel.filterAlarmsBySeverity(alarms, severitiesSelected, aggregatedAttrsZipped);

    const expectedResult = [
      {
        asn_name: 'SOTCOM-AS JSC Teleph (AS34467)',
        asn: '34467',
        country_iso_code2: 'RU',
        hegemony_alarm_counts: [1],
        hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
        hegemony_alarm_severities: ['high'],
        network_delay_alarm_counts: [1],
        network_delay_alarm_timebins: ['2023-08-10T00:15:00Z'],
        network_delay_alarm_severities: ['high'],
        country_iso_code3: 'RUS',
        country_name: 'Russia'
      },
      {
        asn_name: 'CONNETRO-AS CONNET - (AS34469)',
        asn: '34469',
        country_iso_code2: 'RO',
        hegemony_alarm_counts: [1],
        hegemony_alarm_timebins: ['2023-08-10T00:20:00Z'],
        hegemony_alarm_severities: ['high'],
        network_delay_alarm_counts: [],
        network_delay_alarm_timebins: [],
        network_delay_alarm_severities: [],
        country_iso_code3: 'ROU',
        country_name: 'Romania'
      },
      {
        asn_name: 'CONNETRO-AS CONNET - (AS34469)',
        asn: '34469',
        country_iso_code2: 'RO',
        hegemony_alarm_counts: [1],
        hegemony_alarm_timebins: ['2023-08-10T00:00:00Z'],
        hegemony_alarm_severities: ['high'],
        network_delay_alarm_counts: [],
        network_delay_alarm_timebins: [],
        network_delay_alarm_severities: [],
        country_iso_code3: 'ROU',
        country_name: 'Romania'
      }
    ]

    expect(result).toEqual(expectedResult)
  });

  it('should filter alarms by multiple severities and aggregated attributes', () => {
    const severitiesSelected = ['high', 'normal'];
    const result = AggregatedAlarmsDataModel.filterAlarmsBySeverity(alarms, severitiesSelected, aggregatedAttrsZipped);

    const expectedResult = alarms

    expect(result).toEqual(expectedResult);
  });


  it('should return an empty array if no alarms match the severity', () => {
    const severitiesSelected = ['not found severity']
    const filteredAlarms = AggregatedAlarmsDataModel.filterAlarmsBySeverity(alarms, severitiesSelected, aggregatedAttrsZipped);
    expect(filteredAlarms).toHaveLength(0);
  });

  it('should handle edge case with no aggregated attributes', () => {
    const severitiesSelected = ['high']
    const emptyAggregatedAttrs = [];
    const filteredAlarms = AggregatedAlarmsDataModel.filterAlarmsBySeverity(alarms, severitiesSelected, emptyAggregatedAttrs);
    const expectedResult = alarms
    expect(filteredAlarms).toEqual(expectedResult);
  });
});
