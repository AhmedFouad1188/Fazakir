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
  upload.array("images", 5),
  validateProduct,
  async (req, res) => {
    const { name, price, description, category } = req.body;

    try {
      // Step 1: Insert the product
      const [result] = await db.execute(
        "INSERT INTO products (name, price, description, category) VALUES (?, ?, ?, ?)",
        [name, price, description, category]
      );
      const productId = result.insertId;

      // Step 2: Handle images (convert and store paths in `product_images`)
      const imageUrls = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const webpPath = await convertImageToWebP(file.path); // returns /uploads/filename.webp
          imageUrls.push(webpPath);
        }
      } else {
        imageUrls.push("/uploads/default.png");
      }

      // Step 3: Insert images into product_images table
      const imageInsertPromises = imageUrls.map((url) =>
        db.execute(
          "INSERT INTO product_images (product_id, image_url) VALUES (?, ?)",
          [productId, url]
        )
      );
      await Promise.all(imageInsertPromises);

      res.status(201).json({ product_id: productId });
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
    let query = `
      SELECT 
        p.product_id, p.name, p.price, p.description, 
        p.category, p.isdeleted,
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.product_id = p.product_id 
          ORDER BY pi.image_id ASC 
          LIMIT 1
        ) AS image_url
      FROM products p
      WHERE p.isdeleted = 0
    `;
    const values = [];

    if (category) {
      query += " AND p.category = ?";
      values.push(category);
    }

    const [rows] = await db.execute(query, values);

    // Assign a default image if none exists
    const products = rows.map(product => ({
      ...product,
      image_url: product.image_url || "/uploads/default.png"
    }));

    res.json(products);
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
        p.product_id, 
        p.name, 
        p.price, 
        p.description, 
        (
          SELECT image_url 
          FROM product_images 
          WHERE product_id = p.product_id 
          ORDER BY image_id ASC 
          LIMIT 1
        ) AS image_url,
        SUM(oi.quantity) AS total_sold
      FROM 
        orders o
      JOIN 
        order_items oi ON o.id = oi.order_id
      JOIN 
        products p ON oi.product_id = p.product_id
      WHERE 
        o.status = 'delivered' 
        AND p.isdeleted = 0
      GROUP BY 
        p.product_id
      ORDER BY 
        total_sold DESC
      LIMIT 5
    `);

    // Set default image if none exists
    const products = rows.map(product => ({
      ...product,
      image_url: product.image_url || "/uploads/default.png"
    }));

    res.json(products);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Get All Products for Admin Dashboard
router.get("/dashboard_fetch", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Convert to numbers explicitly
    const numericLimit = Number(limit);
    const numericOffset = Number(offset);

    let query = `
      SELECT p.*, GROUP_CONCAT(pi.image_url) AS image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE 1=1
    `;

    let countQuery = `SELECT COUNT(*) as total FROM products p WHERE 1=1`;
    const params = [];
    const countParams = [];

    // Add search conditions if search term exists
    if (search) {
      const searchParam = `%${search}%`;
      query += `
        AND (
          p.name LIKE ? OR 
          p.description LIKE ?
        )
      `;
      countQuery += `
        AND (
          p.name LIKE ? OR 
          p.description LIKE ?
        )
      `;

      // Add search param 6 times (once for each field)
      params.push(...Array(2).fill(searchParam));
      countParams.push(...Array(2).fill(searchParam));
    }

    // Add sorting and pagination
    query += ` GROUP BY p.product_id ORDER BY p.product_id DESC LIMIT ${numericLimit} OFFSET ${numericOffset}`;

    // Execute queries
    const [rows] = await db.execute(query, params);
    const [totalCountResult] = await db.execute(countQuery, countParams);
    const totalCount = totalCountResult[0].total;

    // Process the rows to split the concatenated image URLs
    const products = rows.map(row => ({
      ...row,
      image_url: row.image_url ? row.image_url.split(',') : []
    }));

    res.json({ products, totalCount });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Get Single Product
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch product details
    const [productRows] = await db.execute(
      "SELECT * FROM products WHERE product_id = ?",
      [id]
    );
    if (productRows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = productRows[0];

    // Fetch associated images
    const [imageRows] = await db.execute(
      "SELECT image_url FROM product_images WHERE product_id = ?",
      [id]
    );
    const imageUrls = imageRows.map((row) => row.image_url);

    // Combine product data with image URLs
    res.json({ ...product, image_url: imageUrls });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/:category/:excludeId', async (req, res) => {
  const { category, excludeId } = req.params;
  try {
    const [products] = await db.execute(
      `SELECT 
         p.*, 
         (SELECT image_url 
          FROM product_images 
          WHERE product_id = p.product_id 
          ORDER BY image_id ASC 
          LIMIT 1) AS image_url
       FROM products p
       WHERE p.category = ? AND p.product_id != ?
       LIMIT 4`,
      [category, excludeId]
    );
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch related products" });
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
      const [existingProduct] = await db.execute(
        "SELECT * FROM products WHERE product_id = ?",
        [product_id]
      );
      if (existingProduct.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Step 1: Fetch existing image URLs from product_images
      const [existingImages] = await db.execute(
        "SELECT image_url FROM product_images WHERE product_id = ?",
        [product_id]
      );
      const existingUrls = existingImages.map((img) => img.image_url);

      const keepImages = Array.isArray(remainingImages)
        ? remainingImages
        : typeof remainingImages === "string"
        ? [remainingImages]
        : [];

      // Step 2: Delete removed images from disk and database
      for (const img of existingUrls) {
        if (!keepImages.includes(img) && img !== "/uploads/default.png") {
          const imgPath = path.join(__dirname, "../../", img);
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
          await db.execute(
            "DELETE FROM product_images WHERE product_id = ? AND image_url = ?",
            [product_id, img]
          );
        }
      }

      // Step 3: Add new uploaded images
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const webpPath = await convertImageToWebP(file.path);
          await db.execute(
            "INSERT INTO product_images (product_id, image_url) VALUES (?, ?)",
            [product_id, webpPath]
          );
        }
      }

      // Step 4: Update product info
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

      if (updateFields.length > 0) {
        values.push(product_id);
        const query = `UPDATE products SET ${updateFields.join(", ")} WHERE product_id = ?`;
        await db.execute(query, values);
      }

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
