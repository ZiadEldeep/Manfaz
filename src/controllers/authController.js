const prisma = require('../prismaClient');
const { sendConfirmationEmail } = require('../utils/email');
const { generateVerificationCode } = require('../utils/helpers');

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({
        status: false,
        message: 'Name, password, and either email or phone are required',
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
      return res.status(400).json({
        status: false,
        message: 'Email or phone already in use',
        code: 400,
        data: null,
      });
    }

    const verificationCode = generateVerificationCode();

    const newUser = await prisma.user.create({
      data: { name, email, phone, password, verificationCode },
    });

    if (email) await sendConfirmationEmail(email, verificationCode);

    res.status(201).json({
      status: true,
      message: 'Registration successful. Verification code sent.',
      code: 201,
      data: {
        ...newUser,
      },
    });
  } catch (error) {
    console.error('❌ Error during registration:', error);
    res.status(500).json({
      status: false,
      message: `Internal server error ${error.message}`,
      code: 500,
      data: null,
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: 'Email and password are required',
        code: 400,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password',
        code: 401,
        data: null,
      });
    }

    res.status(200).json({
      status: true,
      message: 'Login successful',
      code: 200,
      data: {
        ...user,
      },
    });
  } catch (error) {
    console.error('❌ Error during login:', error);
    res.status(500).json({
      status: false,
      message: `Internal server error ${error.message}`,
      code: 500,
      data: null,
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: 'Old password and new password are required',
        code: 400,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.password !== oldPassword) {
      return res.status(400).json({
        status: false,
        message: 'Invalid old password',
        code: 400,
        data: user,
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    res.status(200).json({
      status: true,
      message: 'Password updated successfully',
      code: 200,
      data: null,
    });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error ' + error.message,
      code: 500,
      data: null,
    });
  }
};

module.exports = { register, login, changePassword };
