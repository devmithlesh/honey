'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'addresses',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          // An address book belongs to its owner and dies with them. Orders are
          // unaffected: they store an immutable JSON snapshot of the address.
          onDelete: 'CASCADE',
        },
        label: { type: Sequelize.STRING(50), allowNull: true },
        full_name: { type: Sequelize.STRING(120), allowNull: false },
        phone: { type: Sequelize.STRING(20), allowNull: false },
        line1: { type: Sequelize.STRING(255), allowNull: false },
        line2: { type: Sequelize.STRING(255), allowNull: true },
        city: { type: Sequelize.STRING(100), allowNull: false },
        state: { type: Sequelize.STRING(100), allowNull: false },
        postal_code: { type: Sequelize.STRING(20), allowNull: false },
        country: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'India' },
        type: {
          type: Sequelize.ENUM('shipping', 'billing'),
          allowNull: false,
          defaultValue: 'shipping',
        },
        is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }
    );

    await queryInterface.addIndex('addresses', ['user_id', 'type'], {
      name: 'addresses_user_id_type_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('addresses');
    // Postgres keeps an ENUM type after its table is dropped, which would make
    // a re-run of this migration fail on type already exists.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_addresses_type";');
  },
};
