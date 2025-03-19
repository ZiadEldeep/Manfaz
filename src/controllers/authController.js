const prisma = require('../prismaClient');
const { sendConfirmationEmail } = require('../utils/email');
const { generateVerificationCode } = require('../utils/helpers');
const translate = require('../translate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Register a new user

const generateAccessToken = (user) => jwt.sign(user, process.env.ACCESS_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (user) => jwt.sign(user, process.env.REFRESH_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  const lang = req.query.lang || 'en';

  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      const message = await translate('name, password, email  phone  role are required', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
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
      return res.status(401).json({
        status: false,
        message,
        code: 401,
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
        role
      },
    });

    if (email) {
      await sendConfirmationEmail(email, verificationCode);
    }

    const message = await translate('Registration successful. Verification code sent.', { to: lang });
    const refreshToken = generateRefreshToken(newUser);
    const token = generateAccessToken(newUser);

    // إرسال إشعار للوحة التحكم عن المستخدم الجديد
    if (req.io) {
      req.io.to('admin').emit('newUser', {
        ...newUser,
        password: ""
      });
    }

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "Strict" });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        ...newUser,
      },
      token,
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
    const { email, password, phone, role, isVerified } = req.body;
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

    const user = await prisma.user.findUnique(
      {
        where: whereCondition,
        include: {
          locations: true,
          Worker: role === 'worker' ? true : false,
        }
      });

    if (!user) {
      const message = await translate('Invalid email or phone or password or role', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }
    const passwordMatch = isVerified ? password === user.password : await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const message = await translate('Invalid email or phone or password or role', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }
    if (!user.isVerified) {
      let verificationCode = generateVerificationCode();
      let user2 = await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode }
      });
      const refreshToken = generateRefreshToken(user2);
      const token = generateAccessToken(user2);
      // await sendConfirmationEmail(user.email, verificationCode);
      const message = await translate('Account not verified', { to: lang });
      res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "Strict" });
      return res.status(200).json({
        status: false,
        message,
        code: 200,
        data: user2,
        token
      });
    }
    const refreshToken = generateRefreshToken(user);
      const token = generateAccessToken(user);

    // إرسال إشعار بتسجيل الدخول
    if (req.io) {
      req.io.to('admin').emit('userLogin', {
        userId: user.id,
        role: user.role,
        timestamp: new Date()
      });
    }

    const message = await translate('Login successful', { to: lang });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "Strict" });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...user,
        password: undefined
      },
      token
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

    // إرسال إشعار بتغيير كلمة المرور
    if (req.io) {
      req.io.to(`user_${userId}`).emit('passwordChanged', {
        timestamp: new Date()
      });
    }

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
    const verificationCode = generateVerificationCode();

    // Update user with new code
    await prisma.user.update({
      where: { id },
      data: { verificationCode }
    });

    // Send verification email
    await sendConfirmationEmail(user.email, verificationCode);

    // إرسال إشعار بإعادة إرسال رمز التحقق
    if (req.io) {
      req.io.to(`user_${id}`).emit('verificationCodeResent', {
        timestamp: new Date()
      });
    }

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
const verifyAccount = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id, verificationCode } = req.body;

    if (!id || !verificationCode) {
      const message = await translate('Id and verification code are required', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
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

    if (+user.verificationCode !== +verificationCode) {
      const message = await translate('Invalid verification code', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null
      });
    }

    let user2 = await prisma.user.update({
      where: { id },
      data: { isVerified: true }
    });

    // إرسال إشعار بتفعيل الحساب
    if (req.io) {
      req.io.to(`user_${id}`).emit('accountVerified', {
        timestamp: new Date()
      });
      req.io.to('admin').emit('userVerified', {
        userId: id,
        timestamp: new Date()
      });
    }

    const message = await translate('Account verified successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...user2,
        password: undefined
      }
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, { to: lang });
    console.error('❌ Error verifying account:', error);
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null
    });
  }
};

// تجديد التوكن
const refresh = async (req, res) => {
  const lang = req.query.lang || 'en';
  const refreshToken = req.cookies.refreshToken;
  let message = await translate("Unauthorized", { to: lang });
  if (!refreshToken) return res.status(401).json({ 
    status: false,
    message,
    code: 401,
    data: null
   });

  let  messageError = await translate("Forbidden", { to: lang });
  let  messageSuccess = await translate("Token refreshed successfully", { to: lang });
  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err){ 
      return res.status(403).json({ 
        status: false,
        message: messageError,
        code: 403,
        data: null
       });
    }

    const newAccessToken = generateAccessToken({ id: user.id, username: user.username });
    res.json({ 
      status: true,
      message: messageSuccess,
      code: 200,
      token: newAccessToken 
    });
  });
};


module.exports = { register, login, changePassword, resendVerificationCode, verifyAccount, refresh };
