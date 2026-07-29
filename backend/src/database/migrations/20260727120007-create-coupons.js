'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'coupons',
      {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        // Postgres string comparison is case-sensitive, unlike the MySQL
        // collation this schema was first written against. Codes are therefore
        // normalised to uppercase on write and lookups uppercase their input,
        // so "save10" and "SAVE10" resolve to the same coupon.
        code: { type: Sequelize.STRING(50), allowNull: false },
        description: { type: Sequelize.STRING(255), allowNull: true },
        type: { type: Sequelize.ENUM('percentage', 'fixed'), allowNull: false },
        value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        min_order_amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        // Caps the rupee value of a percentage coupon; null means uncapped.
        max_discount_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
        usage_limit: { type: Sequelize.INTEGER, allowNull: true },
        usage_limit_per_user: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        used_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        starts_at: { type: Sequelize.DATE, allowNull: true },
        expires_at: { type: Sequelize.DATE, allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }
    );

    await queryInterface.addIndex('coupons', ['code'], {
      unique: true,
      name: 'coupons_code_unique',
    });
    await queryInterface.addIndex('coupons', ['is_active', 'expires_at'], {
      name: 'coupons_active_expiry_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('coupons');
    // Postgres keeps an ENUM type after its table is dropped, which would make
    // a re-run of this migration fail on type already exists.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_coupons_type";');
  },
};
