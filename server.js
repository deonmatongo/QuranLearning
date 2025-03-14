const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:8080', // Client’s local URL
}));

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Transporter verification failed:', error);
  } else {
    console.log('Transporter is ready to send emails');
  }
});

app.post('/api/send-email', async (req, res) => {
  const { firstName, lastName, email, message } = req.body;

  console.log('Received data:', req.body);

  if (!firstName || !lastName || !email || !message) {
    console.warn('Validation failed: Missing fields');
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn('Validation failed: Invalid email format');
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const mailOptions = {
    from: `"${firstName} ${lastName}" <${process.env.EMAIL_USER}>`,
    replyTo: email,
    to: process.env.RECEIVER_EMAIL,
    subject: `Message from ${firstName} ${lastName}`,
    text: `From: ${firstName} ${lastName} <${email}>\n\n${message}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});