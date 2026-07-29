'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'inventory',
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
        // Append-only ledger: signed delta (negative when stock leaves) plus the
        // resulting balance, so `products.stock` can always be audited against
        // the movement history rather than trusted blindly.
        change_quantity: { type: Sequelize.INTEGER, allowNull: false },
        stock_after: { type: Sequelize.INTEGER, allowNull: false },
        reason: {
          type: Sequelize.ENUM(
            'order_placed',
            'order_cancelled',
            'restock',
            'manual_adjustment'
          ),
          allowNull: false,
        },
        // Loose polymorphic pointer (e.g. 'order' + order id). Deliberately not
        // a foreign key: the ledger must survive deletion of what it references.
        reference_type: { type: Sequelize.STRING(50), allowNull: true },
        reference_id: { type: Sequelize.BIGINT, allowNull: true },
        note: { type: Sequelize.STRING(255), allowNull: true },
        created_by: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addIndex('inventory', ['product_id', 'created_at'], {
      name: 'inventory_product_created_idx',
    });
    await queryInterface.addIndex('inventory', ['reference_type', 'reference_id'], {
      name: 'inventory_reference_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory');
    // Postgres keeps an ENUM type after its table is dropped, which would make
    // a re-run of this migration fail on type already exists.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inventory_reason";');
  },
};
