const prisma = require('../prismaClient'); // Ensure you have the Prisma client set up
const { validationResult } = require('express-validator'); // For input validation
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For token management
const { Prisma } = require('@prisma/client');

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

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('employeesUpdated', {
        employees,
        total,
        page,
        limit
      });
    }

    res.json({ success: true, data: {employees,total} });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'خطأ في السيرفر'+error, data: null, code: 500 });
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
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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
      include: {
        permissions: true
      }
    });

    // إرسال إشعار للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('newEmployee', {
        ...newEmployee,
        password: undefined
      });
    }

    const token = jwt.sign({ id: newEmployee.id, role: newEmployee.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ success: true, data: newEmployee, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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
      include: {
        permissions: true,
        activities: true
      }
    });

    // إرسال إشعارات التحديث
    if (req.io) {
      // إشعار للموظف نفسه
      req.io.to(`employee_${id}`).emit('profileUpdated', updatedEmployee);

      // إشعار للوحة التحكم
      req.io.to('admin').emit('employeeUpdated', updatedEmployee);
    }

    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
  }
};

// Delete an employee
const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'الموظف غير موجود', data: null, code: 404 });
    }

    await prisma.employee.delete({ where: { id } });

    // إرسال إشعار للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('employeeDeleted', { id });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
  }
};

// Update employee permissions
const updateEmployeePermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions:{id:id2,...permissions} } = req.body;
  
  try {
    const keys = Object.keys(permissions);
    const BATCH_SIZE = 10; // تحديد حجم الدفعة

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = {};
      const currentBatchKeys = keys.slice(i, i + BATCH_SIZE);
      
      currentBatchKeys.forEach(key => {
        batch[key] = permissions[key]; // إعداد الدفعة للتحديث
      });
    }
      // تنفيذ التحديث للدفعة الحالية
      await prisma.employee.update({
        where: { id: id },
        data: {
          permissions: {
            update: {
              where: { id:id2 }, // هنا يجب التأكد من تحديد الأذونات الصحيحة
              data: { ...batch },
            },
          },
        },
      include: {
        permissions: true
      }
    });

    // إرسال إشعارات التحديث
    if (req.io) {
      // إشعار للموظف
      req.io.to(`employee_${id2}`).emit('permissionsUpdated', {
        permissions: updatedEmployee.permissions
      });

      // إشعار للوحة التحكم
      req.io.to('admin').emit('employeePermissionsUpdated', {
        employeeId: id2,
        permissions: updatedEmployee.permissions
      });
    }

    res.json({ success: true, message: 'تم تحديث الأذونات بنجاح' ,data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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
      include: {
        permissions: true
      }
    });

    // إرسال إشعارات التحديث
    if (req.io) {
      // إشعار للموظف
      req.io.to(`employee_${id}`).emit('roleUpdated', {
        role: updatedEmployee.role
      });

      // إشعار للوحة التحكم
      req.io.to('admin').emit('employeeRoleUpdated', {
        employeeId: id,
        role: updatedEmployee.role
      });
    }

    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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
      include: {
        permissions: true
      }
    });

    // إرسال إشعارات التحديث
    if (req.io) {
      // إشعار للموظف
      req.io.to(`employee_${id}`).emit('activeStatusChanged', {
        isActive: updatedEmployee.isActive
      });

      // إشعار للوحة التحكم
      req.io.to('admin').emit('employeeStatusChanged', {
        employeeId: id,
        isActive: updatedEmployee.isActive
      });
    }

    res.json({ success: true, data: updatedEmployee, code: 200, message: 'تم تحديث حالة الموظف بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', data: null, code: 500 });
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