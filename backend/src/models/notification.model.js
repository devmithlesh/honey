'use strict';

const { Model, DataTypes } = require('sequelize');
const { NOTIFICATION_TYPE } = require('../constants');

module.exports = (sequelize) => {
  class Notification extends Model {
    static associate({ User }) {
      Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Notification.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      // NULL targets the admin console rather than a specific customer.
      userId: { type: DataTypes.BIGINT, allowNull: true },
      type: {
        type: DataTypes.ENUM(...Object.values(NOTIFICATION_TYPE)),
        allowNull: false,
        defaultValue: NOTIFICATION_TYPE.SYSTEM,
      },
      title: { type: DataTypes.STRING(180), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: true },
      link: { type: DataTypes.STRING(255), allowNull: true },
      isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      underscored: true,
      timestamps: true,
    }
  );

  return Notification;
};
