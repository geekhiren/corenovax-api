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
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      created_at: new Date(payment.created_at * 1000).toLocaleString(),
    };

    console.log("Extracted Payment Details:", paymentDetails);

    let htmlTemplate = require("fs").readFileSync("mailOptions.html", "utf-8");

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
