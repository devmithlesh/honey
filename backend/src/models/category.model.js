'use strict';

const { Model, DataTypes } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize) => {
  class Category extends Model {
    static associate({ Category: Self, Product }) {
      Category.belongsTo(Self, { foreignKey: 'parentId', as: 'parent' });
      Category.hasMany(Self, { foreignKey: 'parentId', as: 'children' });
      Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
    }
  }

  Category.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      parentId: { type: DataTypes.INTEGER, allowNull: true },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true },
      },
      slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      imageUrl: { type: DataTypes.STRING(500), allowNull: true },
      imagePublicId: { type: DataTypes.STRING(255), allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      metaTitle: { type: DataTypes.STRING(180), allowNull: true },
      metaDescription: { type: DataTypes.STRING(300), allowNull: true },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
      underscored: true,
      timestamps: true,
      paranoid: true,
      hooks: {
        // Derive the slug when the admin did not supply one, so URLs are always
        // present and URL-safe.
        beforeValidate: (category) => {
          if (!category.slug && category.name) {
            category.slug = slugify(category.name, { lower: true, strict: true });
          }
        },
      },
    }
  );

  return Category;
};
