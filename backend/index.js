const express = require("express");
const db = require("./db"); // 👈 Import the database connection
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

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
const productsRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");

app.use("/products", productsRoutes);
app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);
app.use("/uploads", express.static("uploads"));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});