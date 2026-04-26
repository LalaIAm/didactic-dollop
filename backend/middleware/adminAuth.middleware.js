"use strict";

const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401));
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }

  if (payload.role !== "admin") {
    return next(new AppError("Forbidden: admin access required", 403));
  }

  req.admin = { id: payload.id, email: payload.email, role: payload.role };
  next();
}

module.exports = adminAuthMiddleware;
