const express = require('express');
const {
  register,
  login,
  changePassword,
  resendVerificationCode,
  verifyAccount,
  refresh
} = require('../controllers/authController');

const router = express.Router();

// مسارات المصادقة
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: تسجيل مستخدم جديد
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم التسجيل بنجاح
 *       400:
 *         description: خطأ في البيانات
 */
router.post('/register', register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: تسجيل الدخول
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               password:
 *                 type: string
 *                 example: "yourPassword123"
 *               fcmToken:
 *                 type: string
 *                 example: "firebase_token_here"
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح
 *       400:
 *         description: بيانات غير صحيحة
 *       404:
 *         description: المستخدم غير موجود
 */

router.post('/login', login);
/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: تغيير كلمة المرور
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, password]
 *             properties:
 *               id:
 *                 type: string
 *                 example: "64f9c9a8897c6f3a8d56a2b0"
 *               password:
 *                 type: string
 *                 example: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: تم تغيير كلمة المرور بنجاح
 *       400:
 *         description: خطأ في البيانات
 *       404:
 *         description: المستخدم غير موجود
 */

router.post('/change-password', changePassword);
/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: إعادة إرسال كود التحقق
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *                 example: "64f9c9a8897c6f3a8d56a2b0"
 *     responses:
 *       200:
 *         description: تم إرسال كود التحقق مرة أخرى
 *       404:
 *         description: المستخدم غير موجود
 */

router.post('/resend-verification', resendVerificationCode);
/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: التحقق من الحساب
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, verificationCode]
 *             properties:
 *               id:
 *                 type: string
 *                 example: "64f9c9a8897c6f3a8d56a2b0"
 *               verificationCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: تم التحقق من الحساب بنجاح
 *       400:
 *         description: رمز التحقق غير صحيح
 *       404:
 *         description: المستخدم غير موجود
 */

router.post('/verify', verifyAccount);
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: تسجيل حساب جديد
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - password
 *               - confirmPassword
 *               - type
 *               - governorate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "محمد أحمد"
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               password:
 *                 type: string
 *                 example: "yourPassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "yourPassword123"
 *               type:
 *                 type: string
 *                 enum: [student, teacher, supervisor]
 *                 example: "student"
 *               governorate:
 *                 type: string
 *                 example: "القاهرة"
 *               nationalId:
 *                 type: string
 *                 example: "29810150123456"
 *     responses:
 *       201:
 *         description: تم إنشاء الحساب بنجاح
 *       400:
 *         description: هناك خطأ في البيانات المُدخلة
 */

router.post('/refresh', refresh);

module.exports = router;
