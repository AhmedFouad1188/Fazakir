const express = require("express");
const db = require("../../db"); // Database connection
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const { authenticateFirebaseToken } = require("../../middleware/firebaseAuthMiddleware");
const adminOnly = require("../../middleware/authenticateAdmin");

const router = express.Router();

// ✅ Multer Configuration (Secure File Upload)
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

// ✅ Allow all image file types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// ✅ Product Validation Middleware
const validateProduct = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("price").isFloat({ gt: 0 }).withMessage("Price must be a positive number"),
  body("description").optional().trim(),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// ✅ Create Product (POST)
router.post("/add", authenticateFirebaseToken, adminOnly, upload.single("image"), validateProduct, async (req, res) => {
  const { name, price, description, stock } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : "/uploads/default.png";

  try {
    const [result] = await db.execute(
      "INSERT INTO products (name, price, description, image_url, stock) VALUES (?, ?, ?, ?, ?)",
      [name, price, description, image_url, stock]
    );
    res.status(201).json({ product_id: result.insertId, result });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to insert product" });
  }
});

// ✅ Get All Products (GET)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Update Product (PUT)
router.put("/:product_id", authenticateFirebaseToken, adminOnly, upload.single("image"), validateProduct, async (req, res) => {
  const { product_id } = req.params;
  const { name, price, description, stock } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null; // Only update if a new image is uploaded

  try {
    // Check if the product exists
    const [existingProduct] = await db.execute("SELECT * FROM products WHERE product_id = ?", [product_id]);
    if (existingProduct.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];

    if (name) { updateFields.push("name = ?"); values.push(name); }
    if (price) { updateFields.push("price = ?"); values.push(price); }
    if (description) { updateFields.push("description = ?"); values.push(description); }
    if (stock) { updateFields.push("stock = ?"); values.push(stock); }
    if (image_url) { updateFields.push("image_url = ?"); values.push(image_url); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(product_id); // Add ID at the end for the WHERE clause

    // Execute update query
    const query = `UPDATE products SET ${updateFields.join(", ")} WHERE product_id = ?`;
    await db.execute(query, values);

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ✅ Delete Product (DELETE)
router.delete("/:product_id", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM products WHERE product_id = ?", [req.params.product_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
