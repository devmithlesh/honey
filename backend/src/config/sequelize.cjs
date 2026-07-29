'use strict';

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

/**
 * Configuration consumed by `sequelize-cli` (migrations, seeders, db:create).
 *
 * The CLI loads this file directly and cannot use the Joi-validated `env.js`,
 * so it reads `process.env` with conservative fallbacks. The runtime connection
 * lives in `database.js` — keep the two in sync when adding options.
 */
const toBool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const useSsl = toBool(process.env.DB_SSL);

const base = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'honeybee',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  logging: toBool(process.env.DB_LOGGING) ? console.log : false,
  define: {
    underscored: true,
    freezeTableName: false,
  },
  dialectOptions: useSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
};

// A DATABASE_URL (as issued by Supabase) overrides the discrete values above.
const withUrl = (config) =>
  process.env.DATABASE_URL ? { ...config, url: process.env.DATABASE_URL } : config;

module.exports = {
  development: withUrl({ ...base }),
  test: withUrl({ ...base, database: `${base.database}_test`, logging: false }),
  production: withUrl({
    ...base,
    logging: false,
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      acquire: 30000,
      idle: 10000,
    },
  }),
};
