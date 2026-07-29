'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'payments',
      {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        order_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        method: { type: Sequelize.ENUM('cod', 'upi'), allowNull: false },
        status: {
          type: Sequelize.ENUM('pending', 'awaiting_verification', 'paid', 'failed', 'refunded'),
          allowNull: false,
          defaultValue: 'pending',
        },
        amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        // UPI reference number typed in by the customer after paying the QR.
        transaction_reference: { type: Sequelize.STRING(120), allowNull: true },
        screenshot_url: { type: Sequelize.STRING(500), allowNull: true },
        screenshot_public_id: { type: Sequelize.STRING(255), allowNull: true },
        paid_at: { type: Sequelize.DATE, allowNull: true },
        // Manual UPI settlement is confirmed by a human; record who and when.
        verified_by: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        verified_at: { type: Sequelize.DATE, allowNull: true },
        failure_reason: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    // One payment record per order: the unique index makes a duplicate
    // insert impossible even under a race between two checkout requests.
    await queryInterface.addIndex('payments', ['order_id'], {
      unique: true,
      name: 'payments_order_id_unique',
    });
    await queryInterface.addIndex('payments', ['status'], { name: 'payments_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
    // Postgres keeps an ENUM type after its table is dropped, which would make
    // a re-run of this migration fail on type already exists.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_method";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
  },
};
