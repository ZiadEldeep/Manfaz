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
router.post('/register', register);
router.post('/login', login);
router.post('/change-password', changePassword);
router.post('/resend-verification', resendVerificationCode);
router.post('/verify', verifyAccount);
router.post('/refresh', refresh);

module.exports = router;
