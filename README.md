# Lingerie E-Commerce API

A REST API backend for a lingerie e-commerce platform built with Node.js, Express 5, Sequelize 6, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express 5
- **Database**: PostgreSQL via Sequelize 6 (`pg` / `pg-hstore`)
- **Auth**: JSON Web Tokens (`jsonwebtoken`) + `bcrypt` for password hashing
- **CORS**: Configured for `http://localhost:8081`

## Getting Started

```bash
cd backend
npm install
node server.js
```

Server runs on port `8080` by default. Override with the `PORT` environment variable:

```bash
PORT=3000 node server.js
```

## Testing

[Jest](https://jestjs.io/) is configured as the test runner with `--runInBand` (serial execution) to avoid database connection conflicts.

```bash
cd backend
npm test
```

Tests run in the `node` environment. Property-based tests live in `backend/tests/` and use [fast-check](https://fast-check.dev/) for generative testing.

### Property Tests

| File                                    | Property   | Description                                                                                                             | Requirements     |
| --------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `auth.service.property.test.js`         | Property 1 | Registration–login round trip preserves identity; wrong password returns 401; duplicate email returns 409               | 1.1, 1.3         |
| `auth.middleware.property.test.js`      | Property 3 | Auth middleware rejects all invalid tokens (missing, malformed, expired, wrong secret, tampered) and accepts valid ones | 1.5, 1.6         |
| `adminAuth.middleware.property.test.js` | Property 5 | Admin middleware returns 401 for invalid/missing JWTs and 403 for valid JWTs without the `admin` role claim             | 12.3, 12.4, 12.5 |

## Environment Variables

| Variable     | Default    | Description                                                            |
| ------------ | ---------- | ---------------------------------------------------------------------- |
| `PORT`       | `8080`     | HTTP port the server listens on                                        |
| `JWT_SECRET` | `changeme` | Secret used to sign/verify JWTs — **set a strong value in production** |

## Project Structure

```
backend/
├── config/
│   └── db.config.js              # PostgreSQL connection (host, user, pool)
├── middleware/
│   ├── auth.middleware.js        # JWT authentication middleware (customers)
│   └── adminAuth.middleware.js   # JWT authentication middleware (admins)
├── models/
│   ├── index.js                  # Sequelize instance, model loader, and association runner
│   └── *.js                      # Sequelize model definitions (one per table)
├── utils/
│   └── AppError.js               # Custom operational error class
└── server.js                     # Express app entry point
```

## Authentication

Protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt>
```

### `auth.middleware.js`

Validates the JWT on every protected customer route.

- Reads the `Authorization: Bearer <token>` header
- Verifies the token against `JWT_SECRET`
- On success: attaches `req.customer = { id, email }` and calls `next()`
- On failure: passes an `AppError(401)` to the global error handler

### `adminAuth.middleware.js`

Validates the JWT on every protected admin route and enforces the `admin` role.

- Reads the `Authorization: Bearer <token>` header
- Verifies the token against `JWT_SECRET`
- Checks that `payload.role === 'admin'`
- On success: attaches `req.admin = { id, email, role }` and calls `next()`
- On missing/invalid token: passes an `AppError(401)` to the global error handler
- On valid token but wrong role: passes an `AppError(403)` to the global error handler

## Error Handling

All operational errors are thrown as `AppError` instances:

```js
throw new AppError("Not found", 404);
```

The global error handler in `server.js` catches them and responds with:

```json
{ "message": "..." }
```

with the appropriate HTTP status code. Unexpected errors return `500` and are logged to the console.

## Domain Overview

| Area      | Description                                                 |
| --------- | ----------------------------------------------------------- |
| Products  | Catalog with variants (size/color), pricing, and categories |
| Customers | Registered users with addresses and preferences             |
| Cart      | Guest (session) and authenticated carts                     |
| Orders    | Full lifecycle with status tracking and itemized totals     |
| Payments  | Payment records linked to orders                            |
| Reviews   | Customer ratings and reviews per product                    |
| Wishlist  | Saved product lists per customer                            |
| Admin     | Separate admin auth + order/product/inventory/customer mgmt |
