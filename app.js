// server.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();  // Load environment variables from .env

// Initialize Prisma Client and Express
const prisma = new PrismaClient();
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Nodemailer setup for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password (or app password for Gmail 2FA)
  },
});

// Helper function to send verification email
const sendVerificationEmail = async (email, code) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender's email
      to: email, // Receiver's email
      subject: 'Email Verification',
      text: `Please use the following code to verify your email: ${code}`,
    });
    console.log('Verification email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Registration endpoint
app.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if the email or phone number is already registered
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { phone },
      ],
    },
  });
  if (existingUser) {
    return res.status(400).json({ error: 'Email or Phone number already exists' });
  }

  // Generate a random 6-digit verification code
  const verificationCode = crypto.randomInt(100000, 999999).toString();

  try {
    // Create a new user in the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password, // Store the password as plain text
        verificationCode,  // Store the verification code temporarily
      },
    });

    // Send the verification code to the user's email
    await sendVerificationEmail(email, verificationCode);

    // Respond with a success message (don't send the verification code back to the client)
    res.status(201).json({
      message: 'User registered successfully! Please check your email for the verification code.',
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Email verification endpoint
app.post('/verify-email', async (req, res) => {
  const { email, verificationCode } = req.body;

  // Validate required fields
  if (!email || !verificationCode) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  // Find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if the verification code matches
  if (user.verificationCode === verificationCode) {
    // Update user to mark the email as verified
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationCode: null,  // Clear the verification code after success
      },
    });

    res.status(200).json({ message: 'Email verified successfully!' });
  } else {
    res.status(400).json({ error: 'Invalid verification code' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is healthy!' });
});

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
