module.exports = (sequelize, DataTypes) => {const Wishlist_items = sequelize.define('wishlist_items', {id:{type: DataTypes.INTEGER,primaryKey:true,allowNull: false},wishlist_id:{type: DataTypes.INTEGER,allowNull: false},product_id:{type: DataTypes.INTEGER,allowNull: false},added_at:{type: DataTypes.TEXT,allowNull: false}});Wishlist_items.associate = function(models) {
}
return Wishlist_items;};