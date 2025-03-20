const express = require("express");
const { authenticateFirebaseToken } = require("../middleware/firebaseAuthMiddleware");
const router = express.Router();
const db = require("../db"); // Your MySQL connection setup

// ✅ Fetch user's cart
router.get("/", authenticateFirebaseToken, async (req, res) => {
  const firebaseUID = decodedToken.uid; // Unique user ID from Firebase
  try {
    const [cartItems] = await db.query("SELECT * FROM cart WHERE firebase_uid = ?", [firebaseUID]);
    res.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add item to cart
router.post("/", authenticateFirebaseToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const firebaseUID = decodedToken.uid; // Unique user ID from Firebase

    await db.query(
      "INSERT INTO cart (firebase_uid, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
      [firebaseUID, productId, quantity, quantity]
    );

    res.json({ ...product, quantity }); // ✅ Return full product details with quantity
  } catch (error) {
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// ✅ Remove item from cart
router.delete("/:id", authenticateFirebaseToken, async (req, res) => {
  const firebaseUID = decodedToken.uid;
  const product_id = req.params.id;
  try {
    await db.query("DELETE FROM cart WHERE product_id = ? AND firebase_uid = ?", [productId, firebaseUID]);
    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
