const express = require("express");
const mysql = require("mysql2/promise"); // Use mysql2 with promises
const router = express.Router();
require("dotenv").config();

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

// ✅ Create a Product (POST)
router.post("/", async (req, res) => { // Updated route to match best practices
  const { name, price, description, image_url } = req.body;
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
router.get("/", async (req, res) => { // Updated route to match best practices
  try {
    const [rows] = await pool.execute("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get a Single Product (GET)
router.get("/:id", async (req, res) => { // Updated route to match best practices
  const { id } = req.params;
  try {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update a Product (PUT)
router.put("/:id", async (req, res) => { // Updated route to match best practices
  const { id } = req.params;
  const { name, price, description, image_url } = req.body;
  try {
    const [result] = await pool.execute(
      "UPDATE products SET name = ?, price = ?, description = ?, image_url = ? WHERE id = ?",
      [name, price, description, image_url, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a Product (DELETE)
router.delete("/:id", async (req, res) => { // Updated route to match best practices
  const { id } = req.params;
  try {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
