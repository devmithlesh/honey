'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class OrderItem extends Model {
    static associate({ Order, Product }) {
      OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
      OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  OrderItem.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      orderId: { type: DataTypes.BIGINT, allowNull: false },
      // Nullable: the product may be deleted long after the order ships. The
      // snapshot columns below keep the line readable regardless.
      productId: { type: DataTypes.BIGINT, allowNull: true },
      productName: { type: DataTypes.STRING(180), allowNull: false },
      productSku: { type: DataTypes.STRING(64), allowNull: false },
      productSlug: { type: DataTypes.STRING(200), allowNull: true },
      productImage: { type: DataTypes.STRING(500), allowNull: true },
      weight: { type: DataTypes.STRING(50), allowNull: true },
      unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
      lineTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      sequelize,
      modelName: 'OrderItem',
      tableName: 'order_items',
      underscored: true,
      timestamps: true,
    }
  );

  return OrderItem;
};
