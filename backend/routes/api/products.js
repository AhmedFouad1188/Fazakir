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

// ✅ Validation middleware - UPDATED
const validateProduct = [
  // Custom middleware to properly parse form-data
  (req, res, next) => {
    try {
      // If dimensions is a string, parse it
      if (req.body.dimensions && typeof req.body.dimensions === 'string') {
        req.body.dimensions = JSON.parse(req.body.dimensions);
      }
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: "Invalid dimensions format"
      });
    }
  },

  // Validation rules
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").optional().trim(),
  body("category").optional().trim(),
  body("color").optional().trim(),
  body("dimensions").optional().isArray().withMessage("Dimensions must be an array"),
  body("dimensions.*.width").isNumeric().withMessage("Width must be a number"),
  body("dimensions.*.height").isNumeric().withMessage("Height must be a number"),
  body("dimensions.*.price").isFloat({ gt: 0 }).withMessage("Price must be a positive number"),

  // Validation handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];

// ✅ Helper to convert uploaded image to WebP
const convertImageToWebP = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  const uploadsDir = path.join(__dirname, '../../uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const webpPath = path.join(uploadsDir, `${baseName}.webp`);

  if (ext !== ".webp") {
    await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);
    fs.unlinkSync(filePath); // Remove original
    return `/uploads/${baseName}.webp`; // Return web-accessible path
  } else {
    const newPath = path.join(uploadsDir, `${baseName}${ext}`);
    fs.renameSync(filePath, newPath);
    return `/uploads/${baseName}${ext}`;
  }
};

// ✅ Create Product
router.post(
  "/add",
  authenticateFirebaseToken,
  adminOnly,
  upload.array("images", 5),
  validateProduct,
  async (req, res) => {
    const { name, description, category, color } = req.body;
    let dimensions = [];
    
    try {
      dimensions = req.body.dimensions 
        ? (typeof req.body.dimensions === 'string' 
            ? JSON.parse(req.body.dimensions) 
            : req.body.dimensions)
        : [];
    } catch (err) {
      return res.status(400).json({ error: "Invalid dimensions format" });
    }

    try {
      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // 1. Insert product
        const [productResult] = await connection.execute(
          "INSERT INTO products (name, description, category, color) VALUES (?, ?, ?, ?)",
          [name, description, category, color]
        );
        const productId = productResult.insertId;

        // 2. Handle dimensions
        if (dimensions.length) {
          for (const dim of dimensions) {
            await connection.execute(
              "INSERT INTO product_dimensions (product_id, width, height, price) VALUES (?, ?, ?, ?)",
              [productId, dim.width, dim.height, dim.price]
            );
          }
        }

        // 3. Handle images
        const imageUrls = [];
        
        if (req.files?.length) {
          for (const file of req.files) {
            try {
              const webpPath = await convertImageToWebP(file.path);
              imageUrls.push(webpPath);
              
              await connection.execute(
                "INSERT INTO product_images (product_id, image_url) VALUES (?, ?)",
                [productId, webpPath]
              );
            } catch (err) {
              console.error("Error processing image:", err);
              // Skip this image but continue with others
            }
          }
        }

        // Add default image if no images were uploaded
        if (imageUrls.length === 0) {
          const defaultImage = "/uploads/default.png";
          await connection.execute(
            "INSERT INTO product_images (product_id, image_url) VALUES (?, ?)",
            [productId, defaultImage]
          );
          imageUrls.push(defaultImage);
        }

        await connection.commit();
        res.status(201).json({ 
          success: true,
          product_id: productId,
          image_urls: imageUrls
        });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// ✅ Get All Products (optionally by category)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, category, color } = req.query;
    const offset = (page - 1) * limit;
    const numericLimit = Number(limit);
    const numericOffset = Number(offset);

    // Base query with image handling
    let query = `
      SELECT 
        p.product_id, p.name, p.category, p.color,
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

    // Count query for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM products p
      WHERE p.isdeleted = 0
    `;

    const queryParams = [];
    const countParams = [];

    // Add filters
    if (category) {
      query += " AND p.category = ?";
      countQuery += " AND p.category = ?";
      queryParams.push(category);
      countParams.push(category);
    }

    if (color) {
      query += " AND p.color = ?";
      countQuery += " AND p.color = ?";
      queryParams.push(color);
      countParams.push(color);
    }

    // Add pagination to main query only
    query += ` ORDER BY p.product_id DESC LIMIT ? OFFSET ?`;
    queryParams.push(numericLimit.toString(), numericOffset.toString());

    // Execute queries
    const [products] = await db.execute(query, queryParams);
    const [[totalCount]] = await db.execute(countQuery, countParams);

    res.json({
      products: products,
      totalCount: totalCount.total
    });

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ 
      error: "Database operation failed",
      details: err.message,
      sql: err.sql,
      params: err.params
    });
  }
});

