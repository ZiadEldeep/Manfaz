const express = require('express');
const protect = require('../middleware/authAdminMiddleware');
const {
  getAllActivities,
  getActivitiesByEmployee,
  getAuditLogs,
  createActivityLog,
  getSecurityAlerts
} = require('../controllers/employeeActivitiesController');

const router = express.Router();

// Employee Activities Routes
router.get('/', protect, getAllActivities);
router.get('/employees/:employeeId', protect, getActivitiesByEmployee);
router.get('/audit-logs', protect, getAuditLogs);
router.post('/log', protect, createActivityLog);
router.get('/security-alerts', protect, getSecurityAlerts);

module.exports = router;