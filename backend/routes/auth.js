const express = require("express");
const { authenticateFirebaseToken } = require("../middleware/firebaseAuthMiddleware");
const db = require("../db"); // Import MySQL connection
const router = express.Router();

// User Registration (Verify Firebase ID Token)
router.post("/", authenticateFirebaseToken, async (req, res) => {
  const { firstname, lastname, country, countrycode, mobile, email } = req.body;

  try {
    // 🔹 Firebase ID Token
    const firebaseUID = decodedToken.uid; // Unique user ID from Firebase

    // 🔹 Store user in MySQL (without password)
    const sql = `
      INSERT INTO users (firebase_uid, firstname, lastname, country, mobile, email)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      firstname = VALUES(firstname), 
      lastname = VALUES(lastname), 
      country = VALUES(country), 
      mobile = VALUES(mobile), 
      email = VALUES(email);
    `;
    
    db.query(sql, [firebaseUID, firstname, lastname, country, countrycode + mobile, email], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
    
      res.json({ message: "User registered successfully!" });
    });

  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
