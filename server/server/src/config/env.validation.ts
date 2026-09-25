import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),
  DATABASE_URL: Joi.string().allow('').optional(),
  DATABASE_SSL: Joi.boolean().truthy('true').falsy('false').default(true),
  DATABASE_POOL_MAX: Joi.number().positive().default(5),
  JOB_POLL_INTERVAL_MS: Joi.number().positive().default(2000),
  JOB_PROCESSOR_ENABLED: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false),
  SUPABASE_URL: Joi.string().allow('').optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow('').optional(),
  SUPABASE_STORAGE_BUCKET: Joi.string().default('quotation-files'),
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_MODEL: Joi.string().allow('').optional(),
  AI_REQUEST_TIMEOUT_MS: Joi.number().positive().default(120000),
});

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });
  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
  return value as Record<string, unknown>;
}
