module.exports = (sequelize, DataTypes) => {
      const Wishlists = sequelize.define('wishlists', { id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false }, customer_id: { type: DataTypes.INTEGER, allowNull: false }, name: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'My Wishlist':: text }, created_at: { type: DataTypes.TEXT, allowNull: false } }, { indexes: [{ name: 'idx_wishlists_customer_id', fields: ['customer_id'] }] }); Wishlists.associate = function (models) {
            Wishlists.hasMany(Wishlist_items, { foreignKey: 'wishlist_id', targetKey: 'id' });
      }
      return Wishlists;
};