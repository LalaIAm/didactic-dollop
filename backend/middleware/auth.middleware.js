"use strict";

const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.customer = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

module.exports = authMiddleware;
