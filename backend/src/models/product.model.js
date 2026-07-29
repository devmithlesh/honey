'use strict';

const { Model, DataTypes } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize) => {
  class Product extends Model {
    static associate({ Category, ProductImage, Review, Wishlist, OrderItem, Inventory }) {
      Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
      Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });
      Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
      Product.hasMany(Wishlist, { foreignKey: 'productId', as: 'wishlistedBy' });
      Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
      Product.hasMany(Inventory, { foreignKey: 'productId', as: 'stockMovements' });
    }

    /** Price the customer actually pays. */
    get effectivePrice() {
      const price = Number.parseFloat(this.price);
      const discount = this.discountPrice === null ? null : Number.parseFloat(this.discountPrice);
      return discount !== null && discount > 0 && discount < price ? discount : price;
    }

    get isInStock() {
      return this.stock > 0;
    }

    get isLowStock() {
      return this.stock > 0 && this.stock <= this.lowStockThreshold;
    }
  }

  Product.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      categoryId: { type: DataTypes.INTEGER, allowNull: false },
      name: {
        type: DataTypes.STRING(180),
        allowNull: false,
        validate: { notEmpty: true },
      },
      slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
      sku: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      shortDescription: { type: DataTypes.STRING(300), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      benefits: { type: DataTypes.TEXT, allowNull: true },
      ingredients: { type: DataTypes.TEXT, allowNull: true },
      // DECIMAL columns are returned as strings by the pg driver to preserve
      // precision. Callers format them; they are never coerced to Number here.
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      discountPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 },
      },
      weight: { type: DataTypes.STRING(50), allowNull: true },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
      isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ratingAverage: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      metaTitle: { type: DataTypes.STRING(180), allowNull: true },
      metaDescription: { type: DataTypes.STRING(300), allowNull: true },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      underscored: true,
      timestamps: true,
      paranoid: true,
      validate: {
        // Mirrors the products_discount_price_valid CHECK constraint so the API
        // returns a readable 422 instead of a raw database error.
        discountBelowPrice() {
          if (this.discountPrice === null || this.discountPrice === undefined) return;
          if (Number.parseFloat(this.discountPrice) >= Number.parseFloat(this.price)) {
            throw new Error('Discount price must be lower than the regular price');
          }
        },
      },
      hooks: {
        beforeValidate: (product) => {
          if (!product.slug && product.name) {
            product.slug = slugify(product.name, { lower: true, strict: true });
          }
          if (product.sku) product.sku = String(product.sku).trim().toUpperCase();
        },
      },
    }
  );

  return Product;
};
