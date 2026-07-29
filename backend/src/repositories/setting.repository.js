'use strict';

const { Setting } = require('../models');

/**
 * Settings are a small, read-heavy key/value table. Reads are cached in process
 * memory for a short window so every storefront request does not hit the
 * database for the shipping charge and UPI details.
 */
const CACHE_TTL_MS = 30_000;

let cache = { expiresAt: 0, rows: [] };

const invalidateCache = () => {
  cache = { expiresAt: 0, rows: [] };
};

const findAllRows = async () => {
  const now = Date.now();
  if (cache.expiresAt > now) return cache.rows;

  const rows = await Setting.findAll({ order: [['settingGroup', 'ASC'], ['settingKey', 'ASC']] });
  cache = { expiresAt: now + CACHE_TTL_MS, rows };
  return rows;
};

const findAll = async ({ publicOnly = false } = {}) => {
  const rows = await findAllRows();
  return publicOnly ? rows.filter((row) => row.isPublic) : rows;
};

const findByKey = async (key) => {
  const rows = await findAllRows();
  return rows.find((row) => row.settingKey === key) || null;
};

/**
 * Upserts a batch of `{ key, value }` pairs, keeping the declared `valueType`
 * of any key that already exists.
 */
const upsertMany = async (entries) => {
  const existing = await Setting.findAll();
  const byKey = new Map(existing.map((row) => [row.settingKey, row]));

  await Promise.all(
    entries.map(async ({ key, value, valueType, settingGroup, label, isPublic }) => {
      const row = byKey.get(key);
      const settingValue = value === null || value === undefined ? '' : String(value);

      if (row) {
        row.set({ settingValue });
        if (valueType) row.set({ valueType });
        return row.save();
      }

      return Setting.create({
        settingKey: key,
        settingValue,
        valueType: valueType || 'string',
        settingGroup: settingGroup || 'general',
        label: label || key,
        isPublic: isPublic ?? true,
      });
    })
  );

  invalidateCache();
  return findAll();
};

module.exports = { findAll, findByKey, upsertMany, invalidateCache };
