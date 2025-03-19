const express = require("express");
const router = express.Router();
const db = require("../db"); // Your MySQL connection setup
const { authenticateToken } = require("../middleware/authMiddleware"); // ✅ Ensure user is logged in

// ✅ Fetch user's cart
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [cartItems] = await db.query("SELECT * FROM cart WHERE user_id = ?", [userId]);
    res.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add item to cart
router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { product_id, name, price, image_url, quantity } = req.body;
  try {
    await db.query(
      "INSERT INTO cart (user_id, product_id, name, price, image_url, quantity) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
      [userId, product_id, name, price, image_url, quantity, quantity]
    );
    res.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Remove item from cart
router.delete("/:id", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;
  try {
    await db.query("DELETE FROM cart WHERE id = ? AND user_id = ?", [itemId, userId]);
    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
