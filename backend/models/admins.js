module.exports = (sequelize, DataTypes) => {
  const Admins = sequelize.define(
    "admins",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
      email: { type: DataTypes.TEXT, allowNull: false, unique: true },
      password_hash: { type: DataTypes.TEXT, allowNull: false },
      created_at: { type: DataTypes.TEXT, allowNull: false },
    },
    { timestamps: false },
  );

  return Admins;
};
