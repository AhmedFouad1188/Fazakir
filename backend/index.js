require("dotenv").config();
const path = require('path');
const express = require("express");
const db = require("./db"); // 👈 Import the database connection
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
require('./cron/hardDelete');

console.log("Running in:", process.env.NODE_ENV); // Debugging

const app = express();

app.use(cors({
  origin: "http://localhost:3000", // ✅ Allow only your frontend
  credentials: true, // ✅ Allow cookies & authentication headers
}));

// ✅ Middleware to Set COOP Headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(express.json());
app.use(cookieParser()); // Parse cookies

// Import Routes
const productsRoutes = require("./routes/api/products");
const authRoutes = require("./routes/api/auth");
const cartRoutes = require("./routes/api/cart");
const orderRoutes = require("./routes/api/orders");

app.use("/api/products", productsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1️⃣ Global Rate Limit (100 requests per 15 min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP
  message: "Too many requests. Please try again later.",
});

app.use(globalLimiter); // Apply to all routes

// 2️⃣ Login & Register (5 attempts per 10 min)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 requests per IP
  message: "Too many login attempts. Try again later.",
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// 4️⃣ Product Fetching (200 requests per 10 min)
const productLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200, // Limit API requests to products
  message: "Too many requests. Please slow down.",
});

app.use("/api/products", productLimiter);

const productAddLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40, // Limit API requests to products
  message: "Too many requests. Please slow down.",
});

app.use("/api/products/add", productAddLimiter);

const productUpdateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // Limit API requests to products
  message: "Too many requests. Please slow down.",
});

app.use("/api/products/:id", productUpdateLimiter);

// 5️⃣ Cart & Order Operations (20 requests per 5 min)
const cartOrderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: "Too many actions on cart/orders. Please wait.",
});

app.use("/cart", cartOrderLimiter);
app.use("/checkout", cartOrderLimiter);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});