'use strict';

const { Model, DataTypes } = require('sequelize');
const { ORDER_STATUS, ORDER_STATUS_FLOW } = require('../constants');

module.exports = (sequelize) => {
  class Order extends Model {
    static associate({ User, OrderItem, Payment, Coupon, CouponUsage, Review }) {
      Order.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
      Order.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });
      Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
      Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment' });
      Order.hasMany(CouponUsage, { foreignKey: 'orderId', as: 'couponUsages' });
      Order.hasMany(Review, { foreignKey: 'orderId', as: 'reviews' });
    }

    /** Whether `nextStatus` is a legal transition from the current status. */
    canTransitionTo(nextStatus) {
      return (ORDER_STATUS_FLOW[this.status] || []).includes(nextStatus);
    }

    get isCancellable() {
      return ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(this.status);
    }
  }

  Order.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      orderNumber: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      userId: { type: DataTypes.BIGINT, allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
        allowNull: false,
        defaultValue: ORDER_STATUS.PENDING,
      },
      customerName: { type: DataTypes.STRING(120), allowNull: false },
      customerEmail: { type: DataTypes.STRING(190), allowNull: false, validate: { isEmail: true } },
      customerPhone: { type: DataTypes.STRING(20), allowNull: false },
      // Frozen copies, not references — see the migration for the rationale.
      shippingAddress: { type: DataTypes.JSONB, allowNull: false },
      billingAddress: { type: DataTypes.JSONB, allowNull: false },
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      discountTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      shippingTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      grandTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      couponId: { type: DataTypes.INTEGER, allowNull: true },
      couponCode: { type: DataTypes.STRING(50), allowNull: true },
      customerNote: { type: DataTypes.TEXT, allowNull: true },
      adminNote: { type: DataTypes.TEXT, allowNull: true },
      placedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      confirmedAt: { type: DataTypes.DATE, allowNull: true },
      packedAt: { type: DataTypes.DATE, allowNull: true },
      shippedAt: { type: DataTypes.DATE, allowNull: true },
      deliveredAt: { type: DataTypes.DATE, allowNull: true },
      cancelledAt: { type: DataTypes.DATE, allowNull: true },
      cancelReason: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return Order;
};
