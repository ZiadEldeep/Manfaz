const prisma = require('../prismaClient');
const { sendConfirmationEmail } = require('../utils/email');
const { generateVerificationCode } = require('../utils/helpers');

// تسجيل مستخدم جديد
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ error: 'Name, password, and either email or phone are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email || undefined }, { phone: phone || undefined }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone already in use' });
    }

    const verificationCode = generateVerificationCode();

    const newUser = await prisma.user.create({
      data: { name, email, phone, password, verificationCode },
    });

    if (email) await sendConfirmationEmail(email, verificationCode);

    res.status(201).json({
      message: 'Registration successful. Verification code sent.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone,verificationCode },
    });
  } catch (error) {
    console.error('❌ Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// تسجيل الدخول
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.status(200).json({ message: 'Login successful', user: { ...user, password: undefined } });
  } catch (error) {
    console.error('❌ Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// تغيير كلمة المرور
const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.password !== oldPassword) {
      return res.status(400).json({ error: 'Invalid old password' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, changePassword };
