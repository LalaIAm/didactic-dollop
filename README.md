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

Tests run in the `node` environment. Property-based tests live in `backend/tests/`.

## Environment Variables

| Variable     | Default    | Description                                                            |
| ------------ | ---------- | ---------------------------------------------------------------------- |
| `PORT`       | `8080`     | HTTP port the server listens on                                        |
| `JWT_SECRET` | `changeme` | Secret used to sign/verify JWTs — **set a strong value in production** |

## Project Structure

```
backend/
├── config/
│   └── db.config.js          # PostgreSQL connection (host, user, pool)
├── middleware/
│   └── auth.middleware.js    # JWT authentication middleware
├── models/
│   └── *.js                  # Sequelize model definitions (one per table)
├── utils/
│   └── AppError.js           # Custom operational error class
└── server.js                 # Express app entry point
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
