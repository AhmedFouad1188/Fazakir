const express = require("express");
const { authenticateFirebaseToken, admin } = require("../../middleware/firebaseAuthMiddleware");
const adminOnly = require("../../middleware/authenticateAdmin");
const db = require("../../db"); // Import MySQL connection
const router = express.Router();
const sendVerificationEmail = require("../../utils/sendVerificationEmail");
const jwt = require('jsonwebtoken');
const { sendRecoveryEmail } = require("../../utils/sendRecoveryEmail");

const JWT_SECRET = process.env.JWT_SECRET;

// Check if user exists
const checkUser = async (firebaseUID) => {
  try {
    const [results] = await db.execute("SELECT * FROM users WHERE firebase_uid = ? LIMIT 1", [firebaseUID]);
    return results.length ? results[0] : null; // ✅ Return single object or null
  } catch (err) {
    console.error("❌ Database query error:", err);
    throw new Error("Database error"); // ✅ Throw an error instead of returning an empty array
  }
};

// Insert or update user, return user data
const insertUser = async (firebaseUID, firstname, lastname, email) => {
  const sql = `
    INSERT INTO users (firebase_uid, firstname, lastname, email)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      firebase_uid = VALUES(firebase_uid),
      firstname = VALUES(firstname),
      lastname = VALUES(lastname),
      email = VALUES(email)
  `;

  await db.execute(sql, [firebaseUID, firstname, lastname, email]);

  // ✅ Always return the user object (fetch only when necessary)
  return checkUser(firebaseUID);
};

/**
 * ✅ User Registration (Verify Firebase ID Token)
 * Registers new user or updates existing user details.
 */
router.post("/register", authenticateFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.uid; // Extract Firebase UID from middleware
    const email = req.user.email;

    // Extract form data from request body
    const { firstname, lastname, country, dial_code, mobile } = req.body;

    if (!firstname || !lastname || !country || !mobile) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
      INSERT INTO users (firebase_uid, firstname, lastname, country, dial_code, mobile, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        firebase_uid = VALUES(firebase_uid),
        firstname = VALUES(firstname),
        lastname = VALUES(lastname),
        country = VALUES(country),
        dial_code = VALUES(dial_code),
        mobile = VALUES(mobile),
        email = VALUES(email),
        isdeleted = DEFAULT(isdeleted),
        deleted_at = DEFAULT(deleted_at)
    `;

    await db.execute(sql, [firebaseUID, firstname, lastname, country, dial_code, mobile, email]);

    await sendVerificationEmail(email);
    
    res.json({
      message: "User registered successfully!",
      user: { firebaseUID, firstname, lastname, country, dial_code, mobile, email },
    });

  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

/**
 * ✅ Login User (Verify Firebase ID Token)
 * Simply returns user details if authenticated.
 */
router.post("/login", authenticateFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.firebase_uid || req.user.uid;
    const email = req.user.email;
    const firstname = req.user.given_name || req.user.name?.split(" ")[0] || "Unknown";
    const lastname = req.user.family_name || req.user.name?.split(" ")[1] || "Unknown";

    let user = await checkUser(firebaseUID) || await insertUser(firebaseUID, firstname, lastname, email);

    res.json({ 
      message: "Login successful!", user }); // ✅ Fallback user object
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Logout User (Optional)
 * This is useful when using HttpOnly cookies for authentication.
 */
router.post("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure only in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // "None" for cross-origin, "Lax" for localhost
  });
  res.json({ message: "Logged out successfully!" });
});

router.get("/me", authenticateFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.firebase_uid || req.user.uid;
    const user = await checkUser(firebaseUID);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("❌ Error refreshing auth:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Refresh Token Route - Generate a New Token and Store it in Cookie
router.post("/refresh-token", async (req, res) => {
  try {
    const newFirebaseToken = req.header("Authorization")?.split(" ")[1];

    if (!newFirebaseToken) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(newFirebaseToken);

    res.cookie("authToken", newFirebaseToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.json({ message: "Token refreshed", newToken: newFirebaseToken });
  } catch (error) {
    console.error("Token refresh failed:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
});

router.put("/accountupdate", authenticateFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.firebase_uid; // Extract Firebase UID from middleware

    // Extract form data from request body
    const { firstname, lastname, country, dial_code, mobile, governorate, district, street, building, floor, apartment, landmark } = req.body;

    if (!firstname || !lastname || !country || !mobile || !street) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
      UPDATE users 
      SET firstname = ?, lastname = ?, country = ?, dial_code = ?, mobile = ?, governorate = ?, district = ?, street = ?, building = ?, floor = ?, apartment = ?, landmark = ?
      WHERE firebase_uid = ?
    `;

    await db.execute(sql, [firstname, lastname, country, dial_code, mobile, governorate, district, street, building, floor, apartment, landmark, firebaseUID]);
    
      res.json({
        message: "User account updated successfully!",
      });

  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// routes/auth.js
router.post('/soft-delete', authenticateFirebaseToken, async (req, res) => {
  const firebaseUID = req.user.firebase_uid;
  const email = req.user.email;

  try {
    // 1. Disable Firebase user
    await admin.auth().updateUser(firebaseUID, { disabled: true });

    // 2. Update DB flag and deletion timestamp
    await db.query(
      'UPDATE users SET isdeleted = 1, deleted_at = NOW() WHERE firebase_uid = ?',
      [firebaseUID]
    );

    await sendRecoveryEmail(email, firebaseUID);

    res.send({ message: "User soft-deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).send("Soft delete failed.");
  }
});

router.post('/recover-account', async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const uid = decoded.uid;

    // Enable Firebase user
    await admin.auth().updateUser(uid, { disabled: false });

    // Restore DB user
    await db.query(
      'UPDATE users SET isdeleted = 0, deleted_at = NULL WHERE firebase_uid = ?',
      [uid]
    );

    res.send({ message: "Account successfully recovered." });
  } catch (error) {
    console.error(error);
    res.status(500).send("Account recovery failed.");
  }
});

router.get("/fetchUsers", authenticateFirebaseToken, adminOnly, async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM users ORDER BY id DESC");

    res.json(results);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
