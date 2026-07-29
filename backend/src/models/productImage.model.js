'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProductImage extends Model {
    static associate({ Product }) {
      ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  ProductImage.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      productId: { type: DataTypes.BIGINT, allowNull: false },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: { notEmpty: true },
      },
      publicId: { type: DataTypes.STRING(255), allowNull: true },
      altText: { type: DataTypes.STRING(200), allowNull: true },
      isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'ProductImage',
      tableName: 'product_images',
      underscored: true,
      timestamps: true,
    }
  );

  return ProductImage;
};
