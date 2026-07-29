'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'orders',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        // Human-facing reference (e.g. HB-20260727-0001) shown to the customer
        // and used in URLs, so the surrogate key is never exposed.
        order_number: { type: Sequelize.STRING(32), allowNull: false },
        user_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          // Closing an account must not erase the farm's sales records.
          onDelete: 'SET NULL',
        },
        status: {
          type: Sequelize.ENUM(
            'pending',
            'confirmed',
            'packed',
            'shipped',
            'delivered',
            'cancelled'
          ),
          allowNull: false,
          defaultValue: 'pending',
        },
        // Contact details are copied onto the order so it stays complete even
        // if the customer later edits their profile.
        customer_name: { type: Sequelize.STRING(120), allowNull: false },
        customer_email: { type: Sequelize.STRING(190), allowNull: false },
        customer_phone: { type: Sequelize.STRING(20), allowNull: false },
        // Immutable JSON snapshots. Referencing addresses by FK would let an
        // edit to the address book silently rewrite historical orders.
        shipping_address: { type: Sequelize.JSONB, allowNull: false },
        billing_address: { type: Sequelize.JSONB, allowNull: false },
        subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        discount_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        shipping_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        grand_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        coupon_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'coupons', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        // Retained verbatim so a deleted coupon still shows on the invoice.
        coupon_code: { type: Sequelize.STRING(50), allowNull: true },
        customer_note: { type: Sequelize.TEXT, allowNull: true },
        admin_note: { type: Sequelize.TEXT, allowNull: true },
        placed_at: { type: Sequelize.DATE, allowNull: false },
        confirmed_at: { type: Sequelize.DATE, allowNull: true },
        packed_at: { type: Sequelize.DATE, allowNull: true },
        shipped_at: { type: Sequelize.DATE, allowNull: true },
        delivered_at: { type: Sequelize.DATE, allowNull: true },
        cancelled_at: { type: Sequelize.DATE, allowNull: true },
        cancel_reason: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }
    );

    await queryInterface.addIndex('orders', ['order_number'], {
      unique: true,
      name: 'orders_order_number_unique',
    });
    await queryInterface.addIndex('orders', ['user_id'], { name: 'orders_user_id_idx' });
    await queryInterface.addIndex('orders', ['status'], { name: 'orders_status_idx' });
    // Drives the admin dashboard's revenue-over-time and recent-orders queries.
    await queryInterface.addIndex('orders', ['placed_at'], { name: 'orders_placed_at_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
    // Postgres keeps an ENUM type after its table is dropped, which would make
    // a re-run of this migration fail on type already exists.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  },
};
