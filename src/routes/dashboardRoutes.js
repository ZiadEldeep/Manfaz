const express = require('express');
const {
  getDashboardData,
  getRevenue,
  getRealTimeAnalytics
} = require('../controllers/dashboardController');
// const  protect  = require('../middleware/authAdminMiddleware'); // Ensure to use your authentication middleware

const router = express.Router();

// Dashboard Routes
router.get('/stats', getDashboardData);
router.get('/revenue', getRevenue);
router.get('/real-time', getRealTimeAnalytics);

module.exports = router;