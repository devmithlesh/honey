'use strict';

const { Model, DataTypes } = require('sequelize');
const { INVENTORY_REASON } = require('../constants');

module.exports = (sequelize) => {
  class Inventory extends Model {
    static associate({ Product, User }) {
      Inventory.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
      Inventory.belongsTo(User, { foreignKey: 'createdBy', as: 'actor' });
    }
  }

  Inventory.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      productId: { type: DataTypes.BIGINT, allowNull: false },
      // Signed: negative when stock leaves, positive on restock.
      changeQuantity: { type: DataTypes.INTEGER, allowNull: false },
      stockAfter: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.ENUM(...Object.values(INVENTORY_REASON)), allowNull: false },
      referenceType: { type: DataTypes.STRING(50), allowNull: true },
      referenceId: { type: DataTypes.BIGINT, allowNull: true },
      note: { type: DataTypes.STRING(255), allowNull: true },
      createdBy: { type: DataTypes.BIGINT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Inventory',
      tableName: 'inventory',
      underscored: true,
      timestamps: true,
    }
  );

  return Inventory;
};
