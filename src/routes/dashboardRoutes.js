
const express = require('express');
const {
  getDashboardData
} = require('../controllers/dashboardController');
const  protect  = require('../middleware/authAdminMiddleware'); // Ensure to use your authentication middleware

const router = express.Router();

// Dashboard Routes
router.get('/stats', protect, getDashboardData);

module.exports = router;