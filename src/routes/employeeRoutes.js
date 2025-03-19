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
router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);
router.put('/:id/permissions', updateEmployeePermissions);
router.put('/:id/role', updateEmployeeRole);
router.put('/:id/toggle-active', toggleEmployeeActive);

module.exports = router;