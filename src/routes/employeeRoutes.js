const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeePermissions,
  updateEmployeeRole,
  toggleEmployeeActive
} = require('../controllers/employeeController'); // Ensure you have this controller

const router = express.Router();

// Employee Routes
router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);
router.put('/:id/permissions', updateEmployeePermissions);
router.put('/:id/role', updateEmployeeRole);
router.put('/:id/toggle-active', toggleEmployeeActive);

module.exports = router;