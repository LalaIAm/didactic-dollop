const express = require("express");
const cors = require("cors");
const AppError = require("./utils/AppError");
const authRoutes = require("./routes/auth.routes");

const app = express();

const corsOptions = {
  origin: "http://localhost:8081",
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the app" });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Global error handler — must be registered after all routes
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
