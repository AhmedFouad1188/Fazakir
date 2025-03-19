const express = require("express");
const db = require("../db"); // Import MySQL connection
const admin = require("firebase-admin");
const router = express.Router();

// Check if Firebase is already initialized
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// User Registration (Verify Firebase ID Token)
router.post("/", async (req, res) => {
  const { firstname, lastname, country, countrycode, mobile, email, idToken } = req.body;

  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    // 🔹 Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
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
