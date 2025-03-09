const express = require('express');
const protect = require('../middleware/authAdminMiddleware');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeePermissions,
  updateEmployeeRole,
  toggleEmployeeActive
} = require('../controllers/employeeController');

const router = express.Router();

// موجه الموظفين
router.get('/', protect, getAllEmployees);
router.get('/:id', protect, getEmployeeById);
router.post('/', protect, createEmployee);
router.put('/:id', protect, updateEmployee);
router.delete('/:id', protect, deleteEmployee);
router.put('/:id/permissions', protect, updateEmployeePermissions);
router.put('/:id/role', protect, updateEmployeeRole);
router.put('/:id/toggle-active', protect, toggleEmployeeActive);

module.exports = router;