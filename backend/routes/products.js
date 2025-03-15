const express = require("express");
const mysql = require("mysql2/promise"); // Use mysql2 with promises
const multer = require("multer");
const path = require("path");
const router = express.Router();
require("dotenv").config();

// Multer Configuration
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// MySQL Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST, // e.g., "localhost"
  user: process.env.DB_USER, // e.g., "root"
  password: process.env.DB_PASSWORD, // Updated to match dotenv variable
  database: process.env.DB_NAME, // e.g., "yourdbname"
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Create a Product (POST) with Image Upload
router.post("/products", upload.single("image"), async (req, res) => {
  const { name, price, description } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null; // Save image path

  try {
    const [result] = await pool.execute(
      "INSERT INTO products (name, price, description, image_url) VALUES (?, ?, ?, ?)",
      [name, price, description, image_url]
    );
    res.status(201).json({ id: result.insertId, name, price, description, image_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get All Products (GET)
router.get("/products", async (req, res) => { // Updated route to match best practices
  try {
    const [rows] = await pool.execute("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get a Single Product (GET)
router.get("/products/:id", async (req, res) => { // Updated route to match best practices
  const { id } = req.params;
  console.log(`Fetching product with ID: ${id}`); // Debugging line
  try {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) {
      console.log("No product found in database"); // Debugging line
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Database error:", err); // Debugging line
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update a Product with Image Upload (PUT)
router.put("/products/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url; // Keep old image if no new upload

  try {
    const [result] = await pool.execute(
      "UPDATE products SET name = ?, price = ?, description = ?, image_url = ? WHERE id = ?",
      [name, price, description, image_url, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product updated successfully", image_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a Product (DELETE)
router.delete("/products/:id", async (req, res) => { // Updated route to match best practices
  const { id } = req.params;
  try {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Serve Uploaded Images
router.use("/uploads", express.static("uploads"));

module.exports = router;
