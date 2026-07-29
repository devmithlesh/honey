'use strict';

const fs = require('fs');
const path = require('path');

const { sequelize } = require('../config/database');

const basename = path.basename(__filename);
const db = {};

/**
 * Auto-loads every model in this directory, then wires associations in a second
 * pass. Two passes are required because an association may reference a model
 * that has not been defined yet when the first file is read.
 */
fs.readdirSync(__dirname)
  .filter(
    (file) => file !== basename && file.endsWith('.js') && !file.startsWith('.')
  )
  .forEach((file) => {
    const defineModel = require(path.join(__dirname, file));
    const model = defineModel(sequelize);
    db[model.name] = model;
  });

Object.values(db).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(db);
  }
});

db.sequelize = sequelize;

module.exports = db;
