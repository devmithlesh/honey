'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'categories',
      {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        // Self-reference for optional sub-categories; a deleted parent promotes
        // its children to top level rather than removing them.
        parent_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'categories', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        name: { type: Sequelize.STRING(120), allowNull: false },
        slug: { type: Sequelize.STRING(150), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        image_url: { type: Sequelize.STRING(500), allowNull: true },
        image_public_id: { type: Sequelize.STRING(255), allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        meta_title: { type: Sequelize.STRING(180), allowNull: true },
        meta_description: { type: Sequelize.STRING(300), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }
    );

    await queryInterface.addIndex('categories', ['slug'], {
      unique: true,
      name: 'categories_slug_unique',
    });
    await queryInterface.addIndex('categories', ['is_active', 'sort_order'], {
      name: 'categories_active_sort_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('categories');
  },
};
