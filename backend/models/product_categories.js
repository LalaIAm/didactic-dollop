module.exports = (sequelize, DataTypes) => {const Product_categories = sequelize.define('product_categories', {product_id:{type: DataTypes.INTEGER,primaryKey:true,allowNull: false},category_id:{type: DataTypes.INTEGER,primaryKey:true,allowNull: false}});Product_categories.associate = function(models) {
}
return Product_categories;};