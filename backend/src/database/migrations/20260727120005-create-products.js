'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'products',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        category_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'categories', key: 'id' },
          onUpdate: 'CASCADE',
          // Deleting a category that still holds products would orphan the
          // catalogue; the admin must move or remove the products first.
          onDelete: 'RESTRICT',
        },
        name: { type: Sequelize.STRING(180), allowNull: false },
        slug: { type: Sequelize.STRING(200), allowNull: false },
        sku: { type: Sequelize.STRING(64), allowNull: false },
        short_description: { type: Sequelize.STRING(300), allowNull: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        benefits: { type: Sequelize.TEXT, allowNull: true },
        ingredients: { type: Sequelize.TEXT, allowNull: true },
        // DECIMAL, never FLOAT: binary floating point cannot represent money
        // exactly and the rounding error compounds across order totals.
        price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        discount_price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
        // Net weight of this SKU, e.g. "500 g". Distinct pack sizes are modelled
        // as separate products so each carries its own stock, price and SKU.
        weight: { type: Sequelize.STRING(50), allowNull: true },
        stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        low_stock_threshold: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 10,
        },
        is_featured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        // Denormalised review aggregates, recalculated whenever a review is
        // approved, edited or removed. Avoids a GROUP BY on every listing.
        rating_average: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
        rating_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        meta_title: { type: Sequelize.STRING(180), allowNull: true },
        meta_description: { type: Sequelize.STRING(300), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }
    );

    await queryInterface.addIndex('products', ['slug'], {
      unique: true,
      name: 'products_slug_unique',
    });
    await queryInterface.addIndex('products', ['sku'], {
      unique: true,
      name: 'products_sku_unique',
    });
    await queryInterface.addIndex('products', ['category_id'], {
      name: 'products_category_id_idx',
    });
    // Supports the default shop listing: active products, featured first.
    await queryInterface.addIndex('products', ['is_active', 'is_featured'], {
      name: 'products_active_featured_idx',
    });
    await queryInterface.addIndex('products', ['price'], { name: 'products_price_idx' });
    await queryInterface.addIndex('products', ['rating_average'], {
      name: 'products_rating_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
