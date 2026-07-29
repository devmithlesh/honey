'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'order_items',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        order_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        product_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'products', key: 'id' },
          onUpdate: 'CASCADE',
          // The link is a convenience for "buy again"; the columns below keep
          // the line item readable even after the product is gone.
          onDelete: 'SET NULL',
        },
        product_name: { type: Sequelize.STRING(180), allowNull: false },
        product_sku: { type: Sequelize.STRING(64), allowNull: false },
        product_slug: { type: Sequelize.STRING(200), allowNull: true },
        product_image: { type: Sequelize.STRING(500), allowNull: true },
        weight: { type: Sequelize.STRING(50), allowNull: true },
        // Price actually charged, frozen at checkout — later price changes must
        // never alter what a customer already paid.
        unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        quantity: { type: Sequelize.INTEGER, allowNull: false },
        line_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addIndex('order_items', ['order_id'], {
      name: 'order_items_order_id_idx',
    });
    // Powers the "units sold" and best-seller reports.
    await queryInterface.addIndex('order_items', ['product_id'], {
      name: 'order_items_product_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  },
};
