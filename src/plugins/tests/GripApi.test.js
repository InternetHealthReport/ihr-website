import * as GripApiPlugin from '../GripApi';
import Joi from 'joi';

/**
 * Validates that the given result adheres to the expected schema.
 * @param {*} result - The result to validate.
 */
async function validateResultSchema(result) {
  const inferenceSchema = Joi.object({
    suspicion_level: Joi.number().required(),
    confidence: Joi.number().optional(),
    explanation: Joi.string().optional().allow(null, ''),
    inference_id: Joi.string().optional().allow(null, ''),
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

  const expectedSchema = Joi.array()
    .items(
      Joi.object({
        summary: summarySchema.required(),
        last_modified_ts: Joi.number().required(),
        event_type: Joi.string().required(),
        asinfo: Joi.object().optional().allow(null),
        debug: Joi.object().optional().allow(null),
        duration: Joi.number().optional().allow(null),
        event_metrics: Joi.object().optional().allow(null),
        finished_ts: Joi.number().optional().allow(null),
        id: Joi.string().optional().allow(null, ''),
        insert_ts: Joi.number().optional().allow(null),
        pfx_events: Joi.array().optional().allow(null),
        tr_metrics: Joi.object().optional().allow(null),
        view_ts: Joi.number().optional().allow(null),
      })
    )
    .required();

  await expect(result).resolves.toSatisfySchema(expectedSchema);
}

/**
 * Generates dynamic test data for the getGripAlarms function.
 * @returns {Object} - Dynamic test data.
 */
function generateDynamicTestData() {
  const endTime = new Date();
  const startTime = new Date(endTime);
  startTime.setHours(endTime.getHours() - 1);

  return {
    startTime,
    endTime,
    timezone: '',
    minSuspicionLevel: 80,
    maxSuspicionLevel: 100,
    eventType: 'all',
    onePage: true,
  };
}

/**
 * Unit test for the getGripAlarms function.
 */
describe('getGripAlarms', () => {
  const timeoutMilliseconds = 20000;

  it('returns valid JSON data with expected schema', async () => {
    const testData = generateDynamicTestData();
    const result = await GripApiPlugin.getGripAlarms(
      testData.startTime,
      testData.endTime,
      testData.timezone,
      testData.minSuspicionLevel,
      testData.maxSuspicionLevel,
      testData.eventType,
      testData.onePage
    );

    await validateResultSchema(result);
  }, timeoutMilliseconds);
});
