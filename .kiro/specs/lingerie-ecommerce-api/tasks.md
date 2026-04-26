# Implementation Plan: Lingerie E-Commerce API

## Overview

Implement the full REST API in a layered architecture (routes → middleware → controllers → services → models) on top of the existing Express.js + Sequelize + PostgreSQL stack. Tasks are ordered so each step integrates cleanly into the previous one, ending with a fully wired server.

## Tasks

- [x] 1. Foundation — utilities, error handling, and model amendments
  - [x] 1.1 Create `backend/utils/AppError.js`
    - Implement `AppError` class extending `Error` with a `statusCode` property
    - _Requirements: 11.2, 11.3_
  - [x] 1.2 Add `password_hash` and `is_active` fields to the `customers` Sequelize model
    - Add `password_hash: DataTypes.TEXT, allowNull: false` and `is_active: DataTypes.BOOLEAN, defaultValue: true`
    - _Requirements: 1.1, 16.1_
  - [x] 1.3 Add `is_active` field to the `products` Sequelize model
    - Add `is_active: DataTypes.BOOLEAN, defaultValue: true`
    - _Requirements: 14.4_
  - [x] 1.4 Add `is_active` field to the `product_variants` Sequelize model
    - Add `is_active: DataTypes.BOOLEAN, defaultValue: true`
    - _Requirements: 14.7_
  - [x] 1.5 Create `backend/models/admins.js` Sequelize model
    - Fields: `id` (INTEGER PK), `email` (TEXT UNIQUE NOT NULL), `password_hash` (TEXT NOT NULL), `created_at` (TEXT NOT NULL)
    - _Requirements: 12.1_
  - [x] 1.6 Register the global error handler middleware in `server.js`
    - Import and mount after all routes: catches `AppError` → responds with `err.statusCode` + `{ message }`, else 500 + logs
    - _Requirements: 11.2, 11.3_

- [x] 2. Auth middleware
  - [x] 2.1 Create `backend/middleware/auth.middleware.js`
    - Verify `Authorization: Bearer <token>` using `jsonwebtoken`; attach `req.customer = { id, email }`; call `next(new AppError(..., 401))` on failure
    - _Requirements: 1.5, 1.6_
  - [x] 2.2 Write property test for auth middleware (Property 3)
    - **Property 3: Auth Middleware Rejects All Invalid Tokens on Protected Routes**
    - **Validates: Requirements 1.5, 1.6**
  - [x] 2.3 Create `backend/middleware/adminAuth.middleware.js`
    - Reuse JWT verification; additionally check `payload.role === 'admin'`; return 401 for missing/invalid JWT, 403 for wrong role
    - _Requirements: 12.3, 12.4, 12.5_
  - [x] 2.4 Write property test for admin auth middleware (Property 5)
    - **Property 5: Admin Middleware Enforces Role on Every Admin Route**
    - **Validates: Requirements 12.3, 12.4, 12.5**

