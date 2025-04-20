const express = require("express");
const db = require("../../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { body, validationResult } = require("express-validator");
const { authenticateFirebaseToken } = require("../../middleware/firebaseAuthMiddleware");
const adminOnly = require("../../middleware/authenticateAdmin");

const router = express.Router();

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// ✅ Validation middleware
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

// ✅ Create product
router.post("/add", authenticateFirebaseToken, adminOnly, upload.single("image"), validateProduct, async (req, res) => {
  const { name, price, description, stock } = req.body;

  let image_url = "/uploads/default.png";
  try {
    if (req.file) {
      const webpFilename = req.file.filename.split(".")[0] + ".webp";
      const webpPath = `uploads/${webpFilename}`;

      await sharp(req.file.path).webp({ quality: 80 }).toFile(webpPath);
      fs.unlinkSync(req.file.path); // Remove original

      image_url = "/" + webpPath;
    }

    const [result] = await db.execute(
      "INSERT INTO products (name, price, description, image_url, stock) VALUES (?, ?, ?, ?, ?)",
      [name, price, description, image_url, stock]
    );

    res.status(201).json({ product_id: result.insertId });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ✅ Get all products
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM products WHERE isdeleted = 0");
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

router.get("/dashboard_fetch", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Update product
router.put("/:product_id", authenticateFirebaseToken, adminOnly, upload.single("image"), validateProduct, async (req, res) => {
  const { product_id } = req.params;
  const { name, price, description, stock } = req.body;

  try {
    const [existingProduct] = await db.execute("SELECT * FROM products WHERE product_id = ?", [product_id]);
    if (existingProduct.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    let image_url = existingProduct[0].image_url;

    if (req.file) {
      const webpFilename = req.file.filename.split(".")[0] + ".webp";
      const webpPath = `uploads/${webpFilename}`;

      await sharp(req.file.path).webp({ quality: 80 }).toFile(webpPath);
      fs.unlinkSync(req.file.path); // Remove original

      // Delete old image if not default
      if (image_url && image_url !== "/uploads/default.png") {
        const oldPath = path.join(__dirname, "..", "..", image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      image_url = "/" + webpPath;
    }

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

    values.push(product_id);
    const query = `UPDATE products SET ${updateFields.join(", ")} WHERE product_id = ?`;
    await db.execute(query, values);

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ✅ Delete product
router.put("/:product_id/delete", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    const [result] = await db.query("UPDATE products SET isdeleted = 1 WHERE product_id = ?", [req.params.product_id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id/restore
router.put("/:product_id/restore", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    await db.query("UPDATE products SET isdeleted = 0 WHERE product_id = ?", [req.params.product_id]);
    res.json({ message: "Product restored successfully" });
  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
