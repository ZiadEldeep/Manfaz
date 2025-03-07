const { prisma } = require("../prismaClient");

async function checkPermissions(employeeId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      include: {
        permissions: true,
      },
      select: {
        permissions: true,
      },
    });

    if (!employee) {
      return false;
    }
    // let permissionsKey = [
    //   "viewOrders",
    //   "updateOrders",
    //   "deleteOrders",
    //   "viewCustomers",
    //   "updateCustomers",

    //   "viewServices",
    //   "createServices",
    //   "updateServices",
    //   "deleteServices",

    //   "viewOffers",
    //   "createOffers",
    //   "updateOffers",
    //   "deleteOffers",

    //   "viewCategories",
    //   "createCategories",
    //   "updateCategories",
    //   "deleteCategories",

    //   "viewStores",
    //   "createStores",
    //   "updateStores",
    //   "deleteStores",

    //   "viewProviders",
    //   "approveProviders",
    //   "updateProviders",
    //   "deleteProviders",

    //   "updateProviders",
    //   "deleteProviders",

    //   "viewWallets",
    //   "manageTransactions",

    //   "viewBasicReports",
    //   "viewAdvancedReports",
    //   "exportReports",

    //   "viewEmployees",
    //   "createEmployees",
    //   "updateEmployees",
    //   "deleteEmployees",
    //   "managePermissions",

    //   "manageSettings",
    //   "viewAuditLogs",
    //   "manageBackups",
    // ];

    const permissions = employee.permissions.map(
      (permission) => permission.name
    );

    return permissions.includes("admin");
  } catch (error) {
    console.error(error);
    return false;
  }
}

const getDashboardData = async (req, res) => {
  // Check permissions for the employee
  const employeeId = req.user.id; // Assuming user ID is stored in req.user
  const hasPermission = await checkPermissions(employeeId); // Implement this function to check permissions

  if (!hasPermission) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const stats = await getDashboardStats();

  const {
    users = 0,
    workers = 0,
    drivers = 0,
    orders = 0,
    revenue = 0,
  } = stats;

  return res.json({ users, workers, drivers, orders, revenue });
};

// Function to check permissions (dummy implementation)

module.exports = { getDashboardData };
