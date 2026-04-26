"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { customers } = require("../models");
const AppError = require("../utils/AppError");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

/**
 * Register a new customer.
 * @returns {string} signed JWT
 * @throws {AppError} 409 if email already exists
 */
async function register(firstName, lastName, email, password) {
  const existing = await customers.findOne({ where: { email } });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const created_at = new Date().toISOString();

  // Generate a simple numeric id (max existing + 1)
  const maxRecord = await customers.findOne({ order: [["id", "DESC"]] });
  const id = maxRecord ? maxRecord.id + 1 : 1;

  const customer = await customers.create({
    id,
    first_name: firstName,
    last_name: lastName,
    email,
    password_hash,
    is_active: true,
    created_at,
  });

  const token = jwt.sign(
    { id: customer.id, email: customer.email },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );

  return token;
}

/**
 * Log in an existing customer.
 * @returns {string} signed JWT
 * @throws {AppError} 401 if credentials are invalid
 */
async function login(email, password) {
  const customer = await customers.findOne({ where: { email } });
  if (!customer) {
    throw new AppError("Invalid email or password", 401);
  }

  const match = await bcrypt.compare(password, customer.password_hash);
  if (!match) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign(
    { id: customer.id, email: customer.email },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );

  return token;
}

module.exports = { register, login };
