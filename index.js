const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Express API on Vercel!');
});

app.post('/webhook', (req, res) => {
  console.log('Webhook Received:', req.body);
  res.status(200).send('Webhook received!');
});

module.exports = app;
