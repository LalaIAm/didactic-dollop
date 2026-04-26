"use strict";

/**
 * Property 5: Admin Middleware Enforces Role on Every Admin Route
 *
 * For any admin-protected route, a request carrying a valid customer JWT
 * (role claim absent or not "admin") SHALL receive a 403 Forbidden response,
 * and a request with no valid JWT SHALL receive a 401 Unauthorized response.
 *
 * Validates: Requirements 12.3, 12.4, 12.5
 */

const fc = require("fast-check");
const jwt = require("jsonwebtoken");
const adminAuthMiddleware = require("../middleware/adminAuth.middleware");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal mock Express req object with the given Authorization header.
 */
function makeReq(authHeader) {
  return {
    headers: authHeader !== undefined ? { authorization: authHeader } : {},
  };
}

/**
 * Run the admin middleware and capture what it does.
 * Returns { req, nextCalled, err } where err is the argument passed to next().
 */
function runMiddleware(authHeader) {
  const req = makeReq(authHeader);
  const res = {};
  let nextArg;
  let nextCalled = false;

  adminAuthMiddleware(req, res, (arg) => {
    nextCalled = true;
    nextArg = arg;
  });

  return { req, nextCalled, err: nextArg };
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 5 — Admin Middleware Enforces Role on Every Admin Route", () => {
  // ── 5a: Missing Authorization header → 401 ────────────────────────────────
  test("5a: returns 401 when Authorization header is absent", () => {
    const { err } = runMiddleware(undefined);
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
  });

  // ── 5b: Non-Bearer header values → 401 ───────────────────────────────────
  test("5b: returns 401 for any non-Bearer Authorization header value", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.startsWith("Bearer ")),
        (headerValue) => {
          const { err } = runMiddleware(headerValue);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
        },
      ),
    );
  });

  // ── 5c: Arbitrary garbage tokens → 401 ───────────────────────────────────
  test("5c: returns 401 for arbitrary garbage after 'Bearer '", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (garbage) => {
        const { err } = runMiddleware(`Bearer ${garbage}`);
        expect(err).toBeDefined();
        expect(err.statusCode).toBe(401);
      }),
    );
  });

  // ── 5d: Expired tokens → 401 ─────────────────────────────────────────────
  test("5d: returns 401 for expired tokens (regardless of role)", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
          role: fc.constantFrom("admin", "customer", ""),
          secondsAgo: fc.integer({ min: 1, max: 3600 }),
        }),
        ({ id, email, role, secondsAgo }) => {
          const expiredToken = jwt.sign({ id, email, role }, JWT_SECRET, {
            expiresIn: -secondsAgo,
          });
          const { err } = runMiddleware(`Bearer ${expiredToken}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
        },
      ),
    );
  });

  // ── 5e: Tokens signed with wrong secret → 401 ────────────────────────────
  test("5e: returns 401 for tokens signed with a wrong secret", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
          role: fc.constantFrom("admin", "customer"),
          wrongSecret: fc
            .string({ minLength: 1 })
            .filter((s) => s !== JWT_SECRET),
        }),
        ({ id, email, role, wrongSecret }) => {
          const tamperedToken = jwt.sign({ id, email, role }, wrongSecret, {
            expiresIn: "1h",
          });
          const { err } = runMiddleware(`Bearer ${tamperedToken}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
        },
      ),
    );
  });

  // ── 5f: Valid JWT with role NOT "admin" → 403 ─────────────────────────────
  // Req 12.4: role claim present but not "admin" must yield 403
  test("5f: returns 403 for valid JWTs where role is not 'admin'", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
          // Any role string that is NOT "admin"
          role: fc.string().filter((r) => r !== "admin"),
        }),
        ({ id, email, role }) => {
          const customerToken = jwt.sign({ id, email, role }, JWT_SECRET, {
            expiresIn: "1h",
          });
          const { err } = runMiddleware(`Bearer ${customerToken}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(403);
        },
      ),
    );
  });

  // ── 5g: Valid JWT with no role claim at all → 403 ─────────────────────────
  // Req 12.4: role claim absent (undefined) must also yield 403
  test("5g: returns 403 for valid JWTs with no role claim", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
        }),
        ({ id, email }) => {
          // No role field in payload
          const noRoleToken = jwt.sign({ id, email }, JWT_SECRET, {
            expiresIn: "1h",
          });
          const { err } = runMiddleware(`Bearer ${noRoleToken}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(403);
        },
      ),
    );
  });

  // ── 5h: Valid JWT with role="customer" → 403 (explicit customer case) ─────
  test("5h: returns 403 for a valid customer JWT (role=customer)", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
        }),
        ({ id, email }) => {
          const customerToken = jwt.sign(
            { id, email, role: "customer" },
            JWT_SECRET,
            { expiresIn: "1h" },
          );
          const { err } = runMiddleware(`Bearer ${customerToken}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(403);
        },
      ),
    );
  });

  // ── 5i: Valid admin JWT → passes through (next() called with no error) ────
  // Req 12.3: valid admin JWT must pass control to the route handler
  test("5i: passes through (calls next with no error) for valid admin JWTs", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
        }),
        ({ id, email }) => {
          const adminToken = jwt.sign(
            { id, email, role: "admin" },
            JWT_SECRET,
            { expiresIn: "1h" },
          );
          const { req, err } = runMiddleware(`Bearer ${adminToken}`);
          // next() should be called with no error argument
          expect(err).toBeUndefined();
          // req.admin should be populated
          expect(req.admin).toEqual({ id, email, role: "admin" });
        },
      ),
    );
  });
});
