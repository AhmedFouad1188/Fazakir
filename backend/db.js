const mysql = require("mysql2/promise"); // Use promise-based MySQL2
require("dotenv").config();

// ✅ Validate required environment variables
const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT"];
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing environment variable: ${envVar}`);
    process.exit(1);
  }
});

// ✅ Create a connection pool with optimized settings
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // ⏳ Prevents hanging queries
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : false,
});

// ✅ Test database connection at startup
(async () => {
  try {
    const connection = await db.getConnection();
    await connection.ping(); // ✅ Ensures DB is active
    connection.release();
    console.log("✅ Database connected and responsive!");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
})();

module.exports = db;
