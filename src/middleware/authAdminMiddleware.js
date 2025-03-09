const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const translate = require('translate-google');

const protect = async (req, res, next) => {
  const lang = req.query.lang || 'en';
  try {
    let token;

    // التحقق من وجود التوكن في الهيدر
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // التحقق من وجود التوكن في الكوكيز
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      const message = await translate('Not authorized, no token', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null
      });
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // التحقق من وجود المستخدم وأنه مسؤول
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.id },
      include: {
        permissions: true
      }
    });

    if (!employee || employee.role !== 'admin') {
      const message = await translate('Not authorized as admin', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null
      });
    }

    // التحقق من أن الموظف نشط
    if (!employee.isActive) {
      const message = await translate('Account is inactive', { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null
      });
    }

    // إضافة معلومات الموظف إلى الطلب
    req.employee = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      permissions: employee.permissions
    };

    // تسجيل نشاط الدخول
    if (req.io) {
      req.io.to('admin').emit('adminActivity', {
        employeeId: employee.id,
        action: 'ACCESS',
        details: `Accessed ${req.method} ${req.originalUrl}`,
        timestamp: new Date()
      });
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    const message = await translate('Not authorized, token failed', { to: lang });
    res.status(401).json({
      status: false,
      message,
      code: 401,
      data: null
    });
  }
};

module.exports = protect;