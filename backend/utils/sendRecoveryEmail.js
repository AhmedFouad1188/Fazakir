const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Secret key (use env variable in production!)
const JWT_SECRET = process.env.JWT_SECRET;

// Generate JWT
function generateRecoveryToken(firebaseUid) {
  return jwt.sign({ uid: firebaseUid }, JWT_SECRET, {
    expiresIn: "30d", // Valid for 30 days
  });
}

// Send Recovery Email
async function sendRecoveryEmail(email, firebaseUid) {
  const token = generateRecoveryToken(firebaseUid);
  const recoveryUrl = `${process.env.FRONTEND_URL}/recover-account?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., smtp.yourdomain.com or Gmail SMTP
    port: process.env.SMTP_PORT, // Usually 465 for SSL, 587 for TLS
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER, // Your email (e.g., contact@yourdomain.com)
      pass: process.env.SMTP_PASS, // Your email password or App Password
    },
  });

  const mailOptions = {
    from: `"Fazakir.com" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Recover Your Account - Fazakir.com",
    html: `
        <p>Hello,</p>
        <p>Click the link below to recover your account:</p>
        <a href="${recoveryUrl}">Recover Account</a>`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { generateRecoveryToken, sendRecoveryEmail };