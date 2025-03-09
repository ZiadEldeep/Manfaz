
const express = require('express');
const {
  getDashboardData,
  getRevenue
} = require('../controllers/dashboardController');
const  protect  = require('../middleware/authAdminMiddleware'); // Ensure to use your authentication middleware

const router = express.Router();

// Dashboard Routes
router.get('/stats', getDashboardData);
router.get('/revenue', getRevenue);

module.exports = router;