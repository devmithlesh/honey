'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'notifications',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        // NULL addresses the notification to the admin console rather than to a
        // specific customer (new order, low stock, review awaiting moderation).
        user_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        type: {
          type: Sequelize.ENUM('order', 'review', 'stock', 'system'),
          allowNull: false,
          defaultValue: 'system',
        },
        title: { type: Sequelize.STRING(180), allowNull: false },
        message: { type: Sequelize.TEXT, allowNull: true },
        // Relative path the notification links to, e.g. /admin/orders/HB-0001.
        link: { type: Sequelize.STRING(255), allowNull: true },
        is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        read_at: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
      name: 'notifications_user_read_idx',
    });
    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'notifications_created_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    // Postgres keeps an ENUM type after its table is dropped, which would make
    // a re-run of this migration fail on type already exists.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  },
};
