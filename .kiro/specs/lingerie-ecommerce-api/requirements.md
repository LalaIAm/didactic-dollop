# Requirements Document

## Introduction

This document defines the requirements for a full REST API backend for a lingerie ecommerce platform. The API is built with Express.js, Sequelize ORM, and PostgreSQL. It covers customer authentication, product catalog browsing, shopping cart management, wishlist management, order placement and tracking, payment recording, and product reviews. The API serves as the backend for a frontend client (web or mobile) communicating over HTTP/JSON.

---

## Glossary

- **API**: The Express.js REST API server defined in `server.js`
- **Customer**: A registered user of the ecommerce platform
- **Product**: A lingerie item available for sale, identified by a unique SKU
- **Product_Variant**: A specific size/color combination of a Product, with its own stock and pricing
- **Category**: A classification label for Products (e.g., bras, underwear, sets)
- **Cart**: A temporary container of Product_Variants a Customer intends to purchase
- **Cart_Item**: A single Product_Variant entry within a Cart with a quantity
- **Order**: A confirmed purchase record created from a Cart
- **Order_Item**: A single Product_Variant line within an Order
- **Payment**: A payment transaction record associated with an Order
- **Wishlist**: A named list of Products saved by a Customer for future reference
- **Wishlist_Item**: A single Product entry within a Wishlist
- **Address**: A shipping or billing address belonging to a Customer
- **Review**: A Customer's rating and written feedback for a Product
- **JWT**: JSON Web Token used for stateless authentication
- **Auth_Middleware**: Express middleware that validates a JWT on protected routes
- **Admin**: A privileged platform operator with access to management endpoints
- **Admin_Auth_Middleware**: Express middleware that validates a JWT and confirms the `role` claim is `admin` on admin-protected routes
- **Order_Status**: The current fulfillment state of an Order (e.g., `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`)

---

## Requirements

### Requirement 1: Customer Registration and Authentication

**User Story:** As a visitor, I want to register an account and log in, so that I can access personalized features like orders, wishlists, and saved addresses.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/register` with a valid first name, last name, email, and password, THE API SHALL create a new Customer record with the password stored as a bcrypt hash and return a JWT.
2. WHEN a POST request is made to `/api/auth/register` with an email that already exists, THE API SHALL return a 409 Conflict response with a descriptive error message.
3. WHEN a POST request is made to `/api/auth/login` with a valid email and matching password, THE API SHALL return a signed JWT containing the customer's id and email.
4. IF a POST request is made to `/api/auth/login` with an email that does not exist or a password that does not match, THEN THE API SHALL return a 401 Unauthorized response.
5. THE Auth_Middleware SHALL validate the JWT signature and expiry on every protected route request before passing control to the route handler.
6. IF a protected route is accessed without a valid JWT, THEN THE API SHALL return a 401 Unauthorized response.

---

### Requirement 2: Product Catalog

**User Story:** As a visitor or customer, I want to browse and search the product catalog, so that I can discover lingerie items to purchase.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/products`, THE API SHALL return a paginated list of Products including their featured image, retail price, and average rating.
2. WHEN a GET request is made to `/api/products` with a `category_id` query parameter, THE API SHALL return only Products associated with that Category.
3. WHEN a GET request is made to `/api/products` with a `search` query parameter, THE API SHALL return Products whose name or description contains the search term (case-insensitive).
4. WHEN a GET request is made to `/api/products/:id`, THE API SHALL return the full Product record including all Product_Variants, Product_Images, Categories, and average rating.
5. IF a GET request is made to `/api/products/:id` with an id that does not exist, THEN THE API SHALL return a 404 Not Found response.
6. WHEN a GET request is made to `/api/categories`, THE API SHALL return all Category records.

---

### Requirement 3: Product Variants and Inventory

