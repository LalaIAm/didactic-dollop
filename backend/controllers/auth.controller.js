"use strict";

const authService = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const { first_name, last_name, email, password } = req.body;
    const token = await authService.register(
      first_name,
      last_name,
      email,
      password,
    );
    res.status(201).json({ data: { token } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    res.status(200).json({ data: { token } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
