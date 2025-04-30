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
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// ✅ Helper to convert uploaded image to WebP
const convertImageToWebP = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  const webpPath = `uploads/${baseName}.webp`;

  if (ext !== ".webp") {
    await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);
    fs.unlinkSync(filePath);
  } else {
    fs.renameSync(filePath, webpPath);
  }
  return "/" + webpPath;
};

// ✅ Create Product
router.post(
  "/add",
  authenticateFirebaseToken,
  adminOnly,
  upload.array("images", 5), // <<< accept multiple images
  validateProduct,
  async (req, res) => {
    const { name, price, description, category } = req.body;

    let image_urls = []; // array to hold all image paths

    try {
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const webpPath = await convertImageToWebP(file.path);
          image_urls.push(webpPath);
        }
      } else {
        image_urls.push("/uploads/default.png");
      }

      const [result] = await db.execute(
        "INSERT INTO products (name, price, description, image_url, category) VALUES (?, ?, ?, ?, ?)",
        [name, price, description, JSON.stringify(image_urls), category] // << store as JSON string
      );

      res.status(201).json({ product_id: result.insertId });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// ✅ Get All Products (optionally by category)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let query = "SELECT * FROM products WHERE isdeleted = 0";
    const values = [];

    if (category) {
      query += " AND category = ?";
      values.push(category);
    }

    const [rows] = await db.execute(query, values);

    // Parse image_url if it's a stringified JSON array
    const parsedRows = rows.map((product) => ({
      ...product,
      image_url: (() => {
        try {
          return JSON.parse(product.image_url);
        } catch {
          return [];
        }
      })(),
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Get Bestselling Products
router.get("/bestselling", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        p.product_id, p.name, p.price, p.description, p.image_url, 
        SUM(oi.quantity) AS total_sold
      FROM 
        orders o
      JOIN 
        order_items oi ON o.id = oi.order_id
      JOIN 
        products p ON oi.product_id = p.product_id
      WHERE 
        o.status = 'delivered' AND p.isdeleted = 0
      GROUP BY 
        p.product_id
      ORDER BY 
        total_sold DESC
      LIMIT 5
    `);

    const parsedRows = rows.map((product) => ({
      ...product,
      image_url: (() => {
        try {
          return JSON.parse(product.image_url);
        } catch {
          return [];
        }
      })(),
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Get All Products for Admin Dashboard
router.get("/dashboard_fetch", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM products");

    // Parse image_url field for each product
    const parsedRows = rows.map(product => ({
      ...product,
      image_url: JSON.parse(product.image_url || "[]"),
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Get Single Product
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute("SELECT * FROM products WHERE product_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const parsedRows = rows.map((product) => ({
      ...product,
      image_url: (() => {
        try {
          return JSON.parse(product.image_url);
        } catch {
          return [];
        }
      })(),
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update Product
router.put(
  "/:product_id",
  authenticateFirebaseToken,
  adminOnly,
  upload.array("images", 5), // Up to 5 images
  validateProduct,
  async (req, res) => {
    const { product_id } = req.params;
    const { name, price, description, category, remainingImages } = req.body;

    try {
      const [existingProduct] = await db.execute("SELECT * FROM products WHERE product_id = ?", [product_id]);
      if (existingProduct.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      let image_url = [];
      const oldImageUrls = JSON.parse(existingProduct[0].image_url || "[]");
      const keepImages = Array.isArray(remainingImages)
        ? remainingImages
        : typeof remainingImages === "string"
        ? [remainingImages]
        : [];

      // Delete removed images from disk
      oldImageUrls.forEach((oldImg) => {
        if (!keepImages.includes(oldImg) && oldImg !== "/uploads/default.png") {
          const oldImagePath = path.join(__dirname, "../../", oldImg);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      });

      image_url = [...keepImages];

      // Convert and add newly uploaded images
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const convertedUrl = await convertImageToWebP(file.path);
          image_url.push(convertedUrl);
        }
      }

      const updateFields = [];
      const values = [];

      if (name) {
        updateFields.push("name = ?");
        values.push(name);
      }
      if (price) {
        updateFields.push("price = ?");
        values.push(price);
      }
      if (description) {
        updateFields.push("description = ?");
        values.push(description);
      }
      if (category) {
        updateFields.push("category = ?");
        values.push(category);
      }

      // Always update image_url
      updateFields.push("image_url = ?");
      values.push(JSON.stringify(image_url));

      values.push(product_id);
      const query = `UPDATE products SET ${updateFields.join(", ")} WHERE product_id = ?`;
      await db.execute(query, values);

      res.json({ message: "Product updated successfully" });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// ✅ Soft Delete Product
router.put("/:product_id/delete", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    await db.query("UPDATE products SET isdeleted = 1 WHERE product_id = ?", [req.params.product_id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Restore Product
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