**User Story:** As a customer, I want to see available sizes and colors for a product, so that I can select the right variant before adding it to my cart.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/products/:id/variants`, THE API SHALL return all Product_Variants for that Product including size, color, stock_quantity, stock_status, and retail_price.
2. THE API SHALL include the `stock_status` field in every Product_Variant response, reflecting the current value stored in the database.
3. WHEN a GET request is made to `/api/sizes`, THE API SHALL return all Size records.
4. WHEN a GET request is made to `/api/colors`, THE API SHALL return all Color records.

---

### Requirement 4: Shopping Cart

**User Story:** As a visitor or customer, I want to manage a shopping cart, so that I can collect items before placing an order.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/cart` with a `session_id` (for guests) or a valid JWT (for customers), THE API SHALL create a new Cart with status `active` and return the Cart record.
2. WHEN a GET request is made to `/api/cart/:cartId`, THE API SHALL return the Cart record with all Cart_Items including Product_Variant details and line totals.
3. WHEN a POST request is made to `/api/cart/:cartId/items` with a valid `product_variant_id` and `quantity`, THE API SHALL add a Cart_Item to the Cart and return the updated Cart.
4. IF a POST request is made to `/api/cart/:cartId/items` with a `product_variant_id` that already exists in the Cart, THEN THE API SHALL increment the existing Cart_Item's quantity rather than creating a duplicate.
5. WHEN a PUT request is made to `/api/cart/:cartId/items/:itemId` with a new `quantity`, THE API SHALL update the Cart_Item's quantity and return the updated Cart.
6. WHEN a DELETE request is made to `/api/cart/:cartId/items/:itemId`, THE API SHALL remove the Cart_Item from the Cart and return the updated Cart.
7. IF a PUT or DELETE request is made to a Cart_Item that does not belong to the specified Cart, THEN THE API SHALL return a 404 Not Found response.

---

### Requirement 5: Wishlist Management

**User Story:** As a customer, I want to save products to a wishlist, so that I can revisit items I am interested in purchasing later.

#### Acceptance Criteria

1. WHEN an authenticated POST request is made to `/api/wishlists` with a `name`, THE API SHALL create a new Wishlist for the authenticated Customer and return the Wishlist record.
2. WHEN an authenticated GET request is made to `/api/wishlists`, THE API SHALL return all Wishlists belonging to the authenticated Customer.
3. WHEN an authenticated POST request is made to `/api/wishlists/:wishlistId/items` with a valid `product_id`, THE API SHALL add a Wishlist_Item to the Wishlist and return the updated Wishlist.
4. IF a POST request is made to `/api/wishlists/:wishlistId/items` with a `product_id` that already exists in the Wishlist, THEN THE API SHALL return a 409 Conflict response.
5. WHEN an authenticated DELETE request is made to `/api/wishlists/:wishlistId/items/:itemId`, THE API SHALL remove the Wishlist_Item and return the updated Wishlist.
6. IF a request is made to a Wishlist that does not belong to the authenticated Customer, THEN THE API SHALL return a 403 Forbidden response.

---

### Requirement 6: Customer Addresses

**User Story:** As a customer, I want to manage my shipping and billing addresses, so that I can check out quickly without re-entering address details.

#### Acceptance Criteria

1. WHEN an authenticated GET request is made to `/api/customers/me/addresses`, THE API SHALL return all Addresses belonging to the authenticated Customer.
2. WHEN an authenticated POST request is made to `/api/customers/me/addresses` with valid address fields, THE API SHALL create a new Address for the authenticated Customer and return the Address record.
3. WHEN an authenticated PUT request is made to `/api/customers/me/addresses/:addressId`, THE API SHALL update the specified Address fields and return the updated Address.
4. WHEN an authenticated DELETE request is made to `/api/customers/me/addresses/:addressId`, THE API SHALL delete the Address and return a 204 No Content response.
5. IF a request is made to an Address that does not belong to the authenticated Customer, THEN THE API SHALL return a 403 Forbidden response.
6. WHEN an authenticated PUT request is made to `/api/customers/me/addresses/:addressId` with `is_default_shipping: true`, THE API SHALL set `is_default_shipping` to false on all other Addresses for that Customer before setting it to true on the specified Address.

---

### Requirement 7: Order Placement

**User Story:** As a customer, I want to place an order from my cart, so that I can purchase the items I have selected.

#### Acceptance Criteria

1. WHEN an authenticated POST request is made to `/api/orders` with a valid `cart_id`, `shipping_address_id`, and `billing_address_id`, THE API SHALL create an Order from the Cart's items, set the Order status to `pending`, update the Cart status to `converted`, set the Cart's `converted_order_id`, and return the Order record.
2. WHEN an Order is created, THE API SHALL calculate `subtotal` as the sum of all Cart_Item `unit_price × quantity`, and set `total` as `subtotal + tax + shipping`.
3. IF a POST request is made to `/api/orders` with a `cart_id` whose status is not `active`, THEN THE API SHALL return a 400 Bad Request response with a descriptive error message.
4. IF a POST request is made to `/api/orders` with a `shipping_address_id` or `billing_address_id` that does not belong to the authenticated Customer, THEN THE API SHALL return a 403 Forbidden response.
5. WHEN an authenticated GET request is made to `/api/orders`, THE API SHALL return a paginated list of Orders belonging to the authenticated Customer, ordered by `created_at` descending.
6. WHEN an authenticated GET request is made to `/api/orders/:orderId`, THE API SHALL return the full Order record including all Order_Items with Product_Variant details, the Order status, and associated Payments.
7. IF a GET request is made to an Order that does not belong to the authenticated Customer, THEN THE API SHALL return a 403 Forbidden response.

