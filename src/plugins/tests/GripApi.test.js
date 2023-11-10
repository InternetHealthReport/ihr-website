import * as GripApiPlugin from '../GripApi';
import Joi from 'joi'

describe('getGripAlarms', () => {
  const timeoutMilliseconds = 10000;
  it('returns valid JSON data with expected schema', async () => {
    const inferenceSchema = Joi.object({
      suspicion_level: Joi.number().required(),
      confidence: Joi.number().optional(),
      explanation: Joi.string().optional(),
      inference_id: Joi.string().optional(),
      labels: Joi.array().items(Joi.string()).optional(),
    });

    const inferenceResultSchema = Joi.object({
      inferences: Joi.array().items(inferenceSchema).optional().allow(null),
      primary_inference: inferenceSchema.required(),
    });

    const summarySchema = Joi.object({
      inference_result: inferenceResultSchema.required(),
      tr_worthy: Joi.boolean().required(),
      victims: Joi.array().items(Joi.string()).required(),
      ases: Joi.array().optional().allow(null),
      attackers: Joi.array().optional().allow(null),
      newcomers: Joi.array().optional().allow(null),
      prefixes: Joi.array().optional().allow(null),
      tags: Joi.array().optional().allow(null),
    });

    const expectedSchema = Joi.array().items(Joi.object({
      summary: summarySchema.required(),
      last_modified_ts: Joi.number().required(),
      event_type: Joi.string().required(),
      asinfo: Joi.object().optional().allow(null),
      debug: Joi.object().optional().allow(null),
      duration: Joi.number().optional().allow(null),
      event_metrics: Joi.object().optional().allow(null),
      finished_ts: Joi.number().optional().allow(null),
      id: Joi.string().optional().allow(null),
      insert_ts: Joi.number().optional().allow(null),
      pfx_events: Joi.array().optional().allow(null),
      tr_metrics: Joi.object().optional().allow(null),
      view_ts: Joi.number().optional().allow(null)
    })).required()

    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setHours(endTime.getHours() - 1);

    const timezone = '';
    const minSuspicionLevel = 80;
    const maxSuspicionLevel = 100;
    const eventType = 'all';
    const onePage = true;
    const gripAlarmsState = { data: null, downloading: false };

    const result = await GripApiPlugin.getGripAlarms(gripAlarmsState, startTime, endTime, timezone, minSuspicionLevel, maxSuspicionLevel, eventType, onePage)

    const { error } = expectedSchema.validate(result);
    expect(error).toBe(undefined);
  }, timeoutMilliseconds);
});
