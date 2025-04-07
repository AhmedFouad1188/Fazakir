const admin = require("firebase-admin");
const dotenv = require("dotenv");
const db = require("../db");

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK using environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: process.env.FIREBASE_universe_domain,
    }),
  });
}

// Firebase Authentication Middleware
const authenticateFirebaseToken = async (req, res, next) => {
  try {
    let token = req.cookies?.authToken || req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 🔍 Fetch full user from MySQL using Firebase UID
    const [rows] = await db.execute("SELECT * FROM users WHERE firebase_uid = ? LIMIT 1", [
      decodedToken.uid,
    ]);
    
    if (rows.length > 0) {
      // User exists in DB — attach full user data
      req.user = rows[0];
    } else {
      // User doesn't exist yet — attach partial Firebase data
      req.user = decodedToken;
    }

    // ✅ Store token in HttpOnly cookie if not already set
    if (!req.cookies?.authToken) {
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // "None" for cross-origin, "Lax" for localhost
      });
    }
    
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authenticateFirebaseToken, admin };