---

### Requirement 8: Payment Recording

**User Story:** As a customer, I want my payment to be recorded against my order, so that the store has a complete transaction history.

#### Acceptance Criteria

1. WHEN an authenticated POST request is made to `/api/orders/:orderId/payments` with a valid `payment_method_id`, `amount`, `status`, and `transaction_id`, THE API SHALL create a Payment record linked to the Order and return the Payment record.
2. IF a POST request is made to `/api/orders/:orderId/payments` for an Order that does not belong to the authenticated Customer, THEN THE API SHALL return a 403 Forbidden response.
3. WHEN a Payment with `status` of `completed` is recorded for an Order, THE API SHALL update the Order's status to `paid`.
4. THE API SHALL return all Payments associated with an Order when the Order detail endpoint is called.

---

### Requirement 9: Product Reviews

**User Story:** As a customer, I want to leave a rating and review for a product I have purchased, so that other shoppers can make informed decisions.

#### Acceptance Criteria

1. WHEN an authenticated POST request is made to `/api/products/:productId/reviews` with a `rating` between 1 and 5 and an optional `title` and `body`, THE API SHALL create a Review linked to the Product and the authenticated Customer and return the Review record.
2. IF a POST request is made to `/api/products/:productId/reviews` with a `rating` outside the range 1–5, THEN THE API SHALL return a 400 Bad Request response.
3. WHEN a GET request is made to `/api/products/:productId/reviews`, THE API SHALL return all Reviews for that Product ordered by `created_at` descending.
4. THE API SHALL include the average `rating` for a Product when returning Product detail responses.

---

### Requirement 10: Customer Profile

**User Story:** As a customer, I want to view and update my profile information, so that my account details stay current.

#### Acceptance Criteria

1. WHEN an authenticated GET request is made to `/api/customers/me`, THE API SHALL return the authenticated Customer's profile fields excluding the password hash.
2. WHEN an authenticated PUT request is made to `/api/customers/me` with updated fields, THE API SHALL update the Customer record and return the updated profile excluding the password hash.
3. IF a PUT request is made to `/api/customers/me` with an email that is already used by another Customer, THEN THE API SHALL return a 409 Conflict response.

---

### Requirement 11: Error Handling and Response Format

**User Story:** As a frontend developer, I want consistent error and success response shapes, so that I can handle API responses predictably.

#### Acceptance Criteria

1. THE API SHALL return all successful responses with HTTP status codes in the 2xx range and a JSON body.
2. THE API SHALL return all error responses with an appropriate HTTP status code (400, 401, 403, 404, 409, 500) and a JSON body containing at minimum a `message` field.
3. IF an unhandled server error occurs, THEN THE API SHALL return a 500 Internal Server Error response with a generic error message and SHALL log the error details server-side.
4. THE API SHALL parse and validate `Content-Type: application/json` request bodies on all POST and PUT routes, returning a 400 Bad Request response when required fields are missing or of the wrong type.

---

### Requirement 12: Admin Authentication and Authorization

**User Story:** As a platform operator, I want to log in with an admin account and access protected management endpoints, so that I can operate the store without exposing admin capabilities to regular customers.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/admin/auth/login` with a valid admin email and matching password, THE API SHALL return a signed JWT containing the admin's id, email, and a `role` claim of `admin`.
2. IF a POST request is made to `/api/admin/auth/login` with an email that does not exist or a password that does not match, THEN THE API SHALL return a 401 Unauthorized response.
3. THE Admin_Auth_Middleware SHALL validate the JWT signature, expiry, and `role` claim on every admin-protected route request before passing control to the route handler.
4. IF an admin-protected route is accessed with a JWT whose `role` claim is not `admin`, THEN THE API SHALL return a 403 Forbidden response.
5. IF an admin-protected route is accessed without a valid JWT, THEN THE API SHALL return a 401 Unauthorized response.

---

### Requirement 13: Admin Order Management

**User Story:** As an admin, I want to view all orders and update their fulfillment status, so that I can process and ship customer purchases.

#### Acceptance Criteria

1. WHEN an authenticated admin GET request is made to `/api/admin/orders`, THE API SHALL return a paginated list of all Orders across all Customers, ordered by `created_at` descending, including customer name, order total, and current Order_Status.
2. WHEN an authenticated admin GET request is made to `/api/admin/orders` with a `status` query parameter, THE API SHALL return only Orders whose current status matches the provided value.
3. WHEN an authenticated admin GET request is made to `/api/admin/orders` with a `customer_id` query parameter, THE API SHALL return only Orders belonging to that Customer.
4. WHEN an authenticated admin GET request is made to `/api/admin/orders/:orderId`, THE API SHALL return the full Order record including all Order_Items with Product_Variant details, the Order_Status history, associated Payments, and shipping address.
5. WHEN an authenticated admin PATCH request is made to `/api/admin/orders/:orderId/status` with a valid `status` value, THE API SHALL update the Order's status and return the updated Order record.
6. IF a PATCH request is made to `/api/admin/orders/:orderId/status` with a `status` value that is not one of `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, or `refunded`, THEN THE API SHALL return a 400 Bad Request response with a descriptive error message.
7. IF a PATCH request is made to `/api/admin/orders/:orderId/status` for an Order that does not exist, THEN THE API SHALL return a 404 Not Found response.

