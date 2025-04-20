const nodemailer = require("nodemailer");

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
const sendOrderPlacedEmail = async (shipping_details, payment_method, products, total_price, orderId) => {
  try {
    // Email Template
    const mailOptions = {
      from: `"Fazakir.com" <${process.env.SMTP_USER}>`,
      to: shipping_details.email,
      subject: "Welcome to Fazakir.com - Your Order Placed",
      html: `
        <p>Hello, ${shipping_details.firstname} ${shipping_details.lastname}</p>
        <p>Thank you for purchasing from Fazakir.com</p>
        <p>Your order no. ${orderId} is placed successfully</p>
        <p>Order Details :</p>
        ${products.map(p => `
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <img
              src="${p.image_url.startsWith("http") ? p.image_url : `http://localhost:5000${p.image_url}`}"
              alt="${p.name}"
              style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; margin-right: 15px;"
            />
            <p>${p.name} x ${p.quantity} x ${p.price}</p>
          </div>
        `).join("")}        
        <p>Total : ${total_price}</p>
        <p>Payment Method : ${payment_method}</p>
        <p>Address : ${shipping_details.building} ${shipping_details.street} street, Floor ${shipping_details.floor}, Apartment ${shipping_details.apartment}, ${shipping_details.district}, ${shipping_details.governorate}, ${shipping_details.country}</p>
        <p>Landmark : ${shipping_details.landmark}</p>
        <p>Mobile : ${shipping_details.dial_code}${shipping_details.mobile}</p>
        <p>We are working on your order to be delivered to your doorstep as fast as possible.</p>
        <p>You can check your order status by clicking on the button below</p>
        <a href="${process.env.FRONTEND_URL}/orders" style="background:#008CBA;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Check Your Orders</a>
        <p>Fazakir.com</p>
      `,
    };

    // Send Email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order placed email sent to ${shipping_details.email}`);
  } catch (error) {
    console.error("❌ Error sending order email:", error.message);
  }
};

module.exports = sendOrderPlacedEmail;
