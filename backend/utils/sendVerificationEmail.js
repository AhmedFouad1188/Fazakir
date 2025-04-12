const nodemailer = require("nodemailer");
const { admin } = require("../middleware/firebaseAuthMiddleware");

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.yourdomain.com or Gmail SMTP
  port: process.env.SMTP_PORT, // Usually 465 for SSL, 587 for TLS
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER, // Your email (e.g., contact@yourdomain.com)
    pass: process.env.SMTP_PASS, // Your email password or App Password
  },
});

// Function to Send a Custom Email Verification Link
const sendVerificationEmail = async (email, firebaseUID) => {
  try {
    // Generate Firebase Email Verification Link
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/`, // Redirect URL
      handleCodeInApp: true,
    };

    const verificationLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

    // Email Template
    const mailOptions = {
      from: `"Fazakir.com" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to Fazakir.com - Verify your email",
      html: `
        <p>Hello,</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}" style="background:#008CBA;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    // Send Email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending verification email:", error.message);
  }
};

module.exports = sendVerificationEmail;