// ✅ Get Bestselling Products
router.get("/bestselling", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        p.product_id, p.name, 
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

router.get("/category", async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT 
        p.product_id, p.name,
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

    query += " LIMIT 5";

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

// ✅ Get All Products for Admin Dashboard
router.get("/dashboard_fetch", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const numericLimit = Number(limit);
    const numericOffset = Number(offset);

    // Base query with parameter placeholders
    let query = `
      SELECT 
        p.*,
        (
          SELECT GROUP_CONCAT(pi.image_url)
          FROM product_images pi
          WHERE pi.product_id = p.product_id
        ) AS image_url,
        (
          SELECT GROUP_CONCAT(CONCAT(pd.width, 'x', pd.height, 'x', pd.price))
          FROM product_dimensions pd
          WHERE pd.product_id = p.product_id
        ) AS dimensions
      FROM products p
      WHERE 1=1
    `;

    let countQuery = `SELECT COUNT(*) as total FROM products p WHERE 1=1`;
    const queryParams = [];
    const countParams = [];

    // Add search conditions if search term exists
    if (search) {
      const searchParam = `%${search}%`;
      query += `
        AND (
          p.name LIKE ? OR 
          p.description LIKE ? OR
          p.category LIKE ? OR
          p.color LIKE ?
        )
      `;
      countQuery += `
        AND (
          p.name LIKE ? OR 
          p.description LIKE ? OR
          p.category LIKE ? OR
          p.color LIKE ?
        )
      `;
      
      // Add search param 4 times (once for each field) to both queries
      for (let i = 0; i < 4; i++) {
        queryParams.push(searchParam);
        countParams.push(searchParam);
      }
    }

    // Add pagination to main query only
    query += ` ORDER BY p.product_id DESC LIMIT ? OFFSET ?`;
    queryParams.push(numericLimit.toString(), numericOffset.toString());

    // Execute queries
    const [products] = await db.execute(query, queryParams);
    const [[totalCount]] = await db.execute(countQuery, countParams);

    // Process results
    const processedProducts = products.map(product => ({
      ...product,
      image_url: product.image_url 
        ? product.image_url.split(',').map(url => url.trim())
        : ['/uploads/default.png'],
      dimensions: product.dimensions
        ? product.dimensions.split(',').map(dim => {
            const [width, height, price] = dim.split('x');
            return { width, height, price };
          })
        : []
    }));

    res.json({
      products: processedProducts,
      totalCount: totalCount.total
    });

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ 
      error: "Database operation failed",
      details: err.message,
      sql: err.sql,
      params: err.params
    });
  }
});

