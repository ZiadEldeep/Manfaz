const express = require('express');
const  protect  = require('../middleware/authAdminMiddleware'); // Ensure to use your authentication middleware
const {
  getAllActivities,
  getActivitiesByEmployee,
  getAuditLogs
} = require('../controllers/employeeActivitiesController'); // Ensure this controller is created

const router = express.Router();

// Employee Activities Routes
router.get('/', protect, getAllActivities); // Get all activities
router.get('/employees/:employeeId', protect, getActivitiesByEmployee); // Get activities by employee ID
router.get('/audit-logs', protect, getAuditLogs); // Get audit logs

module.exports = router;