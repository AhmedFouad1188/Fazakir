const express = require("express");
const db = require("./db"); // 👈 Import the database connection
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const admin = require("firebase-admin"); // ✅ Import Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

db.getConnection()
  .then((connection) => {
    console.log("Connected to MySQL database!");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

// Import Routes
const productsRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");

app.use("/products", productsRoutes);
app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);
app.use("/uploads", express.static("uploads"));

// Register User (Sign Up)
app.post("/signup", async (req, res) => {
  try {
    const { firstname, lastname, country, countrycode, mobile, email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length > 0) return res.status(400).json({ message: "Email already registered." });

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const sql = "INSERT INTO users (firstname, lastname, country, countrycode, mobile, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
      db.query(sql, [firstname, lastname, country, countrycode, mobile, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ message: "Error inserting user" });
        res.status(201).json({ message: "User registered successfully!" });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "All fields are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ message: "Invalid email or password" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    // 🔹 Send token and user info (excluding password)
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "Strict" }) // ✅ Securely store token in cookie
    .json({
      message: "Login successful",
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        country: user.country,
        mobile: user.mobile,
      },
    });
  });
});

// Middleware to verify Firebase Token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized - No Token Provided" });

  try {
    let decodedToken;
    if (token.startsWith("ey")) {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } else {
      decodedToken = await admin.auth().verifyIdToken(token);
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Unauthorized - Invalid Token" });
  }
};

// Protected Route - Get User Profile
app.get("/profile", verifyToken, async (req, res) => {
  try {
    // 🔹 Get user data from the database (Example: MySQL)
    // Here we assume you have a users table with email as the key
    const email = req.user.email;
    db.query("SELECT firstname, lastname, email, country, countrycode, mobile FROM users WHERE email = ?", [email], 
    (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user: result[0] });
    });

  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});