require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const app = express();
app.use(express.json());
const path = require('path');
const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const generateVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000);
};
const sendConfirmationEmail = async (email, verificationCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Aber - Email Verification',
      text: `Hi there,
      
      Thank you for joining Aber! 🎉
      
      We are excited to have you with us. To complete your registration and verify your email address, please use the following verification code:
      
      🔑 Verification Code: ${verificationCode}
      
Simply copy and paste the code into the verification form to activate your account.

If you didn’t sign up for Aber, please disregard this email.

We’re here to help if you need any assistance. Feel free to reach out to our support team.

Warm regards,  
The Aber Team  
🚀 Your journey starts here!`,
};
require('dotenv').config();
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};
// <-----------user------->
app.post('/register', async (req, res) => {
  try {
      const { name, email, phone, password } = req.body;

      console.log("✅ Received registration request");

      // Validate input
      if (!name?.trim() || (!email?.trim() && !phone?.trim()) || !password?.trim()) {
          console.log("❌ Validation failed");
          return res.status(400).json({ error: 'Name, password, and either email or phone are required' });
      }

      console.log("🔍 Checking if user already exists...");
      const existingUser = await prisma.user.findFirst({
          where: {
              OR: [
                  { email: email?.trim() || undefined },
                  { phone: phone?.trim() || undefined }
              ],
          },
      });

      if (existingUser) {
          console.log("❌ Email or phone already in use");
          return res.status(400).json({ error: 'Email or phone already in use' });
      }

      console.log("🔢 Generating verification code...");
      const verificationCode = generateVerificationCode();

      console.log("📝 Creating user in database...");
      const newUser = await prisma.user.create({
          data: {
              name: name.trim(),
              email: email?.trim() || null,
              phone: phone?.trim() || null,
              password,
              verificationCode,
          },
      });

      // Send verification via email or SMS
      if (email?.trim()) {
          console.log("📧 Sending verification email...");
          await sendConfirmationEmail(email, verificationCode);
      } else if (phone?.trim()) {
          console.log("📱 Sending verification SMS...");
          await sendConfirmationSMS(phone, verificationCode);
      }

      console.log("✅ User registered successfully!");
      res.status(201).json({
          message: `Registration successful. A verification code has been sent.`,
          user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone,
          },
      });

  } catch (error) {
      console.error("❌ ERROR in /register:", error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/change-password', async (req, res) => {
  const { userId } = req.body;
  const { oldPassword, newPassword } = req.body;

  console.log("✅ Received change password request for user:", userId);

  // Validate input
  if (!oldPassword?.trim() || !newPassword?.trim()) {
    console.log("❌ Validation failed");
    return res.status(400).json({ error: 'Old password and new password are required' });
  }

  try {
    // Check if the user exists
    console.log("🔍 Checking if user exists...");
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the old password
    console.log("🔐 Verifying old password...");
    if (user.password !== oldPassword) {
      console.log("❌ Old password is incorrect");
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    // Update the password
    console.log("🔑 Updating password...");
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword.trim() },
    });

    console.log("✅ Password updated successfully!");
    res.status(200).json({
      message: 'Password updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });

  } catch (error) {
    console.error("❌ ERROR in /change-password:", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
  
    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Compare the entered password with the stored password (plaintext in this case)
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid password' });
      }
  
      // Respond with the user data (exclude password)
      const userResponse = { ...user, password: undefined };
  
      res.status(200).json({
        message: 'Login successful',
        user: userResponse,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});