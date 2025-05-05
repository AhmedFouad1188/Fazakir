const express = require("express");
const router = express.Router();
const { authenticateFirebaseToken } = require("../../middleware/firebaseAuthMiddleware");
const adminOnly = require("../../middleware/authenticateAdmin");
const db = require("../../db"); // make sure this is a mysql2/promise pool
const sendOrderPlacedEmail = require("../../utils/sendOrderPlacedEmail");

router.post("/add", authenticateFirebaseToken, async (req, res) => {
  const connection = await db.getConnection(); // get connection from pool

  try {
    const { firebase_uid, shipping_details, payment_method, products, total_price } = req.body;

    if (
      !firebase_uid ||
      !shipping_details ||
      !products ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return res.status(400).json({ message: "Missing order data." });
    }

    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        firebase_uid, payment_method, total_price,
        firstname, lastname, email, country, dial_code, mobile,
        governorate, district, street, building, floor, apartment, landmark, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firebase_uid,
        payment_method,
        total_price,
        shipping_details.firstname,
        shipping_details.lastname,
        shipping_details.email,
        shipping_details.country,
        shipping_details.dial_code,
        shipping_details.mobile,
        shipping_details.governorate,
        shipping_details.district,
        shipping_details.street,
        shipping_details.building,
        shipping_details.floor,
        shipping_details.apartment,
        shipping_details.landmark,
        "placed"
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of products) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, name, description, image_url, quantity, price) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.description, item.image_url, item.quantity, item.price]
      );
    }

    await sendOrderPlacedEmail(shipping_details, payment_method, products, total_price, orderId);

    await connection.commit();

    res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (error) {
    await connection.rollback();
    console.error("Order placement failed:", error);
    res.status(500).json({ message: "Order placement failed" });
  } finally {
    connection.release();
  }  
});

// ✅ Fetch all orders for a user
router.get("/", authenticateFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.firebase_uid;

    const [orders] = await db.execute(
      `SELECT * FROM orders WHERE firebase_uid = ? ORDER BY id DESC`,
      [firebaseUID]
    );

    for (const order of orders) {
      const [items] = await db.execute(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [order.id]
      );

      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

router.put("/:orderId/update-item", authenticateFirebaseToken, async (req, res) => {
  const { productId, quantity } = req.body; // [{ product_id, quantity }]
  const { orderId } = req.params;
  const firebaseUID = req.user.firebase_uid;

  try {
    const [orderRows] = await db.execute(
      `SELECT * FROM orders WHERE id = ? AND firebase_uid = ?`,
      [orderId, firebaseUID]
    );
    
    if (!orderRows.length) {
      return res.status(404).json({ message: "Unauthorized or order not found" });
    }
    
    await db.execute(
      `UPDATE order_items SET quantity = ? WHERE order_id = ? AND product_id = ?`,
      [quantity, orderId, productId]
    );

    res.json({ message: "Order updated" });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
});

router.delete("/:orderId/delete-item/:productId", authenticateFirebaseToken, async (req, res) => {
  const { orderId, productId } = req.params;
  const firebaseUID = req.user.firebase_uid;

  try {
    const [orderRows] = await db.execute(
      `SELECT * FROM orders WHERE id = ? AND firebase_uid = ?`,
      [orderId, firebaseUID]
    );
    
    if (!orderRows.length) {
      return res.status(404).json({ message: "Unauthorized or order not found" });
    }
    
    await db.execute(
      `DELETE FROM order_items WHERE order_id = ? AND product_id = ?`,
      [orderId, productId]
    );

    res.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Failed to delete item" });
  }
});

// ✅ Cancel order
router.put("/:orderId/cancel", authenticateFirebaseToken, async (req, res) => {
  const firebaseUID = req.user.firebase_uid;
  const { orderId } = req.params;

  try {
    await db.execute(
      `UPDATE orders SET status = 'cancelled' WHERE id = ? AND firebase_uid = ?`,
      [orderId, firebaseUID]
    );

    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
});

router.put("/:orderId/orderAgain", authenticateFirebaseToken, async (req, res) => {
  const firebaseUID = req.user.firebase_uid;
  const { orderId } = req.params;

  try {
    const [orderRows] = await db.execute(
      `SELECT * FROM orders WHERE id = ? AND firebase_uid = ?`,
      [orderId, firebaseUID]
    );

    if (!orderRows.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderRows[0];

    if (order.status === "placed") {
      return res.status(400).json({ message: "Order already placed" });
    }

    await db.execute(
      `UPDATE orders SET status = 'placed' WHERE id = ? AND firebase_uid = ?`,
      [orderId, firebaseUID]
    );

    res.json({ message: "Order re-ordered successfully" });
  } catch (error) {
    console.error("Error ordering again:", error);
    res.status(500).json({ message: "Failed to re-order order" });
  }
});

router.get("/fetchAllOrders", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    const [orders] = await db.execute(`SELECT * FROM orders ORDER BY id DESC`);

    for (const order of orders) {
      const [items] = await db.execute(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [order.id]
      );

      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

router.put('/updateStatus/:orderId', authenticateFirebaseToken, adminOnly, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    await db.execute("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
    res.send({ message: "Status updated" });
  } catch (err) {
    res.status(500).send({ error: "Failed to update status" });
  }
});

router.put('/cancel/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    await db.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
    res.send({ message: "Order cancelled" });
  } catch (err) {
    res.status(500).send({ error: "Failed to cancel order" });
  }
});

module.exports = router;
