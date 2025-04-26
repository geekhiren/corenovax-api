const express = require("express");
const nodemailer = require("nodemailer");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Express API is live 🚀");
});

app.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    if (payload.event !== "payment.captured") {
      return res.status(400).send("Not a payment captured event.");
    }

    const payment = payload.payload.payment.entity;

    const paymentDetails = {
      payment_id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount/ 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      created_at: new Date(payment.created_at * 1000).toLocaleString(),
    };

    console.log("Extracted Payment Details:", paymentDetails);

    let htmlTemplate =`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Thank You for Your Purchase!</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      padding: 30px;
      border-radius: 8px;
      max-width: 600px;
      margin: auto;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    h2 {
      color: #333333;
    }
    p {
      color: #555555;
      line-height: 1.6;
    }
    .details {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
      font-size: 15px;
    }
    .ebook-button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 20px;
      background-color: #4CAF50;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      font-size: 13px;
      color: #999999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Thank You for Your Purchase! 🎉</h2>
    <p>Dear Customer,</p>
    <p>Thank you for your payment. Your eBook is now ready for you!</p>

    <div class="details">
      <p><strong>Order ID:</strong> {{order_id}}</p>
      <p><strong>Amount Paid:</strong> ₹{{amount}} {{currency}}</p>
      <p><strong>Payment Date:</strong> {{payment_date}}</p>
      <p><strong>Payment Method:</strong> {{payment_method}}</p>
    </div>

    <a class="ebook-button" href="{{ebook_link}}" target="_blank">📚 Download Your eBook</a>

    <p class="footer">© {{year}} CorenovaX. All rights reserved.</p>
  </div>
</body>
</html>
`;

    htmlTemplate = htmlTemplate
      .replace("{{order_id}}", paymentDetails.order_id)
      .replace("{{amount}}", paymentDetails.amount)
      .replace("{{currency}}", paymentDetails.currency)
      .replace("{{payment_date}}", paymentDetails.created_at)
      .replace("{{payment_method}}", paymentDetails.method)
      .replace(
        "{{ebook_link}}",
        "https://drive.google.com/drive/folders/1lBspZxXW5dyDv_vYPQDUYIpXo6hN22tL?usp=sharing"
      )
      .replace("{{year}}", new Date().getFullYear());

    if (paymentDetails.status === "captured") {
      await sendSuccessEmail(paymentDetails, htmlTemplate);
      console.log("Success email sent");
    } else {
      console.log("Payment not captured, no email sent");
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function sendSuccessEmail(payment, htmlContent) {
  const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net", // or smtp.secureserver.net
    port: 465,
    secure: true,
    auth: {
      user: "support@reformsol.com",
      pass: "ShopLegs@8055", // For Gmail, use App Password
    },
  });

  const mailOptions = {
    from: '"REFORMSOL" support@reformsol.com',
    to: payment.email,
    subject: `Thank You for Your Purchase!`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}

// Export app
module.exports = app;
