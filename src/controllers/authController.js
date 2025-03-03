const prisma = require('../prismaClient');
const { sendConfirmationEmail } = require('../utils/email');
const { generateVerificationCode } = require('../utils/helpers');
const translate = require('translate-google');
// Register a new user
const register = async (req, res) => {
  const lang = req.query.lang || 'en';

  try {
    const { name, email, phone, password ,role} = req.body;

    if (!name || (!email && !phone) || !password || !role) {
      const message=(await translate('Name, password, and either email or phone are required', { to: lang }));
      return res.status(400).json({
        status: false,
        message: message,
        code: 400,
        data: null,
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email || undefined }, { phone: phone || undefined }],
      },
    });

    if (existingUser) {
      const message=(await translate('Email or phone already in use', { to: lang }));
      return res.status(400).json({
        status: false,
        message: message,
        code: 400,
        data: null,
      });
    }

    const verificationCode = generateVerificationCode();

    const newUser = await prisma.user.create({
      data: { name, email, phone, password, verificationCode,role },
    });

    if (email) await sendConfirmationEmail(email, verificationCode);
    let message=(await translate('Registration successful. Verification code sent.', { to: lang }));
    res.status(201).json({
      status: true,
      message: message,
      code: 201,
      data: {
        ...newUser,
      },
    });
  } catch (error) {
    let message=(await translate(`Internal server error ${error.message}`, { to: lang }));
    console.error('❌ Error during registration:', error);
    res.status(500).json({
      status: false,
      message: message,
      code: 500,
      data: null,
    });
  }
};

// Login
const login = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const message=(await translate('Email and password are required', { to: lang }));
      return res.status(400).json({
        status: false,
        message: message,
        code: 400,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      const message=(await translate('Invalid email or password', { to: lang }));
      return res.status(401).json({
        status: false,
        message: message,
        code: 401,
        data: null,
      });
    }
let message=(await translate('Login successful', { to: lang }));
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: {
        ...user,
      },
    });
  } catch (error) {
    let message=(await translate(`Internal server error ${error.message}`, { to: lang }));
    console.error('❌ Error during login:', error);
    res.status(500).json({
      status: false,
      message: message,
      code: 500,
      data: null,
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      const message=(await translate('Old password and new password are required', { to: lang }));
      return res.status(400).json({
        status: false,
        message: message,
        code: 400,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.password !== oldPassword) {
      const message=(await translate('Invalid old password', { to: lang }));
      return res.status(400).json({
        status: false,
        message: message,
        code: 400,
        data: user,
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    let message=(await translate('Password updated successfully', { to: lang }));
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: null,
    });
  } catch (error) {
    let message=(await translate(`Internal server error ${error.message}`, { to: lang }));
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      status: false,
      message: message,
      code: 500,
      data: null,
    });
  }
};

module.exports = { register, login, changePassword };
