const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Ensure to use your authentication middleware
const {
  getAllActivities,
  getActivitiesByEmployee,
  getAuditLogs
} = require('../controllers/employeeActivitiesController'); // Create this controller

const router = express.Router();

// Employee Activities Routes
router.get('/', protect, getAllActivities); // Get all activities
router.get('/employees/:employeeId', protect, getActivitiesByEmployee); // Get activities by employee ID
router.get('/audit-logs', protect, getAuditLogs); // Get audit logs

module.exports = router;