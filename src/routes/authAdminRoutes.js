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
router.post('/refresh', (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    
    res.json({ message: "CORS headers set!" });
});


module.exports = router;