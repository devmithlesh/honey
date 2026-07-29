'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'reviews',
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
        user_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        // Set when the review is tied to a delivered order, which is what makes
        // it a verified purchase.
        order_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        rating: { type: Sequelize.SMALLINT, allowNull: false },
        title: { type: Sequelize.STRING(150), allowNull: true },
        comment: { type: Sequelize.TEXT, allowNull: true },
        // Reviews are held for moderation; only 'approved' rows are public and
        // only they contribute to the product rating aggregates.
        status: {
          type: Sequelize.ENUM('pending', 'approved', 'rejected'),
          allowNull: false,
          defaultValue: 'pending',
        },
        is_verified_purchase: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        admin_note: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }
    );

    // One review per customer per product, enforced in the database rather than
    // only in the service layer.
    await queryInterface.addIndex('reviews', ['product_id', 'user_id'], {
      unique: true,
      name: 'reviews_product_user_unique',
    });
    await queryInterface.addIndex('reviews', ['product_id', 'status'], {
      name: 'reviews_product_status_idx',
    });
    await queryInterface.addIndex('reviews', ['status'], { name: 'reviews_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reviews');
    // Postgres keeps an ENUM type after its table is dropped, which would make
    // a re-run of this migration fail on type already exists.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reviews_status";');
  },
};