- [-] 3. Customer authentication
  - [x] 3.1 Create `backend/services/auth.service.js`
    - `register(firstName, lastName, email, password)`: hash password with bcrypt, create Customer, sign and return JWT; throw 409 if email exists
    - `login(email, password)`: find Customer by email, compare hash, sign and return JWT; throw 401 on mismatch
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 3.2 Write property test for registration–login round trip (Property 1)
    - **Property 1: Registration–Login Round Trip Preserves Identity**
    - **Validates: Requirements 1.1, 1.3**
  - [ ] 3.3 Write property test for password storage (Property 2)
    - **Property 2: Passwords Are Never Stored in Plaintext**
    - **Validates: Requirements 1.1**
  - [x] 3.4 Create `backend/controllers/auth.controller.js`
    - `register`: parse body, call `auth.service.register`, respond 201 with `{ data: { token } }`
    - `login`: parse body, call `auth.service.login`, respond 200 with `{ data: { token } }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [-] 3.5 Create `backend/routes/auth.routes.js` and mount at `/api/auth` in `server.js`
    - `POST /register` → `auth.controller.register`
    - `POST /login` → `auth.controller.login`
    - _Requirements: 1.1, 1.3_

- [ ] 4. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Product catalog and variants
  - [ ] 5.1 Create `backend/services/product.service.js`
    - `listProducts({ page, limit, category_id, search })`: paginated query with optional filters; include featured image, average rating; exclude inactive
    - `getProduct(id)`: full product with variants, images, categories, average rating; throw 404 if not found
    - `listVariants(productId)`: all active variants for a product
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_
  - [ ] 5.2 Create `backend/controllers/product.controller.js`
    - `list`, `get`, `listVariants` handlers calling the service and responding with `{ data }` or `{ data, pagination }`
    - _Requirements: 2.1, 2.4, 3.1_
  - [ ] 5.3 Create `backend/routes/product.routes.js` and mount at `/api/products` in `server.js`
    - `GET /` → `list`; `GET /:id` → `get`; `GET /:id/variants` → `listVariants`
    - _Requirements: 2.1, 2.4, 3.1_
  - [ ] 5.4 Create `backend/routes/product.routes.js` supplementary lookup routes and mount in `server.js`
    - `GET /api/categories` → return all categories; `GET /api/sizes` → return all sizes; `GET /api/colors` → return all colors
    - _Requirements: 2.6, 3.3, 3.4_

- [ ] 6. Shopping cart
  - [ ] 6.1 Create `backend/services/cart.service.js`
    - `createCart({ customerId, sessionId })`: create Cart with status `active`
    - `getCart(cartId)`: return cart with items, variant details, line totals; throw 404 if not found
    - `addItem(cartId, productVariantId, quantity)`: upsert — if variant already in cart, increment quantity; else insert
    - `updateItem(cartId, itemId, quantity)`: update quantity; throw 404 if item not in cart
    - `removeItem(cartId, itemId)`: delete item; throw 404 if item not in cart
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ]\* 6.2 Write property test for cart item deduplication (Property 6)
    - **Property 6: Cart Item Deduplication — Quantities Are Summed, Not Duplicated**
    - **Validates: Requirements 4.4**
  - [ ]\* 6.3 Write property test for cart item quantity update round trip (Property 7)
    - **Property 7: Cart Item Quantity Update Round Trip**
    - **Validates: Requirements 4.5**
  - [ ] 6.4 Create `backend/controllers/cart.controller.js`
    - `create`, `get`, `addItem`, `updateItem`, `removeItem` handlers
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_
  - [ ] 6.5 Create `backend/routes/cart.routes.js` and mount at `/api/cart` in `server.js`
    - `POST /` → `create`; `GET /:cartId` → `get`; `POST /:cartId/items` → `addItem`; `PUT /:cartId/items/:itemId` → `updateItem`; `DELETE /:cartId/items/:itemId` → `removeItem`
    - _Requirements: 4.1–4.7_

- [ ] 7. Wishlist management
  - [ ] 7.1 Create `backend/services/wishlist.service.js`
    - `createWishlist(customerId, name)`: create Wishlist
    - `listWishlists(customerId)`: return all wishlists for customer
    - `addItem(customerId, wishlistId, productId)`: verify ownership (throw 403), check duplicate (throw 409), insert item
    - `removeItem(customerId, wishlistId, itemId)`: verify ownership (throw 403), delete item
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]\* 7.2 Write property test for customer resource isolation on wishlists (Property 11)
    - **Property 11: Customer Resource Isolation**
    - **Validates: Requirements 5.6**
  - [ ] 7.3 Create `backend/controllers/wishlist.controller.js` and `backend/routes/wishlist.routes.js`
    - Mount at `/api/wishlists` with `auth.middleware` on all routes
    - `POST /` → `create`; `GET /` → `list`; `POST /:wishlistId/items` → `addItem`; `DELETE /:wishlistId/items/:itemId` → `removeItem`
    - _Requirements: 5.1–5.6_

- [ ] 8. Customer profile and addresses
  - [ ] 8.1 Create `backend/services/customer.service.js`
    - `getProfile(customerId)`: return customer excluding `password_hash`
    - `updateProfile(customerId, fields)`: update and return profile; throw 409 on duplicate email
    - `listAddresses(customerId)`: return all addresses
    - `createAddress(customerId, fields)`: create address
    - `updateAddress(customerId, addressId, fields)`: verify ownership (throw 403), update; if `is_default_shipping: true`, clear flag on all other addresses first
    - `deleteAddress(customerId, addressId)`: verify ownership (throw 403), delete
    - _Requirements: 6.1–6.6, 10.1–10.3_
  - [ ]\* 8.2 Write property test for default shipping address invariant (Property 15)
    - **Property 15: At Most One Default Shipping Address Per Customer**
    - **Validates: Requirements 6.6**
  - [ ]\* 8.3 Write property test for profile response never exposes password hash (Property 16)
    - **Property 16: Profile Response Never Exposes Password Hash**
    - **Validates: Requirements 10.1**
  - [ ] 8.4 Create `backend/controllers/customer.controller.js` and `backend/routes/customer.routes.js`
    - Mount at `/api/customers/me` with `auth.middleware`
    - `GET /` → `getProfile`; `PUT /` → `updateProfile`; `GET /addresses` → `listAddresses`; `POST /addresses` → `createAddress`; `PUT /addresses/:addressId` → `updateAddress`; `DELETE /addresses/:addressId` → `deleteAddress`
    - _Requirements: 6.1–6.6, 10.1–10.3_

- [ ] 9. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Orders
  - [ ] 10.1 Create `backend/services/order.service.js`
    - `placeOrder(customerId, cartId, shippingAddressId, billingAddressId)`: in a transaction — verify cart is `active` (throw 400), verify address ownership (throw 403), create Order with status `pending`, copy cart items as order items, calculate subtotal/total, set cart status to `converted` and `converted_order_id`
    - `listOrders(customerId, { page, limit })`: paginated orders for customer, newest first
    - `getOrder(customerId, orderId)`: full order with items, variant details, status, payments; throw 403 if not owner, 404 if not found
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [ ]\* 10.2 Write property test for order total calculation invariant (Property 8)
    - **Property 8: Order Total Calculation Invariant**
    - **Validates: Requirements 7.2**
  - [ ]\* 10.3 Write property test for order creation transitions (Property 9)
    - **Property 9: Order Creation Transitions Cart and Sets Pending Status**
    - **Validates: Requirements 7.1**
  - [ ]\* 10.4 Write property test for customer resource isolation on orders (Property 11)
    - **Property 11: Customer Resource Isolation (orders)**
    - **Validates: Requirements 7.4, 7.7**
  - [ ] 10.5 Create `backend/controllers/order.controller.js` and `backend/routes/order.routes.js`
    - Mount at `/api/orders` with `auth.middleware`
    - `POST /` → `placeOrder`; `GET /` → `listOrders`; `GET /:orderId` → `getOrder`
    - _Requirements: 7.1–7.7_

- [ ] 11. Payments
  - [ ] 11.1 Create `backend/services/payment.service.js`
    - `recordPayment(customerId, orderId, { paymentMethodId, amount, status, transactionId })`: verify order ownership (throw 403), create Payment; if `status === 'completed'`, update order status to `paid`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ]\* 11.2 Write property test for completed payment transitions order to paid (Property 10)
    - **Property 10: Completed Payment Transitions Order to Paid**
    - **Validates: Requirements 8.3**
  - [ ]\* 11.3 Write property test for customer resource isolation on payments (Property 11)
    - **Property 11: Customer Resource Isolation (payments)**
    - **Validates: Requirements 8.2**
  - [ ] 11.4 Create `backend/controllers/payment.controller.js`
    - `recordPayment` handler; wire into `order.routes.js` as `POST /api/orders/:orderId/payments` with `auth.middleware`
    - _Requirements: 8.1–8.4_

- [ ] 12. Product reviews
  - [ ] 12.1 Create `backend/services/review.service.js`
    - `createReview(customerId, productId, { rating, title, body })`: validate rating in [1,5] (throw 400 otherwise), create Review
    - `listReviews(productId)`: return all reviews ordered by `created_at` desc
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ]\* 12.2 Write property test for review rating range (Property 14)
    - **Property 14: Review Rating Is Always Within the Valid Range**
    - **Validates: Requirements 9.1, 9.2**
  - [ ] 12.3 Create `backend/controllers/review.controller.js`
    - `create` (auth required) and `list` (public) handlers; wire into `product.routes.js` as `POST /api/products/:productId/reviews` and `GET /api/products/:productId/reviews`
    - _Requirements: 9.1–9.4_

- [ ] 13. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Admin authentication
  - [ ] 14.1 Create `backend/services/admin/adminAuth.service.js`
    - `login(email, password)`: find Admin by email, compare bcrypt hash, sign JWT with `{ id, email, role: 'admin' }`; throw 401 on mismatch
    - _Requirements: 12.1, 12.2_
  - [ ]\* 14.2 Write property test for admin JWT role claim (Property 4)
    - **Property 4: Admin JWT Always Contains the `admin` Role Claim**
    - **Validates: Requirements 12.1**
  - [ ] 14.3 Create `backend/controllers/admin/adminAuth.controller.js` and `backend/routes/admin/adminAuth.routes.js`
    - Mount at `/api/admin/auth` (no middleware)
    - `POST /login` → `adminAuth.controller.login`
    - _Requirements: 12.1, 12.2_

- [ ] 15. Admin order management
  - [ ] 15.1 Create `backend/services/admin/adminOrder.service.js`
    - `listOrders({ page, limit, status, customerId })`: paginated all-orders query with optional filters; include customer name, total, status
    - `getOrder(orderId)`: full order with items, variant details, status history, payments, shipping address; throw 404 if not found
    - `updateStatus(orderId, status)`: validate status is one of the allowed values (throw 400), update; throw 404 if not found
    - _Requirements: 13.1–13.7_
  - [ ] 15.2 Create `backend/controllers/admin/adminOrder.controller.js` and `backend/routes/admin/adminOrder.routes.js`
    - Mount at `/api/admin/orders` with `adminAuth.middleware`
    - `GET /` → `listOrders`; `GET /:orderId` → `getOrder`; `PATCH /:orderId/status` → `updateStatus`
    - _Requirements: 13.1–13.7_

- [ ] 16. Admin product management
  - [ ] 16.1 Create `backend/services/admin/adminProduct.service.js`
    - `createProduct(fields)`: create Product + product_categories links; throw 409 on duplicate SKU
    - `updateProduct(productId, fields)`: update Product; throw 404 if not found
    - `softDeleteProduct(productId)`: set `is_active = false`; throw 404 if not found
    - `createVariant(productId, fields)`: create Product_Variant linked to product
    - `updateVariant(productId, variantId, fields)`: update variant; throw 404 if not found
    - `softDeleteVariant(productId, variantId)`: set `is_active = false`; throw 404 if not found
    - _Requirements: 14.1–14.8_
  - [ ]\* 16.2 Write property test for SKU uniqueness constraint (Property 13)
    - **Property 13: SKU Uniqueness Constraint**
    - **Validates: Requirements 14.2**
  - [ ] 16.3 Create `backend/controllers/admin/adminProduct.controller.js` and `backend/routes/admin/adminProduct.routes.js`
    - Mount at `/api/admin/products` with `adminAuth.middleware`
    - `POST /` → `createProduct`; `PUT /:productId` → `updateProduct`; `DELETE /:productId` → `softDeleteProduct`
    - `POST /:productId/variants` → `createVariant`; `PUT /:productId/variants/:variantId` → `updateVariant`; `DELETE /:productId/variants/:variantId` → `softDeleteVariant`
    - _Requirements: 14.1–14.8_

- [ ] 17. Admin inventory management
  - [ ] 17.1 Create `backend/services/admin/adminInventory.service.js`
    - `updateInventory(productId, variantId, stockQuantity)`: validate `stockQuantity >= 0` (throw 400), update `stock_quantity`, derive and set `stock_status` (`0` → `out_of_stock`, `> 0` → `in_stock`)
    - `listInventory({ page, limit, stockStatus })`: paginated all-variants with stock fields, filterable by `stock_status`
    - _Requirements: 15.1–15.5_
  - [ ]\* 17.2 Write property test for stock quantity–status consistency invariant (Property 12)
    - **Property 12: Stock Quantity–Status Consistency Invariant**
    - **Validates: Requirements 15.2, 15.3**
  - [ ] 17.3 Create `backend/controllers/admin/adminInventory.controller.js` and `backend/routes/admin/adminInventory.routes.js`
    - Mount inventory list at `/api/admin/inventory` and patch at `/api/admin/products/:productId/variants/:variantId/inventory`, both with `adminAuth.middleware`
    - `GET /api/admin/inventory` → `listInventory`; `PATCH /api/admin/products/:productId/variants/:variantId/inventory` → `updateInventory`
    - _Requirements: 15.1–15.5_

- [ ] 18. Admin customer management
  - [ ] 18.1 Create `backend/services/admin/adminCustomer.service.js`
    - `listCustomers({ page, limit, search })`: paginated customers excluding `password_hash`, newest first, optional name/email search
    - `getCustomer(customerId)`: profile excluding `password_hash` + total orders count + total spend; throw 404 if not found
    - `getCustomerOrders(customerId, { page, limit })`: paginated orders for customer, newest first
    - _Requirements: 16.1–16.5_
  - [ ]\* 18.2 Write property test for profile response never exposes password hash (Property 16 — admin endpoints)
    - **Property 16: Profile Response Never Exposes Password Hash (admin endpoints)**
    - **Validates: Requirements 16.1, 16.3**
  - [ ] 18.3 Create `backend/controllers/admin/adminCustomer.controller.js` and `backend/routes/admin/adminCustomer.routes.js`
    - Mount at `/api/admin/customers` with `adminAuth.middleware`
    - `GET /` → `listCustomers`; `GET /:customerId` → `getCustomer`; `GET /:customerId/orders` → `getCustomerOrders`
    - _Requirements: 16.1–16.5_

- [ ] 19. Wire all routes into `server.js` and final integration
  - [ ] 19.1 Import and mount all route files in `server.js`
    - Customer routes: `/api/auth`, `/api/products`, `/api/categories`, `/api/sizes`, `/api/colors`, `/api/cart`, `/api/wishlists`, `/api/customers/me`, `/api/orders`
    - Admin routes: `/api/admin/auth`, `/api/admin/orders`, `/api/admin/products`, `/api/admin/inventory`, `/api/admin/customers`
    - Ensure global error handler is registered last
    - _Requirements: 11.1–11.4_
  - [ ] 19.2 Verify Sequelize model associations are correctly loaded in `db.config.js` or an index file
    - Ensure `admins` model is registered; confirm all `associate` calls reference the correct model names
    - _Requirements: 1.1, 12.1_

- [ ] 20. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- All services throw `AppError` instances; controllers pass errors to `next(err)` for the global handler
