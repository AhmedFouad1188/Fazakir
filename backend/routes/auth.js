const express = require("express");
const { authenticateFirebaseToken } = require("../middleware/firebaseAuthMiddleware");
const db = require("../db"); // Import MySQL connection
const router = express.Router();

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
const insertUser = async (firebaseUID, firstname, lastname, email, isAdmin = 0) => {
  const sql = `
    INSERT INTO users (firebase_uid, firstname, lastname, email, is_admin)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      firstname = VALUES(firstname), 
      lastname = VALUES(lastname), 
      email = VALUES(email);
  `;

  await db.execute(sql, [firebaseUID, firstname, lastname, email, isAdmin]);

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
    const { firstname, lastname, country, countrycode, mobile } = req.body;

    if (!firstname || !lastname || !country || !countrycode || !mobile) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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

    await db.execute(sql, [firebaseUID, firstname, lastname, country, countrycode + mobile, email]);
    
      res.json({
        message: "User registered successfully!",
        user: { firebaseUID, firstname, lastname, country, countrycode, mobile, email },
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
    const firebaseUID = req.user.uid;
    const email = req.user.email;
    const firstname = req.user.given_name || req.user.name?.split(" ")[0] || "Unknown";
    const lastname = req.user.family_name || req.user.name?.split(" ")[1] || "Unknown";

    let user = await checkUser(firebaseUID) || await insertUser(firebaseUID, firstname, lastname, email);

    // ✅ Convert is_admin from 1/0 to true/false
    user.is_admin = Boolean(user.is_admin);
    
    const token = req.headers.authorization?.split(" ")[1];

    // ✅ Store token in HttpOnly cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.json({ 
      message: "Login successful!", user }); // ✅ Fallback user object
      console.log(user);
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.json({ message: "Logged out successfully!" });
});

router.get("/me", authenticateFirebaseToken, async (req, res) => {
  try {
    const user = await checkUser(req.user.uid);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // ✅ Ensure is_admin is included
    user.is_admin = Boolean(user.is_admin);

    res.json({ user });
  } catch (error) {
    console.error("❌ Error refreshing auth:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
