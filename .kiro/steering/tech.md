# Tech Stack

## Runtime & Framework

- **Node.js** with CommonJS modules (`"type": "commonjs"`)
- **Express 5** — HTTP server and routing
- **CORS** — configured to allow `http://localhost:8081`

## Database

- **PostgreSQL** — primary database (`kistdb`, host: localhost)
- **Sequelize 6** — ORM for model definitions and associations
- **pg / pg-hstore** — PostgreSQL driver

## Auth & Security

- **jsonwebtoken (JWT)** — authentication tokens
- **bcrypt** — password hashing

## Common Commands

```bash
# Install dependencies
cd backend && npm install

# Start the server (runs on port 8080 by default)
node server.js

# Override port via environment variable
PORT=3000 node server.js
```

## Notes

- No test framework is configured yet (`npm test` exits with error)
- No build step — plain Node.js, no transpilation
- Server listens on `process.env.PORT || 8080`
