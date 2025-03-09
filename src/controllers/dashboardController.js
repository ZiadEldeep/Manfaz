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
    let revenue = await prisma.order.sum({
      where: {
        status: "completed",
      },
      select: {
        price: true,
      },
    });
    revenue = revenue.price;
    let stores = await prisma.store.count();
    let categories = await prisma.category.count();
    let services = await prisma.service.count();
    let offers = await prisma.offer.count();
    let wallets = await prisma.wallet.count();
    let employees = await prisma.employee.count();

    let message = await translate("Data fetched successfully", { to: lang });

    return res.json({
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
      employees,
      message,
    });
  } catch (error) {
    let message = await translate("Failed to fetch data", { to: lang });
    console.error(error);
    return res
      .status(500)
      .json({
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

    // تحويل البيانات إلى شكل RevenueData
    const revenueData = orders.map((order) => ({
      month: new Date(order.createdAt).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }), // تحويل التاريخ إلى "January 2024"
      revenue: order._sum.price || 0,
    }));
    let message = await translate("Revenue data fetched successfully", {
      to: lang,
    });
    res.json({ data: revenueData, success: true, code: 200, message });
  } catch (error) {
    let message = await translate("Error fetching revenue data", { to: lang });
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: message + " " + error.message,
        code: 500,
        data: [],
      });
  }
}

module.exports = { getDashboardData, getRevenue };
