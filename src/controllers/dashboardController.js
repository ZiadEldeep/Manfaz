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
//   const hasPermission = await checkPermissions(employeeId); // Implement this function to check permissions

//   if (!hasPermission) {
//     return res.status(403).json({ message: "Forbidden" });
//   }
  let users=await prisma.user.count({
    where: {
      role: "user",
    },
  });
  let workers=await prisma.worker.count();
  let drivers=await prisma.deliveryDriver.count();
  let orders=await prisma.order.count();
  let revenue=await prisma.order.sum({
    where: {
      status: "completed",
    },
    select: {
      price: true,
    },
  });
  revenue=revenue.price;
  let stores=await prisma.store.count();
  let categories=await prisma.category.count();
  let services=await prisma.service.count();
  let offers=await prisma.offer.count();
  let wallets=await prisma.wallet.count();
  let employees=await prisma.employee.count();

  return res.json({ users, workers, drivers, orders, revenue, stores, categories, services, offers, wallets, employees });
};

// Function to check permissions (dummy implementation)

module.exports = { getDashboardData };
