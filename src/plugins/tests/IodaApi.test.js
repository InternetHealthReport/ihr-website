import * as IodaApiPlugin from '../IodaApi'
import Joi from 'joi'

describe('getIodaAlarms', () => {
  const timeoutMilliseconds = 10000;
  it('returns valid JSON data with expected schema', async () => {
    const entitySchema = Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required(),
      attrs: Joi.object().optional().allow(null),
      type: Joi.string().optional().allow(null),
    })

    const expectedSchema = Joi.array().items(
      Joi.object({
        datasource: Joi.string().required(),
        entity: entitySchema.required(),
        time: Joi.number().integer().required(),
        level: Joi.string().required(),
        value: Joi.number().required(),
        historyValue: Joi.number().required(),
        condition: Joi.string().optional().allow(null),
        method: Joi.string().optional().allow(null)
      })
    );

    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setHours(endTime.getHours() - 1);

    const iodaAlarmsState = { data: null, downloading: false }

    const result = await IodaApiPlugin.getIodaAlarms(iodaAlarmsState, startTime, endTime)

    const { error } = expectedSchema.validate(result);
    expect(error).toBe(undefined);
  }, timeoutMilliseconds)
})
