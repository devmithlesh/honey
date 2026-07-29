'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'users',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'roles', key: 'id' },
          onUpdate: 'CASCADE',
          // A role that still has users must not be deletable.
          onDelete: 'RESTRICT',
        },
        name: { type: Sequelize.STRING(120), allowNull: false },
        // 190 chars keeps the unique index within InnoDB limits under utf8mb4.
        email: { type: Sequelize.STRING(190), allowNull: false },
        phone: { type: Sequelize.STRING(20), allowNull: true },
        password: { type: Sequelize.STRING(255), allowNull: false },
        avatar_url: { type: Sequelize.STRING(500), allowNull: true },
        avatar_public_id: { type: Sequelize.STRING(255), allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        email_verified_at: { type: Sequelize.DATE, allowNull: true },
        last_login_at: { type: Sequelize.DATE, allowNull: true },
        // Hash of the currently issued refresh token, so logout and password
        // changes can revoke a session server-side.
        refresh_token_hash: { type: Sequelize.STRING(255), allowNull: true },
        password_changed_at: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }
    );

    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique',
    });
    await queryInterface.addIndex('users', ['role_id'], { name: 'users_role_id_idx' });
    await queryInterface.addIndex('users', ['is_active'], { name: 'users_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
