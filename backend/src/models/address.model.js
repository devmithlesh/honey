'use strict';

const { Model, DataTypes } = require('sequelize');
const { ADDRESS_TYPE } = require('../constants');

module.exports = (sequelize) => {
  class Address extends Model {
    static associate({ User }) {
      Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Address.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.BIGINT, allowNull: false },
      label: { type: DataTypes.STRING(50), allowNull: true },
      fullName: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
      phone: { type: DataTypes.STRING(20), allowNull: false, validate: { notEmpty: true } },
      line1: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      line2: { type: DataTypes.STRING(255), allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
      state: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
      postalCode: { type: DataTypes.STRING(20), allowNull: false, validate: { notEmpty: true } },
      country: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'India' },
      type: {
        type: DataTypes.ENUM(...Object.values(ADDRESS_TYPE)),
        allowNull: false,
        defaultValue: ADDRESS_TYPE.SHIPPING,
      },
      isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      sequelize,
      modelName: 'Address',
      tableName: 'addresses',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return Address;
};
