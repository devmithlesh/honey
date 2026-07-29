'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Setting extends Model {
    /**
     * Values are stored as TEXT, so `valueType` drives the cast back to the
     * shape the application expects.
     */
    get typedValue() {
      const raw = this.settingValue;
      if (raw === null || raw === undefined) return null;

      switch (this.valueType) {
        case 'number': {
          const parsed = Number.parseFloat(raw);
          return Number.isFinite(parsed) ? parsed : null;
        }
        case 'boolean':
          return ['true', '1', 'yes'].includes(String(raw).toLowerCase());
        case 'json':
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        default:
          return raw;
      }
    }
  }

  Setting.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      settingKey: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      settingValue: { type: DataTypes.TEXT, allowNull: true },
      valueType: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
        allowNull: false,
        defaultValue: 'string',
      },
      settingGroup: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'general' },
      label: { type: DataTypes.STRING(150), allowNull: true },
      isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'Setting',
      tableName: 'settings',
      underscored: true,
      timestamps: true,
      scopes: {
        public: { where: { isPublic: true } },
      },
    }
  );

  return Setting;
};
