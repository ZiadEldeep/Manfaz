const prisma = require('../prismaClient'); // Ensure you have the Prisma client set up

// Get all employee activities
const getAllActivities = async (req, res) => {
  try {
    const activities = await prisma.employeeActivity.findMany(); // Adjust this to your actual model
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
    const activities = await prisma.employeeActivity.findMany({ where: { employeeId } }); // Adjust this to your actual model
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activities by employee ID:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const auditLogs = await prisma.auditLog.findMany(); // Adjust this to your actual model
    res.json({ success: true, data: auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getAllActivities,
  getActivitiesByEmployee,
  getAuditLogs
};