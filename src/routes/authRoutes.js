const express = require('express');
const { register, login, changePassword, resendVerificationCode, verifyAccount } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', changePassword);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/verify-account', verifyAccount);
module.exports = router;
