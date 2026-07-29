'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Wishlist extends Model {
    static associate({ User, Product }) {
      Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      Wishlist.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  Wishlist.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.BIGINT, allowNull: false },
      productId: { type: DataTypes.BIGINT, allowNull: false },
    },
    {
      sequelize,
      modelName: 'Wishlist',
      tableName: 'wishlist',
      underscored: true,
      timestamps: true,
    }
  );

  return Wishlist;
};
