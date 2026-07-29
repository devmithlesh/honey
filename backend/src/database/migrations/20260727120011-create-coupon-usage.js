'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'coupon_usage',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        coupon_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'coupons', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        user_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        order_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        discount_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    // Guarantees a coupon can be recorded against an order only once, so the
    // per-user limit cannot be bypassed by racing two checkout requests.
    await queryInterface.addIndex('coupon_usage', ['coupon_id', 'order_id'], {
      unique: true,
      name: 'coupon_usage_coupon_order_unique',
    });
    await queryInterface.addIndex('coupon_usage', ['coupon_id', 'user_id'], {
      name: 'coupon_usage_coupon_user_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('coupon_usage');
  },
};
