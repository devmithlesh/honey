'use strict';

const path = require('path');
const Joi = require('joi');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

/**
 * Every environment variable the application understands is declared here and
 * validated once, at boot. A misconfigured deployment fails immediately with a
 * readable message instead of throwing an obscure error on the first request.
 */
// Validate email *format* without checking the TLD against the IANA registry,
// so internal domains (`no-reply@honeybeefarm.local`) remain usable.
const emailRule = Joi.string().email({ tlds: { allow: false } });

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(5000),
  API_PREFIX: Joi.string()
    .pattern(/^\/[a-zA-Z0-9\-/]*$/)
    .default('/api/v1')
    .messages({ 'string.pattern.base': 'API_PREFIX must start with "/"' }),
  APP_NAME: Joi.string().default('Honey Bee Farm'),
  CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Supabase hands out a single connection URI. When DATABASE_URL is present it
  // wins, and the discrete DB_* values below become optional fallbacks for
  // local development.
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).allow('').default(''),
  DB_HOST: Joi.string().when('DATABASE_URL', {
    is: '',
    then: Joi.required(),
    otherwise: Joi.optional().default(''),
  }),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().when('DATABASE_URL', {
    is: '',
    then: Joi.required(),
    otherwise: Joi.optional().default(''),
  }),
  DB_USER: Joi.string().when('DATABASE_URL', {
    is: '',
    then: Joi.required(),
    otherwise: Joi.optional().default(''),
  }),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_DIALECT: Joi.string().valid('postgres').default('postgres'),
  // Supabase terminates TLS and requires SSL on every connection.
  DB_SSL: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),
  DB_POOL_MIN: Joi.number().integer().min(0).default(0),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .invalid(Joi.ref('JWT_ACCESS_SECRET'))
    .messages({ 'any.invalid': 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET' }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_RESET_SECRET: Joi.string()
    .min(32)
    .required()
    .invalid(Joi.ref('JWT_ACCESS_SECRET'), Joi.ref('JWT_REFRESH_SECRET'))
    .messages({ 'any.invalid': 'JWT_RESET_SECRET must differ from the other JWT secrets' }),
  JWT_RESET_EXPIRES_IN: Joi.string().default('15m'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  COOKIE_DOMAIN: Joi.string().allow('').default(''),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(300),
  AUTH_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(10),

  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').default(''),
  CLOUDINARY_API_KEY: Joi.string().allow('').default(''),
  CLOUDINARY_API_SECRET: Joi.string().allow('').default(''),
  CLOUDINARY_FOLDER: Joi.string().default('honeybee'),
  MAX_FILE_SIZE_MB: Joi.number().min(1).max(20).default(5),
  MAX_FILES_PER_UPLOAD: Joi.number().integer().min(1).max(20).default(6),

  SMTP_HOST: Joi.string().allow('').default(''),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM_NAME: Joi.string().default('Honey Bee Farm'),
  MAIL_FROM_ADDRESS: emailRule.default('no-reply@honeybeefarm.local'),

  SEED_ADMIN_NAME: Joi.string().default('Farm Administrator'),
  SEED_ADMIN_EMAIL: emailRule.default('admin@honeybeefarm.local'),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).default('ChangeMe@12345'),
})
  // Allow unrelated variables (PATH, npm_*, CI runners, ...) to pass through.
  .unknown(true);

const { value: parsed, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
  convert: true,
});

if (error) {
  const details = error.details.map((detail) => `  - ${detail.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const isProduction = parsed.NODE_ENV === 'production';

if (isProduction && parsed.COOKIE_SAME_SITE === 'none' && !parsed.COOKIE_SECURE) {
  throw new Error(
    'Invalid environment configuration:\n  - COOKIE_SAME_SITE=none requires COOKIE_SECURE=true'
  );
}

const env = Object.freeze({
  nodeEnv: parsed.NODE_ENV,
  isProduction,
  isDevelopment: parsed.NODE_ENV === 'development',
  isTest: parsed.NODE_ENV === 'test',
  port: parsed.PORT,
  apiPrefix: parsed.API_PREFIX,
  appName: parsed.APP_NAME,
  clientUrl: parsed.CLIENT_URL.replace(/\/+$/, ''),
  corsOrigins: parsed.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),

  db: Object.freeze({
    url: parsed.DATABASE_URL,
    host: parsed.DB_HOST,
    port: parsed.DB_PORT,
    name: parsed.DB_NAME,
    user: parsed.DB_USER,
    password: parsed.DB_PASSWORD,
    dialect: parsed.DB_DIALECT,
    // Supabase's pooler presents a certificate for a shared hostname, so chain
    // verification is disabled while the transport stays encrypted.
    ssl: parsed.DB_SSL,
    logging: parsed.DB_LOGGING,
    poolMax: parsed.DB_POOL_MAX,
    poolMin: parsed.DB_POOL_MIN,
  }),

  jwt: Object.freeze({
    accessSecret: parsed.JWT_ACCESS_SECRET,
    accessExpiresIn: parsed.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: parsed.JWT_REFRESH_SECRET,
    refreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN,
    resetSecret: parsed.JWT_RESET_SECRET,
    resetExpiresIn: parsed.JWT_RESET_EXPIRES_IN,
  }),

  security: Object.freeze({
    bcryptSaltRounds: parsed.BCRYPT_SALT_ROUNDS,
    cookieDomain: parsed.COOKIE_DOMAIN || undefined,
    cookieSecure: parsed.COOKIE_SECURE,
    cookieSameSite: parsed.COOKIE_SAME_SITE,
    rateLimitWindowMs: parsed.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: parsed.RATE_LIMIT_MAX,
    authRateLimitMax: parsed.AUTH_RATE_LIMIT_MAX,
  }),

  cloudinary: Object.freeze({
    cloudName: parsed.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.CLOUDINARY_API_KEY,
    apiSecret: parsed.CLOUDINARY_API_SECRET,
    folder: parsed.CLOUDINARY_FOLDER,
    maxFileSizeBytes: parsed.MAX_FILE_SIZE_MB * 1024 * 1024,
    maxFilesPerUpload: parsed.MAX_FILES_PER_UPLOAD,
    isConfigured: Boolean(
      parsed.CLOUDINARY_CLOUD_NAME && parsed.CLOUDINARY_API_KEY && parsed.CLOUDINARY_API_SECRET
    ),
  }),

  mail: Object.freeze({
    host: parsed.SMTP_HOST,
    port: parsed.SMTP_PORT,
    secure: parsed.SMTP_SECURE,
    user: parsed.SMTP_USER,
    password: parsed.SMTP_PASSWORD,
    fromName: parsed.MAIL_FROM_NAME,
    fromAddress: parsed.MAIL_FROM_ADDRESS,
    isConfigured: Boolean(parsed.SMTP_HOST),
  }),

  seed: Object.freeze({
    adminName: parsed.SEED_ADMIN_NAME,
    adminEmail: parsed.SEED_ADMIN_EMAIL,
    adminPassword: parsed.SEED_ADMIN_PASSWORD,
  }),
});

module.exports = env;
