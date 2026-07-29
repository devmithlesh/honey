'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'product_images',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        product_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'products', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        url: { type: Sequelize.STRING(500), allowNull: false },
        // Cloudinary public_id, required to delete or replace the remote asset.
        public_id: { type: Sequelize.STRING(255), allowNull: true },
        alt_text: { type: Sequelize.STRING(200), allowNull: true },
        is_primary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addIndex('product_images', ['product_id', 'sort_order'], {
      name: 'product_images_product_sort_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
  },
};
