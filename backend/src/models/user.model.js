'use strict';

const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const env = require('../config/env');

module.exports = (sequelize) => {
  class User extends Model {
    static associate({ Role, Address, Order, Review, Wishlist, Notification }) {
      User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
      User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
      User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
      User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
      User.hasMany(Wishlist, { foreignKey: 'userId', as: 'wishlistItems' });
      User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
    }

    /** Constant-time comparison; never logs or returns the stored hash. */
    async verifyPassword(plainPassword) {
      return bcrypt.compare(plainPassword, this.password);
    }

    /**
     * Password hashes and refresh tokens must never reach a JSON response, so
     * they are stripped here rather than relying on every controller to
     * remember to omit them.
     */
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      delete values.refresh_token_hash;
      delete values.refreshTokenHash;
      return values;
    }
  }

  User.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      roleId: { type: DataTypes.INTEGER, allowNull: false },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true, len: [2, 120] },
      },
      email: {
        type: DataTypes.STRING(190),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        // Case-insensitive identity: Postgres comparison is case-sensitive, so
        // addresses are normalised on the way in.
        set(value) {
          this.setDataValue('email', String(value || '').trim().toLowerCase());
        },
      },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
      avatarPublicId: { type: DataTypes.STRING(255), allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true },
      refreshTokenHash: { type: DataTypes.STRING(255), allowNull: true },
      passwordChangedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      timestamps: true,
      paranoid: true,
      defaultScope: {
        // Excluded by default so an accidental `findAll()` cannot leak secrets;
        // the auth service opts back in with `.scope('withSecrets')`.
        attributes: { exclude: ['password', 'refreshTokenHash'] },
      },
      scopes: {
        withSecrets: { attributes: { include: ['password', 'refreshTokenHash'] } },
      },
      hooks: {
        /**
         * Hashing lives in a hook so no code path can persist a plaintext
         * password, whether it came from register, reset or an admin edit.
         */
        beforeSave: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, env.security.bcryptSaltRounds);
            user.passwordChangedAt = new Date();
          }
        },
      },
    }
  );

  return User;
};
