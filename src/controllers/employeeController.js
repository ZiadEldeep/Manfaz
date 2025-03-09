const prisma = require('../prismaClient'); // Ensure you have the Prisma client set up
const { validationResult } = require('express-validator'); // For input validation
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For token management


// Get all employees
const getAllEmployees = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;
  try {
    const total = await prisma.employee.count();
    const employees = await prisma.employee.findMany({
      where: {
        OR: [ 
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      include: {
        permissions: true,
        activities: true,
      },
      skip: offset,
      take: limit,
    });
    res.json({ success: true, data: {employees,total} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id }, include: {
        activities: true,
        permissions: true,
      }
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'الموظف غير موجود', data: null, code: 404 });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
  }
};

// Delete an employee
const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.employee.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
  }
};

// Update employee permissions
const updateEmployeePermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  let id2=id
  try {
    let {id,...permissions2} = permissions;
    const updatedEmployee = await prisma.employee.update({
      where: { id:id2 },
      data: {
        permissions: {
          update: {
            where: { id },
            data: { ...permissions2 },
          },
        },
      },
    });
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
  }
};

// Toggle employee active status
const toggleEmployeeActive = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'الموظف غير موجود', data: null, code: 404 });
    }
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { isActive: !employee.isActive },
    });
    res.json({ success: true, data: updatedEmployee, code: 200, message: 'تم تحديث حالة الموظف بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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