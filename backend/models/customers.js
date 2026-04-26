module.exports = (sequelize, DataTypes) => {
  const Customers = sequelize.define("customers", {
    id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    first_name: { type: DataTypes.TEXT, allowNull: false },
    last_name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false },
    phone: { type: DataTypes.TEXT },
    gender: { type: DataTypes.TEXT },
    date_of_birth: { type: DataTypes.TEXT },
    marketing_opt_in: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    password_hash: { type: DataTypes.TEXT, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.TEXT, allowNull: false },
  });
  Customers.associate = function (models) {
    Customers.hasMany(Addresses, {
      foreignKey: "customer_id",
      targetKey: "id",
    });
    Customers.hasMany(Carts, { foreignKey: "customer_id", targetKey: "id" });
    Customers.hasMany(Orders, { foreignKey: "customer_id", targetKey: "id" });
    Customers.hasMany(Reviews, { foreignKey: "customer_id", targetKey: "id" });
    Customers.hasMany(Wishlists, {
      foreignKey: "customer_id",
      targetKey: "id",
    });
  };
  return Customers;
};
