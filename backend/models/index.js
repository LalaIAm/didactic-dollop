"use strict";

const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
  logging: false,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load all models
db.addresses = require("./addresses")(sequelize, DataTypes);
db.admins = require("./admins")(sequelize, DataTypes);
db.carts = require("./carts")(sequelize, DataTypes);
db.cart_items = require("./cart_items")(sequelize, DataTypes);
db.categories = require("./categories")(sequelize, DataTypes);
db.colors = require("./colors")(sequelize, DataTypes);
db.countries = require("./countries")(sequelize, DataTypes);
db.customers = require("./customers")(sequelize, DataTypes);
db.gender = require("./gender")(sequelize, DataTypes);
db.orders = require("./orders")(sequelize, DataTypes);
db.order_items = require("./order_items")(sequelize, DataTypes);
db.order_statuses = require("./order_statuses")(sequelize, DataTypes);
db.payments = require("./payments")(sequelize, DataTypes);
db.payment_methods = require("./payment_methods")(sequelize, DataTypes);
db.products = require("./products")(sequelize, DataTypes);
db.product_categories = require("./product_categories")(sequelize, DataTypes);
db.product_images = require("./product_images")(sequelize, DataTypes);
db.product_variants = require("./product_variants")(sequelize, DataTypes);
db.reviews = require("./reviews")(sequelize, DataTypes);
db.sizes = require("./sizes")(sequelize, DataTypes);
db.wishlists = require("./wishlists")(sequelize, DataTypes);
db.wishlist_items = require("./wishlist_items")(sequelize, DataTypes);

// Run associations
Object.values(db).forEach((model) => {
  if (model && typeof model.associate === "function") {
    model.associate(db);
  }
});

module.exports = db;
