'use strict';

const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

const commonOptions = {
  dialect: env.db.dialect,
  logging: env.db.logging ? (sql) => logger.debug(sql) : false,
  pool: {
    max: env.db.poolMax,
    min: env.db.poolMin,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    freezeTableName: false,
  },
  dialectOptions: env.db.ssl
    ? {
        ssl: {
          require: true,
          // Supabase's connection pooler serves a certificate for a shared
          // hostname, so the chain cannot be verified against the URI host.
          // The transport is still fully encrypted.
          rejectUnauthorized: false,
        },
      }
    : {},
  timezone: '+00:00',
  benchmark: env.isDevelopment,
};

/**
 * Single shared Sequelize connection. Supabase supplies one connection URI, so
 * that form wins when present; discrete DB_* values are the local fallback.
 */
const sequelize = env.db.url
  ? new Sequelize(env.db.url, commonOptions)
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      ...commonOptions,
      host: env.db.host,
      port: env.db.port,
    });

/**
 * Verifies the database is reachable before the HTTP server accepts traffic.
 * Throws so the caller can decide how to fail.
 */
const connectDatabase = async () => {
  await sequelize.authenticate();
  const target = env.db.url
    ? new URL(env.db.url).host
    : `${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name}`;
  logger.info(`Database connected (${env.db.dialect}): ${target}`);
};

const closeDatabase = async () => {
  await sequelize.close();
  logger.info('Database connection closed');
};

module.exports = { sequelize, connectDatabase, closeDatabase };
