'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'settings',
      {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        // Named `setting_key` / `setting_group` on purpose: `group` is a
        // reserved word in Postgres (and `key` in MySQL), so the prefixed names
        // avoid quoting in every hand-written query.
        setting_key: { type: Sequelize.STRING(100), allowNull: false },
        setting_value: { type: Sequelize.TEXT, allowNull: true },
        // Tells the service how to cast `setting_value` back from TEXT.
        value_type: {
          type: Sequelize.ENUM('string', 'number', 'boolean', 'json'),
          allowNull: false,
          defaultValue: 'string',
        },
        setting_group: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'general',
        },
        label: { type: Sequelize.STRING(150), allowNull: true },
        // Public settings are readable without authentication (store name, UPI
        // QR, shipping charge); private ones are admin-only.
        is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addIndex('settings', ['setting_key'], {
      unique: true,
      name: 'settings_key_unique',
    });
    await queryInterface.addIndex('settings', ['setting_group'], {
      name: 'settings_group_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings');
    // Postgres keeps an ENUM type after its table is dropped, which would make
    // a re-run of this migration fail on type already exists.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_settings_value_type";');
  },
};
