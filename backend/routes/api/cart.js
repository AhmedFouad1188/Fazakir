const express = require("express");
const { authenticateFirebaseToken } = require("../../middleware/firebaseAuthMiddleware");
const router = express.Router();
const db = require("../../db"); // Your MySQL connection setup

// ✅ Fetch user's cart
router.get("/", authenticateFirebaseToken, async (req, res) => {
  const firebaseUID = req.user.firebase_uid; // Extract Firebase UID from middleware

  try {
    const [cartItems] = await db.execute(`SELECT
                c.product_id,
                p.name AS name,
                p.price AS price,
                p.image_url AS image_url,
                c.quantity
            FROM
                cart c
            JOIN
                products p ON c.product_id = p.product_id
            WHERE
                c.firebase_uid = ?`, [firebaseUID]);
    res.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add item to cart
router.post("/add", authenticateFirebaseToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const firebaseUID = req.user.firebase_uid;

    const sql = `
      INSERT INTO cart (firebase_uid, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = ?`;

    await db.execute(sql, [firebaseUID, productId, quantity, quantity]);

    const [productData] = await db.execute("SELECT * FROM products WHERE product_id = ?", [productId]);
    const product = productData[0];

    res.json({ ...product, quantity });
  } catch (error) {
    console.error("DB Error:", error); // ✅ Add this
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// ✅ Remove item from cart
router.delete("/:product_id", authenticateFirebaseToken, async (req, res) => {
  const firebaseUID = req.user.firebase_uid; // Extract Firebase UID from middleware
  const productId = req.params.product_id;
  try {
    const sql = `DELETE FROM cart WHERE product_id = ? AND firebase_uid = ?`;

    await db.execute(sql, [productId, firebaseUID]);

    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/update", authenticateFirebaseToken, async (req, res) => {
  const { productId, quantity } = req.body;
  const firebaseUID = req.user.firebase_uid;

  try {
    await db.execute(
      "UPDATE cart SET quantity = ? WHERE firebase_uid = ? AND product_id = ?",
      [quantity, firebaseUID, productId]
    );

    res.json({ product_id: productId, quantity });
  } catch (error) {
    console.error("Cart Update Error:", error);
    res.status(500).json({ error: "Failed to update quantity" });
  }
});

module.exports = router;
