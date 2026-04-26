"use strict";

/**
 * Property 1: Registration–Login Round Trip Preserves Identity
 *
 * For any valid registration payload (first name, last name, unique email,
 * password), registering and then logging in with the same credentials SHALL
 * return a JWT whose decoded `id` and `email` claims match the created
 * customer record.
 *
 * Validates: Requirements 1.1, 1.3
 */

const fc = require("fast-check");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Use 1 bcrypt round in tests so hashing is fast (security irrelevant here)
process.env.BCRYPT_ROUNDS = "1";

// ---------------------------------------------------------------------------
// Mock the Sequelize customers model before requiring the service.
// Jest allows variables prefixed with "mock" (case-insensitive) inside the
// jest.mock() factory, so we use `mockStore` here.
// ---------------------------------------------------------------------------

// In-memory store — mutated by helpers below after jest.mock() is hoisted.
let mockStore = [];

jest.mock("../models", () => ({
  customers: {
    findOne: jest.fn(async ({ where, order } = {}) => {
      if (where && where.email !== undefined) {
        return mockStore.find((c) => c.email === where.email) || null;
      }
      if (order) {
        // findOne({ order: [['id', 'DESC']] }) — return record with max id
        if (mockStore.length === 0) return null;
        return mockStore.reduce(
          (max, c) => (c.id > max.id ? c : max),
          mockStore[0],
        );
      }
      return null;
    }),
    create: jest.fn(async (fields) => {
      const record = { ...fields };
      mockStore.push(record);
      return record;
    }),
  },
}));

// Require service AFTER mock is set up
const authService = require("../services/auth.service");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  mockStore = [];
  jest.clearAllMocks();
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const nameArb = fc
  .stringMatching(/^[A-Za-z]{1,20}$/)
  .filter((s) => s.length > 0);

const emailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z]{3,10}$/),
    fc.nat({ max: 999999 }),
    fc.constantFrom("example.com", "test.org", "mail.net"),
  )
  .map(([user, n, domain]) => `${user}${n}@${domain}`);

const passwordArb = fc
  .string({ minLength: 8, maxLength: 32 })
  .filter((s) =>
    [...s].every((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) < 127),
  );

const registrationArb = fc.record({
  firstName: nameArb,
  lastName: nameArb,
  email: emailArb,
  password: passwordArb,
});

// ---------------------------------------------------------------------------
// Property 2 — Passwords Are Never Stored in Plaintext
// ---------------------------------------------------------------------------

/**
 * Property 2: Passwords Are Never Stored in Plaintext
 *
 * For any customer registration, the `password_hash` value stored in the
 * database SHALL NOT equal the plaintext password provided during registration.
 *
 * Validates: Requirements 1.1
 */

describe("Property 2 — Passwords Are Never Stored in Plaintext", () => {
  beforeEach(resetStore);

  test("2a: stored password_hash never equals the plaintext password", async () => {
    jest.setTimeout(30000);
    await fc.assert(
      fc.asyncProperty(
        registrationArb,
        async ({ firstName, lastName, email, password }) => {
          resetStore();

          await authService.register(firstName, lastName, email, password);

          // Retrieve the record that was stored in the mock store
          const stored = mockStore.find((c) => c.email === email);
          expect(stored).toBeDefined();
          expect(stored.password_hash).not.toBe(password);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1 — Registration–Login Round Trip Preserves Identity
// ---------------------------------------------------------------------------

describe("Property 1 — Registration–Login Round Trip Preserves Identity", () => {
  beforeEach(resetStore);

  test("1a: register then login returns a JWT whose id and email match the created customer", async () => {
    jest.setTimeout(30000);
    await fc.assert(
      fc.asyncProperty(
        registrationArb,
        async ({ firstName, lastName, email, password }) => {
          resetStore();

          // Step 1 — register
          const registerToken = await authService.register(
            firstName,
            lastName,
            email,
            password,
          );

          // The register token must decode to the correct email
          const registerPayload = jwt.verify(registerToken, JWT_SECRET);
          expect(registerPayload.email).toBe(email);
          expect(typeof registerPayload.id).toBe("number");

          const createdId = registerPayload.id;

          // Step 2 — login with the same credentials
          const loginToken = await authService.login(email, password);

          // The login token must decode to the same id and email
          const loginPayload = jwt.verify(loginToken, JWT_SECRET);
          expect(loginPayload.id).toBe(createdId);
          expect(loginPayload.email).toBe(email);
        },
      ),
      { numRuns: 50 },
    );
  });

  test("1b: login with wrong password after registration returns 401", async () => {
    jest.setTimeout(30000);
    await fc.assert(
      fc.asyncProperty(
        registrationArb,
        passwordArb,
        async ({ firstName, lastName, email, password }, wrongPassword) => {
          fc.pre(wrongPassword !== password);
          resetStore();

          await authService.register(firstName, lastName, email, password);

          await expect(
            authService.login(email, wrongPassword),
          ).rejects.toMatchObject({ statusCode: 401 });
        },
      ),
      { numRuns: 30 },
    );
  });

  test("1c: registering the same email twice returns 409 on the second attempt", async () => {
    jest.setTimeout(30000);
    await fc.assert(
      fc.asyncProperty(
        registrationArb,
        async ({ firstName, lastName, email, password }) => {
          resetStore();

          // First registration succeeds
          await authService.register(firstName, lastName, email, password);

          // Second registration with the same email must throw 409
          await expect(
            authService.register(firstName, lastName, email, password),
          ).rejects.toMatchObject({ statusCode: 409 });
        },
      ),
      { numRuns: 30 },
    );
  });
});
