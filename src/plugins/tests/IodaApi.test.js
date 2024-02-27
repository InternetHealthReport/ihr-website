import * as IodaApiPlugin from '../IodaApi';
import Joi from 'joi';

describe('getIodaAlarms', () => {
  const timeoutMilliseconds = 20000;
  it('returns valid JSON data with expected schema', async () => {
    const entitySchema = Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required(),
      attrs: Joi.object().optional().allow(null),
      type: Joi.string().optional().allow(null, ''),
    })

    const expectedSchema = Joi.array().items(
      Joi.object({
        datasource: Joi.string().required(),
        entity: entitySchema.required(),
        time: Joi.number().integer().required(),
        level: Joi.string().required(),
        value: Joi.number().required(),
        historyValue: Joi.number().required(),
        condition: Joi.string().optional().allow(null, ''),
        method: Joi.string().optional().allow(null, '')
      })
    );

    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setHours(endTime.getHours() - 1);

    const result = await IodaApiPlugin.getIodaAlarms(startTime, endTime)

    const { error } = expectedSchema.validate(result);
    expect(error).toBe(undefined);
  }, timeoutMilliseconds)
})

describe('getIodaEntityInfo', () => {
  const timeoutMilliseconds = 20000;
  let asnIodaEntityInfo;
  let countryIodaEntityInfo;

  beforeAll(async () => {
    const endDateTime = new Date();
    const startDateTime = new Date(endDateTime);
    startDateTime.setHours(endDateTime.getHours() - 24);

    const startUnixTime = Math.floor(startDateTime / 1000);
    const endUnixTime = Math.floor(endDateTime / 1000);

    const entityType1 = 'asn'; const entityValue1 = '59127'; const sourceParams1 = 'WEB_SEARCH';
    const entityType2 = 'country'; const entityValue2 = 'US'; const sourceParams2 = 'WEB_SEARCH';

    [asnIodaEntityInfo, countryIodaEntityInfo] = await Promise.all([
      IodaApiPlugin.getIodaEntityInfo(entityType1, entityValue1, startUnixTime, endUnixTime, sourceParams1),
      IodaApiPlugin.getIodaEntityInfo(entityType2, entityValue2, startUnixTime, endUnixTime, sourceParams2),
    ]);
  }, timeoutMilliseconds);

  it('returns valid JSON data with expected schema', () => {
    const val = [
      {
        entityType: 'asn',
        entityCode: '59127',
        entityName: 'AS59127 (NCV)',
        entityFqid: 'asn.59127',
        datasource: 'merit-nt',
        subtype: '',
        from: 1698854400,
        until: 1698941100,
        step: 300,
        nativeStep: 300,
        values: []
      },
      {
        entityType: 'asn',
        entityCode: '59127',
        entityName: 'AS59127 (NCV)',
        entityFqid: 'asn.59127',
        datasource: 'bgp',
        subtype: '',
        from: 1698854400,
        until: 1698941100,
        step: 300,
        nativeStep: 300,
        values: []
      },
      {
        entityType: 'asn',
        entityCode: '59127',
        entityName: 'AS59127 (NCV)',
        entityFqid: 'asn.59127',
        datasource: 'ping-slash24',
        subtype: '',
        from: 1698854400,
        until: 1698941400,
        step: 600,
        nativeStep: 600,
        values: []
      }
    ]

    const dataItemSchema = Joi.object({
      entityType: Joi.string().optional().allow(null, ''),
      entityCode: Joi.string().optional().allow(null, ''),
      entityName: Joi.string().optional().allow(null, ''),
      entityFqid: Joi.string().optional().allow(null, ''),
      datasource: Joi.string().required(),
      subtype: Joi.string().optional().allow(null, ''),
      from: Joi.number().required(),
      until: Joi.number().required(),
      step: Joi.number().optional().allow(null),
      nativeStep: Joi.number().required(),
      values: Joi.array().items(Joi.number().allow(null)).required(),
    });

    const expectedSchema = Joi.array().items(dataItemSchema);

    const result1 = expectedSchema.validate(asnIodaEntityInfo);
    const result2 = expectedSchema.validate(countryIodaEntityInfo);

    expect(result1.error).toBe(undefined);
    expect(result2.error).toBe(undefined);

  })

  it('checks alarm values within the time range', () => {
    const alarmTypesData = [...asnIodaEntityInfo, ...countryIodaEntityInfo]
    for (const alarmTypeData of alarmTypesData) {
      let fromUnixTime = alarmTypeData.from + alarmTypeData.nativeStep
      let untilUnixTime = alarmTypeData.until
      let counter = 0
      while (fromUnixTime <= untilUnixTime) {
        fromUnixTime += alarmTypeData.nativeStep
        counter += 1
      }
      expect(alarmTypeData.values.length).toBe(counter)
    }
  });
})