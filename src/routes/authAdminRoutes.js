const express = require('express');
const { 
  register, 
  login, 
  changePassword, 
  resendVerificationCode, 
  verifyAccount, 
  refresh 
} = require('../controllers/authAdminController'); // Create this controller

const router = express.Router();

// Admin Auth Routes
router.post('/register', register);
router.post('/login', login);
router.post('/change-password', changePassword);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/verify-account', verifyAccount);
router.post('/refresh', refresh);

module.exports = router;