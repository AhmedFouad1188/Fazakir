const express = require("express");
const db = require("./db"); // 👈 Import the database connection
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

db.getConnection()
  .then((connection) => {
    console.log("Connected to MySQL database!");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

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