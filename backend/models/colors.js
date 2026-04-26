module.exports = (sequelize, DataTypes) => {const Colors = sequelize.define('colors', {id:{type: DataTypes.INTEGER,primaryKey:true,allowNull: false},name:{type: DataTypes.TEXT,allowNull: false},hex:{type: DataTypes.TEXT}});Colors.associate = function(models) {
      Colors.hasMany(Product_variants,{foreignKey:'color_id',targetKey:'id'});}
return Colors;};