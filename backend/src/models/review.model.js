'use strict';

const { Model, DataTypes } = require('sequelize');
const { REVIEW_STATUS } = require('../constants');

module.exports = (sequelize) => {
  class Review extends Model {
    static associate({ Product, User, Order }) {
      Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
      Review.belongsTo(User, { foreignKey: 'userId', as: 'author' });
      Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
    }
  }

  Review.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      productId: { type: DataTypes.BIGINT, allowNull: false },
      userId: { type: DataTypes.BIGINT, allowNull: false },
      orderId: { type: DataTypes.BIGINT, allowNull: true },
      rating: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      title: { type: DataTypes.STRING(150), allowNull: true },
      comment: { type: DataTypes.TEXT, allowNull: true },
      // Moderated by default: only approved reviews are public and only they
      // feed the product rating aggregates.
      status: {
        type: DataTypes.ENUM(...Object.values(REVIEW_STATUS)),
        allowNull: false,
        defaultValue: REVIEW_STATUS.PENDING,
      },
      isVerifiedPurchase: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      adminNote: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      sequelize,
      modelName: 'Review',
      tableName: 'reviews',
      underscored: true,
      timestamps: true,
      paranoid: true,
      scopes: {
        approved: { where: { status: REVIEW_STATUS.APPROVED } },
      },
    }
  );

  return Review;
};
