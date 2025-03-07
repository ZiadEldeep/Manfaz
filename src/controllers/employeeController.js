const prisma = require('../prismaClient'); // Ensure you have the Prisma client set up
const { validationResult } = require('express-validator'); // For input validation
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For token management
const logger = require('../logger'); // Assuming you have a logger setup

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Ensure to set this in your environment variables

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json({ success: true, data: employees });
  } catch (error) {
    logger.error('Error fetching employees: ', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    logger.error('Error fetching employee by ID: ', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Create a new employee
const createEmployee = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = await prisma.employee.create({
      data: { name, email, phone, password: hashedPassword, role },
    });
    const token = jwt.sign({ id: newEmployee.id, role: newEmployee.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ success: true, data: newEmployee, token });
  } catch (error) {
    logger.error('Error creating employee: ', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Update an existing employee
const updateEmployee = async (req, res) => {
  const { id } = req.params;

  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    logger.error('Error updating employee: ', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Delete an employee
const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.employee.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting employee: ', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Update employee permissions
const updateEmployeePermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  try {
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { permissions },
    });
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    logger.error('Error updating employee permissions: ', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Update employee role
const updateEmployeeRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { role },
    });
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    logger.error('Error updating employee role: ', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Toggle employee active status
const toggleEmployeeActive = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { isActive: !employee.isActive },
    });
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    logger.error('Error toggling employee active status: ', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeePermissions,
  updateEmployeeRole,
  toggleEmployeeActive,
};