'use strict';

const { Model, DataTypes } = require('sequelize');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('../constants');

module.exports = (sequelize) => {
  class Payment extends Model {
    static associate({ Order, User }) {
      Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
      Payment.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });
    }
  }

  Payment.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      orderId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
      method: { type: DataTypes.ENUM(...Object.values(PAYMENT_METHOD)), allowNull: false },
      status: {
        type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
        allowNull: false,
        defaultValue: PAYMENT_STATUS.PENDING,
      },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      transactionReference: { type: DataTypes.STRING(120), allowNull: true },
      screenshotUrl: { type: DataTypes.STRING(500), allowNull: true },
      screenshotPublicId: { type: DataTypes.STRING(255), allowNull: true },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      verifiedBy: { type: DataTypes.BIGINT, allowNull: true },
      verifiedAt: { type: DataTypes.DATE, allowNull: true },
      failureReason: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      underscored: true,
      timestamps: true,
    }
  );

  return Payment;
};