// ✅ Get Single Product
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch product details with images and dimensions in a single query
    const [productRows] = await db.execute(`
      SELECT 
        p.product_id, p.name, p.description, p.category,
        (
          SELECT GROUP_CONCAT(pi.image_url)
          FROM product_images pi
          WHERE pi.product_id = p.product_id
        ) AS image_url,
        (
          SELECT GROUP_CONCAT(CONCAT(pd.width, 'x', pd.height, 'x', pd.price))
          FROM product_dimensions pd
          WHERE pd.product_id = p.product_id
        ) AS dimensions
      FROM products p
      WHERE p.product_id = ? AND p.isdeleted = 0
    `, [id]);

    const product = productRows[0];
    
    // Process the data
    const response = {
      ...product,
      image_url: product.image_url 
        ? product.image_url.split(',').map(url => url.trim())
        : ['/uploads/default.png'],
      dimensions: product.dimensions
        ? product.dimensions.split(',').map(dim => {
            const [width, height, price] = dim.split('x');
            return { width, height, price };
          })
        : []
    };

    res.json({ product: response });
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
         p.product_id, p.name, 
         (SELECT image_url 
          FROM product_images 
          WHERE product_id = p.product_id 
          ORDER BY image_id ASC 
          LIMIT 1) AS image_url
       FROM products p
       WHERE p.category = ? AND p.product_id != ? AND p.isdeleted = 0
       LIMIT 5`,
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
  upload.array("images", 5),
  validateProduct,
  async (req, res) => {
    const { product_id } = req.params;
    const { name, description, category, color } = req.body;
    let dimensions = req.body.dimensions || [];
    let remainingImages = req.body.remainingImages || [];

    try {
      // Verify product exists
      const [existingProduct] = await db.execute(
        "SELECT * FROM products WHERE product_id = ?",
        [product_id]
      );
      
      if (!existingProduct.length) {
        return res.status(404).json({ 
          success: false,
          message: "Product not found" 
        });
      }

      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // 1. Handle images
        const keepImages = Array.isArray(remainingImages) 
          ? remainingImages 
          : [remainingImages].filter(Boolean);

        // Get current images from DB
        const [existingImages] = await connection.execute(
          "SELECT image_id, image_url FROM product_images WHERE product_id = ?",
          [product_id]
        );

        // Delete images that are no longer needed
        for (const { image_id, image_url } of existingImages) {
          if (!keepImages.includes(image_url)) {
            try {
              // Delete from filesystem
              const relativePath = image_url.startsWith('/') 
                ? image_url.substring(1) 
                : image_url;
              const fullPath = path.join(__dirname, '../../', relativePath);
              
              if (fs.existsSync(fullPath) && image_url !== "/uploads/default.png") {
                fs.unlinkSync(fullPath);
              }
              
              // Delete from database
              await connection.execute(
                "DELETE FROM product_images WHERE image_id = ?",
                [image_id]
              );
            } catch (err) {
              console.error(`Error deleting image ${image_url}:`, err);
              // Continue with other operations
            }
          }
        }

        // Add new images
        const newImageUrls = [];
        if (req.files?.length) {
          for (const file of req.files) {
            try {
              const webpPath = await convertImageToWebP(file.path);
              await connection.execute(
                "INSERT INTO product_images (product_id, image_url) VALUES (?, ?)",
                [product_id, webpPath]
              );
              newImageUrls.push(webpPath);
            } catch (err) {
              console.error("Error processing new image:", err);
              // Skip this image but continue with others
            }
          }
        }

        // 2. Handle dimensions
        await connection.execute(
          "DELETE FROM product_dimensions WHERE product_id = ?",
          [product_id]
        );

        if (dimensions.length) {
          for (const dim of dimensions) {
            if (!dim.width || !dim.height || !dim.price) continue;
            await connection.execute(
              "INSERT INTO product_dimensions (product_id, width, height, price) VALUES (?, ?, ?, ?)",
              [product_id, dim.width, dim.height, dim.price]
            );
          }
        }

        // 3. Update product info
        const updateFields = [];
        const values = [];
        
        const fields = { name, description, category, color };
        for (const [field, value] of Object.entries(fields)) {
          if (value !== undefined) {
            updateFields.push(`${field} = ?`);
            values.push(value);
          }
        }

        if (updateFields.length) {
          values.push(product_id);
          await connection.execute(
            `UPDATE products SET ${updateFields.join(", ")} WHERE product_id = ?`,
            values
          );
        }

        await connection.commit();
        
        res.json({ message: "Product updated successfully" });

      } catch (err) {
        await connection.rollback();
        console.error("Transaction error:", err);
        res.status(500).json({ 
          error: "Transaction failed",
          details: err.message 
        });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ 
        error: "Failed to update product",
        details: err.message 
      });
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
