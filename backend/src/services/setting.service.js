'use strict';

const settingRepository = require('../repositories/setting.repository');

/**
 * Settings reach the client as one flat object keyed by setting key, with each
 * value already cast to its declared type — the storefront should never have to
 * know that `shipping_charge` is stored as TEXT.
 */
const toKeyedObject = (rows) =>
  rows.reduce((accumulator, row) => {
    accumulator[row.settingKey] = row.typedValue;
    return accumulator;
  }, {});

const getPublicSettings = async () => {
  const rows = await settingRepository.findAll({ publicOnly: true });
  return toKeyedObject(rows);
};

const getAllSettings = async () => {
  const rows = await settingRepository.findAll();
  return {
    values: toKeyedObject(rows),
    // The grouped form drives the admin settings form (tabs per group).
    groups: rows.reduce((accumulator, row) => {
      const group = row.settingGroup || 'general';
      accumulator[group] = accumulator[group] || [];
      accumulator[group].push({
        key: row.settingKey,
        value: row.typedValue,
        valueType: row.valueType,
        label: row.label,
        isPublic: row.isPublic,
      });
      return accumulator;
    }, {}),
  };
};

const getValue = async (key, fallback = null) => {
  const row = await settingRepository.findByKey(key);
  if (!row) return fallback;
  const value = row.typedValue;
  return value === null || value === '' ? fallback : value;
};

const getNumber = async (key, fallback = 0) => {
  const value = await getValue(key, null);
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getBoolean = async (key, fallback = false) => {
  const value = await getValue(key, null);
  if (value === null) return fallback;
  return value === true || ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

/**
 * Shipping rules the checkout quotes and the order service re-computes
 * server-side, so a tampered client total is always overridden.
 */
const getShippingConfig = async () => {
  const [charge, freeThreshold] = await Promise.all([
    getNumber('shipping_charge', 0),
    getNumber('free_shipping_threshold', 0),
  ]);
  return { charge, freeThreshold };
};

const calculateShipping = (subtotal, { charge, freeThreshold }) => {
  if (subtotal <= 0) return 0;
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return charge;
};

const updateSettings = async (values) => {
  const entries = Object.entries(values).map(([key, value]) => ({ key, value }));
  const rows = await settingRepository.upsertMany(entries);
  return toKeyedObject(rows);
};

module.exports = {
  getPublicSettings,
  getAllSettings,
  getValue,
  getNumber,
  getBoolean,
  getShippingConfig,
  calculateShipping,
  updateSettings,
};
