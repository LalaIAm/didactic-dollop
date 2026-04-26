# Project Structure

```
backend/
├── config/
│   └── db.config.js        # PostgreSQL connection config (host, user, pool settings)
├── models/
│   └── *.js                # Sequelize model definitions (one file per table)
├── server.js               # Express app entry point
└── package.json
```

## Models

All models follow the same pattern — exported as a function `(sequelize, DataTypes) => Model`:

- `products` — core product catalog with pricing fields (cost_price, retail_price, markup)
- `product_variants` — SKU-level variants with size/color, stock quantity and status
- `product_categories` — many-to-many product ↔ category linking
- `product_images` — product image URLs
- `categories` — product category hierarchy
- `customers` — registered users
- `addresses` — customer shipping/billing addresses
- `orders` / `order_items` — order records and line items
- `order_statuses` — lookup table for order status values
- `carts` / `cart_items` — guest and authenticated carts
- `payments` / `payment_methods` — payment records and method types
- `reviews` — customer product reviews
- `wishlists` / `wishlist_items` — saved product lists
- `sizes` / `colors` / `gender` / `countries` — lookup/reference tables

## Conventions

- Model files use `snake_case` for both filenames and all field names
- Class names inside model files use `PascalCase` (e.g. `Product_variants`)
- Primary keys are always `id` (INTEGER, manually managed — no `autoIncrement`)
- Timestamps (`created_at`, `updated_at`) are stored as `DataTypes.TEXT`, not DATE
- Associations are defined inside a static `Model.associate(models)` function on each model
- Database indexes are defined inline in the model options object
- Models are auto-generated from Meteor Modeler (datensen.com) — avoid manual reformatting

## What's Not Yet Present

- No routes or controllers directory
- No middleware directory
- No seeders or migrations
- No environment variable management (`.env`)
