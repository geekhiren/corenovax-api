const express = require("express");
const nodemailer = require("nodemailer");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Express API is live 🚀");
});

app.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    // Check event type
    if (payload.event !== "payment.captured") {
      return res.status(400).send("Not a payment captured event.");
    }

    const payment = payload.payload.payment.entity;

    // Extract important fields safely
    const paymentDetails = {
      payment_id: payment.id,
      order_id: payment.order_id || "N/A",
      amount: payment.amount / 100, // Convert paise to INR
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email || "no-email@example.com",
      contact: payment.contact || "N/A",
      created_at: new Date(payment.created_at * 1000).toLocaleString(), // Unix to readable
      bank:
        payment.bank ||
        payment.card?.network ||
        payment.wallet ||
        payment.vpa ||
        "N/A",
    };

    console.log("Extracted Payment Details:", paymentDetails);

    let htmlTemplate = require("fs").readFileSync("mailOptions.html", "utf-8");

    // Replace placeholders
    htmlTemplate = htmlTemplate
      .replace("{{order_id}}", orderId)
      .replace("{{amount}}", amount)
      .replace("{{currency}}", currency)
      .replace("{{payment_date}}", paymentDate)
      .replace("{{payment_method}}", method)
      .replace("{{ebook_link}}", ebookLink)
      .replace("{{year}}", new Date().getFullYear());

    // Send email only if captured
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
    service: "gmail", // Or any other SMTP (Outlook, Zoho, etc.)
    auth: {
      user: "reformcontrol@gmail.com",
      pass: "ckgfbpshbtpmbfoa", // For Gmail, use App Password
    },
  });

  const mailOptions = {
    from: '"Reformsol" reformcontrol@gmail.com',
    to: payment.email,
    subject: `Payment Successful - ₹${(payment.amount / 100).toFixed(2)}`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}

// Export app
module.exports = app;
