const prisma = require('../prismaClient'); // Ensure you have the Prisma client set up

// Get all employee activities
const getAllActivities = async (req, res) => {
  try {
    const activities = await prisma.employeeActivity.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('activitiesUpdated', activities);
    }

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get activities by employee ID
const getActivitiesByEmployee = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const activities = await prisma.employeeActivity.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // إرسال تحديث للموظف
    if (req.io) {
      req.io.to(`employee_${employeeId}`).emit('personalActivitiesUpdated', activities);
    }

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activities by employee ID:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const auditLogs = await prisma.employeeActivity.findMany({
      where: {
        action: {
          in: ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PERMISSION_CHANGE']
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('auditLogsUpdated', auditLogs);
    }

    res.json({ success: true, data: auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Create activity log
const createActivityLog = async (req, res) => {
  const { employeeId, action, details, oldData, newData, ipAddress } = req.body;
  try {
    const activity = await prisma.employeeActivity.create({
      data: {
        employeeId,
        action,
        details,
        oldData,
        newData,
        ipAddress
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // إرسال إشعارات النشاط
    if (req.io) {
      // إشعار للموظف
      req.io.to(`employee_${employeeId}`).emit('newActivity', activity);

      // إشعار للوحة التحكم
      req.io.to('admin').emit('newEmployeeActivity', activity);

      // إذا كان النشاط يتعلق بالأمان، أرسل إشعارًا للمسؤولين
      if (['LOGIN_FAILED', 'PASSWORD_CHANGE', 'PERMISSION_CHANGE'].includes(action)) {
        req.io.to('admin').emit('securityAlert', {
          type: action,
          employeeId,
          details,
          timestamp: new Date()
        });
      }
    }

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get security alerts
const getSecurityAlerts = async (req, res) => {
  try {
    const alerts = await prisma.employeeActivity.findMany({
      where: {
        action: {
          in: ['LOGIN_FAILED', 'PASSWORD_CHANGE', 'PERMISSION_CHANGE', 'ROLE_CHANGE']
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Get last 100 security alerts
    });

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('securityAlertsUpdated', alerts);
    }

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getAllActivities,
  getActivitiesByEmployee,
  getAuditLogs,
  createActivityLog,
  getSecurityAlerts
};