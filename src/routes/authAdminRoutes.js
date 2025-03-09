const express = require('express');
const { 
  register, 
  login, 
  changePassword, 
  resendVerificationCode, 
  verifyAccount, 
  refresh 
} = require('../controllers/authAdminController'); // Create this controller

const  protect  = require('../middleware/authAdminMiddleware'); // Ensure to use your authentication middleware

const router = express.Router();

// Admin Auth Routes
router.post('/register', register);
router.post('/login', login);
router.post('/change-password', protect, changePassword);
router.post('/resend-verification-code', protect, resendVerificationCode);
router.post('/verify-account', protect,verifyAccount);
router.post('/refresh', refresh);

module.exports = router;