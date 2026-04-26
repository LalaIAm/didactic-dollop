"use strict";

/**
 * Property 3: Auth Middleware Rejects All Invalid Tokens on Protected Routes
 *
 * For any protected route and any request carrying a missing, malformed,
 * expired, or tampered JWT, the API SHALL return a 401 Unauthorized response
 * and SHALL NOT execute the route handler.
 *
 * Validates: Requirements 1.5, 1.6
 */

const fc = require("fast-check");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth.middleware");

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
 * Run the middleware synchronously and capture what it does.
 * Returns { calledNext: true, err } when next(err) was called,
 * or { calledNext: false } when next() was never called (shouldn't happen).
 */
function runMiddleware(authHeader) {
  const req = makeReq(authHeader);
  const res = {}; // not used by the middleware
  let nextArg;
  let nextCalled = false;

  authMiddleware(req, res, (arg) => {
    nextCalled = true;
    nextArg = arg;
  });

  return { req, nextCalled, err: nextArg };
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 3 — Auth Middleware Rejects All Invalid Tokens", () => {
  // ── 3a: Missing Authorization header ──────────────────────────────────────
  test("3a: rejects when Authorization header is absent", () => {
    const { err } = runMiddleware(undefined);
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
  });

  // ── 3b: Header present but not a Bearer token ─────────────────────────────
  test("3b: rejects any non-Bearer Authorization header value", () => {
    fc.assert(
      fc.property(
        // Arbitrary strings that do NOT start with "Bearer "
        fc.string().filter((s) => !s.startsWith("Bearer ")),
        (headerValue) => {
          const { err } = runMiddleware(headerValue);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
        },
      ),
    );
  });

  // ── 3c: Malformed / random token strings ──────────────────────────────────
  test("3c: rejects arbitrary garbage after 'Bearer '", () => {
    fc.assert(
      fc.property(
        // Random printable strings — almost certainly not valid JWTs
        fc.string({ minLength: 1 }),
        (garbage) => {
          const { err } = runMiddleware(`Bearer ${garbage}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
        },
      ),
    );
  });

  // ── 3d: Expired tokens ────────────────────────────────────────────────────
  test("3d: rejects tokens that are expired", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
          // expiresIn between 1 and 3600 seconds in the past
          secondsAgo: fc.integer({ min: 1, max: 3600 }),
        }),
        ({ id, email, secondsAgo }) => {
          const expiredToken = jwt.sign(
            { id, email },
            JWT_SECRET,
            { expiresIn: -secondsAgo }, // negative = already expired
          );
          const { err } = runMiddleware(`Bearer ${expiredToken}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
        },
      ),
    );
  });

  // ── 3e: Tokens signed with a different secret ─────────────────────────────
  test("3e: rejects tokens signed with a wrong secret", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
          // Any secret that differs from the real one
          wrongSecret: fc
            .string({ minLength: 1 })
            .filter((s) => s !== JWT_SECRET),
        }),
        ({ id, email, wrongSecret }) => {
          const tamperedToken = jwt.sign({ id, email }, wrongSecret, {
            expiresIn: "1h",
          });
          const { err } = runMiddleware(`Bearer ${tamperedToken}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
        },
      ),
    );
  });

  // ── 3f: Tampered payload (signature mismatch) ─────────────────────────────
  test("3f: rejects tokens whose payload has been tampered with", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
          // A different id to inject into the payload
          fakeId: fc.integer({ min: 100001, max: 200000 }),
        }),
        ({ id, email, fakeId }) => {
          const validToken = jwt.sign({ id, email }, JWT_SECRET, {
            expiresIn: "1h",
          });

          // Tamper: replace the payload segment with a different base64 payload
          const [header, , signature] = validToken.split(".");
          const tamperedPayload = Buffer.from(
            JSON.stringify({ id: fakeId, email }),
          ).toString("base64url");
          const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

          const { err } = runMiddleware(`Bearer ${tamperedToken}`);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
        },
      ),
    );
  });

  // ── 3g: Valid token DOES pass (sanity / counter-example guard) ────────────
  test("3g: accepts a valid, non-expired token and attaches customer to req", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 100000 }),
          email: fc.emailAddress(),
        }),
        ({ id, email }) => {
          const validToken = jwt.sign({ id, email }, JWT_SECRET, {
            expiresIn: "1h",
          });
          const { req, err } = runMiddleware(`Bearer ${validToken}`);
          // next() should be called with no error
          expect(err).toBeUndefined();
          expect(req.customer).toEqual({ id, email });
        },
      ),
    );
  });
});
