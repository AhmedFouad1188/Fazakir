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

// ✅ Create a connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : false, // Optional SSL support
});

// ✅ Test database connection at startup
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Database connected successfully!");
    connection.release(); // Release connection back to pool
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1); // Exit process if DB is not connected
  }
})();

// ✅ Auto-reconnect on connection loss
db.on("error", (err) => {
  console.error("❌ MySQL Pool Error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("🔄 Reconnecting to database...");
    db.getConnection()
      .then((conn) => conn.release())
      .catch((err) => console.error("❌ Reconnection failed:", err.message));
  }
});

module.exports = db;
