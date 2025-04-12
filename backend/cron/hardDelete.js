const cron = require("node-cron");
const db = require("../db"); // Your MySQL connection
const { getAuth } = require("firebase-admin/auth");

// Run every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running scheduled Firebase cleanup...");

  const [rows] = await db.query(`
    SELECT firebase_uid FROM users
    WHERE isdeleted = 1 AND deleted_at <= NOW() - INTERVAL 30 DAY
  `);

  for (const user of rows) {
    try {
      await getAuth().deleteUser(user.firebase_uid);
      console.log(`Deleted Firebase user: ${user.firebase_uid}`);
    } catch (err) {
      console.error(`Failed to delete ${user.firebase_uid}:`, err);
    }
  }
});
