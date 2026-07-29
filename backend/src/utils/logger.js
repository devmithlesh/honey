'use strict';

const env = require('../config/env');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = env.isProduction ? LEVELS.info : LEVELS.debug;

const ESC = String.fromCharCode(27);
const COLORS = {
  error: `${ESC}[31m`,
  warn: `${ESC}[33m`,
  info: `${ESC}[36m`,
  debug: `${ESC}[90m`,
  reset: `${ESC}[0m`,
};

const format = (level, message) => {
  const timestamp = new Date().toISOString();
  if (env.isProduction) {
    return `${timestamp} [${level.toUpperCase()}] ${message}`;
  }
  return `${COLORS[level]}${timestamp} [${level.toUpperCase()}]${COLORS.reset} ${message}`;
};

const stringify = (value) => {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const write = (level, stream, args) => {
  if (LEVELS[level] > activeLevel) return;
  const message = args.map(stringify).join(' ');
  stream(format(level, message));
};

/**
 * Minimal level-aware logger. Kept dependency-free so it can be required from
 * anywhere (including config) without creating a circular import.
 */
module.exports = {
  error: (...args) => write('error', console.error, args),
  warn: (...args) => write('warn', console.warn, args),
  info: (...args) => write('info', console.log, args),
  debug: (...args) => write('debug', console.log, args),
};