---

### Requirement 14: Admin Product Management

**User Story:** As an admin, I want to create, update, and remove products and their variants, so that I can keep the product catalog accurate and up to date.

#### Acceptance Criteria

1. WHEN an authenticated admin POST request is made to `/api/admin/products` with valid product fields (name, description, sku, retail_price, and at least one category_id), THE API SHALL create a new Product record and return the created Product.
2. IF a POST request is made to `/api/admin/products` with a `sku` that already exists, THEN THE API SHALL return a 409 Conflict response with a descriptive error message.
3. WHEN an authenticated admin PUT request is made to `/api/admin/products/:productId` with updated fields, THE API SHALL update the Product record and return the updated Product.
4. WHEN an authenticated admin DELETE request is made to `/api/admin/products/:productId`, THE API SHALL soft-delete the Product by setting an `is_active` flag to false and return a 204 No Content response.
5. WHEN an authenticated admin POST request is made to `/api/admin/products/:productId/variants` with valid variant fields (size_id, color_id, stock_quantity, retail_price), THE API SHALL create a new Product_Variant linked to the Product and return the created Product_Variant.
6. WHEN an authenticated admin PUT request is made to `/api/admin/products/:productId/variants/:variantId` with updated fields, THE API SHALL update the Product_Variant record and return the updated Product_Variant.
7. WHEN an authenticated admin DELETE request is made to `/api/admin/products/:productId/variants/:variantId`, THE API SHALL soft-delete the Product_Variant by setting an `is_active` flag to false and return a 204 No Content response.
8. IF a request is made to a Product or Product_Variant that does not exist, THEN THE API SHALL return a 404 Not Found response.

---

### Requirement 15: Admin Inventory Management

**User Story:** As an admin, I want to update stock quantities and statuses for product variants, so that inventory levels stay accurate and customers see correct availability.

#### Acceptance Criteria

1. WHEN an authenticated admin PATCH request is made to `/api/admin/products/:productId/variants/:variantId/inventory` with a `stock_quantity` value, THE API SHALL update the Product_Variant's `stock_quantity` and return the updated Product_Variant.
2. WHEN the `stock_quantity` of a Product_Variant is updated to 0, THE API SHALL automatically set the Product_Variant's `stock_status` to `out_of_stock`.
3. WHEN the `stock_quantity` of a Product_Variant is updated to a value greater than 0, THE API SHALL automatically set the Product_Variant's `stock_status` to `in_stock`.
4. WHEN an authenticated admin GET request is made to `/api/admin/inventory`, THE API SHALL return a paginated list of all Product_Variants with their current `stock_quantity` and `stock_status`, filterable by `stock_status` query parameter.
5. IF a PATCH request is made to `/api/admin/products/:productId/variants/:variantId/inventory` with a `stock_quantity` value less than 0, THEN THE API SHALL return a 400 Bad Request response.

---

### Requirement 16: Admin Customer Management

**User Story:** As an admin, I want to view customer accounts and their order history, so that I can provide support and monitor platform activity.

#### Acceptance Criteria

1. WHEN an authenticated admin GET request is made to `/api/admin/customers`, THE API SHALL return a paginated list of all Customer records excluding password hashes, ordered by `created_at` descending.
2. WHEN an authenticated admin GET request is made to `/api/admin/customers` with a `search` query parameter, THE API SHALL return Customers whose first name, last name, or email contains the search term (case-insensitive).
3. WHEN an authenticated admin GET request is made to `/api/admin/customers/:customerId`, THE API SHALL return the Customer's profile fields excluding the password hash, along with a summary of the Customer's total orders and total spend.
4. WHEN an authenticated admin GET request is made to `/api/admin/customers/:customerId/orders`, THE API SHALL return a paginated list of all Orders belonging to that Customer, ordered by `created_at` descending.
5. IF a GET request is made to `/api/admin/customers/:customerId` for a Customer that does not exist, THEN THE API SHALL return a 404 Not Found response.
