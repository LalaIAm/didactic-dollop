module.exports = (sequelize, DataTypes) => {const Countries = sequelize.define('countries', {id:{type: DataTypes.INTEGER,primaryKey:true,allowNull: false},code:{type: DataTypes.TEXT,allowNull: false},name:{type: DataTypes.TEXT,allowNull: false}});Countries.associate = function(models) {
      Countries.hasMany(Addresses,{foreignKey:'country_id',targetKey:'id'});}
return Countries;};