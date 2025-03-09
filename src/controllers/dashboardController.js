const prisma = require("../prismaClient");
const translate = require("translate-google");
// async function checkPermissions(employeeId) {
//   try {
//     const employee = await prisma.employee.findUnique({
//       where: {
//         id: employeeId,
//       },
//       include: {
//         permissions: true,
//       },
//       select: {
//         permissions: true,
//       },
//     });

//     if (!employee) {
//       return false;
//     }
//     // let permissionsKey = [
//     //   "viewOrders",
//     //   "updateOrders",
//     //   "deleteOrders",
//     //   "viewCustomers",
//     //   "updateCustomers",

//     //   "viewServices",
//     //   "createServices",
//     //   "updateServices",
//     //   "deleteServices",

//     //   "viewOffers",
//     //   "createOffers",
//     //   "updateOffers",
//     //   "deleteOffers",

//     //   "viewCategories",
//     //   "createCategories",
//     //   "updateCategories",
//     //   "deleteCategories",

//     //   "viewStores",
//     //   "createStores",
//     //   "updateStores",
//     //   "deleteStores",

//     //   "viewProviders",
//     //   "approveProviders",
//     //   "updateProviders",
//     //   "deleteProviders",

//     //   "updateProviders",
//     //   "deleteProviders",

//     //   "viewWallets",
//     //   "manageTransactions",

//     //   "viewBasicReports",
//     //   "viewAdvancedReports",
//     //   "exportReports",

//     //   "viewEmployees",
//     //   "createEmployees",
//     //   "updateEmployees",
//     //   "deleteEmployees",
//     //   "managePermissions",

//     //   "manageSettings",
//     //   "viewAuditLogs",
//     //   "manageBackups",
//     // ];

//     const permissions = employee.permissions.map(
//       (permission) => permission.name
//     );

//     return permissions.includes("admin");
//   } catch (error) {
//     console.error(error);
//     return false;
//   }
// }

const getDashboardData = async (req, res) => {
  const lang = req.query.lang || "en";
  try {
    let users = await prisma.user.count({
      where: {
        role: "user",
      },
    });
    let workers = await prisma.worker.count();
    let drivers = await prisma.deliveryDriver.count();
    let orders = await prisma.order.count();
    let revenue = await prisma.order.aggregate({
      _sum: {
        price: true,
      },
      where: {
        status: "completed",
      },
    });
    revenue = revenue._sum.price || 0;

    let stores = await prisma.store.count();
    let categories = await prisma.category.count();
    let services = await prisma.service.count();
    let offers = await prisma.storeOffer.count();
    let wallets = await prisma.wallet.count();
    let employees = await prisma.employee.count();

    const dashboardData = {
      users,
      workers,
      drivers,
      orders,
      revenue,
      stores,
      categories,
      services,
      offers,
      wallets,
      employees
    };

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('dashboardStatsUpdated', dashboardData);
    }

    let message = await translate("Data fetched successfully", { to: lang });
    return res.json({
      status: true,
      message,
      code: 200,
      data: dashboardData
    });
  } catch (error) {
    let message = await translate("Failed to fetch data", { to: lang });
    console.error(error);
    return res.status(500).json({
      message: message + " " + error.message,
      code: 500,
      data: {},
      status: false,
    });
  }
};

// Function to get the monthly revenue
async function getRevenue(req, res) {
  const lang = req.query.lang || "en";
  try {
    const orders = await prisma.order.groupBy({
      by: ["createdAt"],
      where: { status: "completed" },
      _sum: { price: true },
    });

    const revenueData = orders.map((order) => ({
      month: new Date(order.createdAt).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      revenue: order._sum.price || 0,
    }));

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('revenueUpdated', revenueData);
    }

    let message = await translate("Revenue data fetched successfully", {
      to: lang,
    });
    res.json({
      status: true,
      message,
      code: 200,
      data: revenueData
    });
  } catch (error) {
    let message = await translate("Error fetching revenue data", { to: lang });
    console.error(error);
    res.status(500).json({
      success: false,
      message: message + " " + error.message,
      code: 500,
      data: [],
    });
  }
}

// Function to get real-time analytics
const getRealTimeAnalytics = async (req, res) => {
  const lang = req.query.lang || "en";
  try {
    // Get active users in last 15 minutes
    const activeUsers = await prisma.user.count({
      where: {
        lastActivityAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000)
        }
      }
    });

    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        status: "pending"
      }
    });

    // Get active workers
    const activeWorkers = await prisma.worker.count({
      where: {
        isAvailable: true
      }
    });

    // Get active stores
    const activeStores = await prisma.store.count({
      where: {
        status: "active"
      }
    });

    const realTimeData = {
      activeUsers,
      pendingOrders,
      activeWorkers,
      activeStores,
      timestamp: new Date()
    };

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('realTimeAnalyticsUpdated', realTimeData);
    }

    let message = await translate("Real-time analytics fetched successfully", { to: lang });
    res.json({
      status: true,
      message,
      code: 200,
      data: realTimeData
    });
  } catch (error) {
    let message = await translate("Error fetching real-time analytics", { to: lang });
    console.error(error);
    res.status(500).json({
      status: false,
      message: message + " " + error.message,
      code: 500,
      data: null
    });
  }
};

module.exports = {
  getDashboardData,
  getRevenue,
  getRealTimeAnalytics
};
