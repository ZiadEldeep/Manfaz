const prisma = require('../prismaClient');
const { sendConfirmationEmail } = require('../utils/email');
const { generateVerificationCode } = require('../utils/helpers');
const translate = require('translate-google');
const bcrypt = require('bcrypt');
// Register a new user
const register = async (req, res) => {
  const lang = req.query.lang || 'en';

  try {
    const { name, email, phone, password, role ,token} = req.body;

    if (!name || !email || !phone || !password || !role) {
      const message = await translate('Name, password, email  phone  role are required', { to: lang });
      return res.status(400).json({
        status: false,
        message,
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
      const message = await translate('Email or phone already in use', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    const verificationCode = generateVerificationCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { 
        name, 
        email, 
        phone, 
        password: hashedPassword,
        verificationCode,
        token,
        role 
      },
    });

    if (email) {
      await sendConfirmationEmail(email, verificationCode);
    }

    const message = await translate('Registration successful. Verification code sent.', { to: lang });

    if (lang === 'en') {
      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: newUser,
      });
      return;
    }


    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        ...newUser,
      },
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, { to: lang });
    console.error('❌ Error during registration:', error);
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};

// Login
const login = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    // التحقق من وجود إما البريد الإلكتروني أو رقم الهاتف
    const { email, password, phone,role,token } = req.body;
    let whereCondition;
    if (email) {
      whereCondition = { email };
    } else if (phone) {
      whereCondition = { phone };
    }

    // إضافة الدور إلى شروط البحث
    whereCondition.role = role;

    if ((!email && !phone) || !password || !role) {
      const message = await translate('Email or phone and password and role are required', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({ where: whereCondition });

    if (!user) {
      const message = await translate('Invalid email or phone or password or role', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const message = await translate('Invalid email or phone or password or role', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }
    const message = await translate('Login successful', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: user,
      });
      return;
    }


    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...user,
      },
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, { to: lang });
    console.error('❌ Error during login:', error);
    res.status(500).json({
      status: false,
      message,
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
      const message = await translate('Old password and new password are required', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.password !== oldPassword) {
      const message = await translate('Invalid old password', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    const message = await translate('Password updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null,
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, { to: lang });
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};
const resendVerificationCode = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.body;

    if (!id) {
      const message = await translate('Id is required', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      const message = await translate('User not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null
      });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Update user with new code
    await prisma.user.update({
      where: { id },
      data: { verificationCode }
    });

    // Send verification email
    await sendConfirmationEmail(user.email, verificationCode);

    const message = await translate('Verification code resent successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null
    });

  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, { to: lang });
    console.error('❌ Error resending verification code:', error);
    res.status(500).json({
      status: false, 
      message,
      code: 500,
      data: null
    });
  }
};

module.exports = { register, login, changePassword, resendVerificationCode };
