const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const translate = require('translate-google');

// Get All Orders
const getAllOrders = async (req, res) => {
  const lang = req.query.lang || 'en';
  const { userId, role, limit = 10, page = 1, search, status, paymentStatus } = req.query;
  const skip = (page - 1) * limit;
  try {
    let searchTranslated = search ? await translate(search, { to: lang }) : undefined;
    let searchCondition = {};
    if (searchTranslated) {
      searchCondition = {
        OR: [
          { location: { address: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } } },
          { store: { products: { some: { product: { name: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } } } } } }
        ]
      };
    }
    let statusCondition = {};
    if (status) {
      statusCondition = { status: status };
    }
    let paymentStatusCondition = {};
    if (paymentStatus) {
      paymentStatusCondition = { paymentStatus: paymentStatus };
    }
    const whereCondition =
      role === 'user' ? { userId } : role === 'worker' ? { providerId: userId } : { deliveryDriverId: userId }

    const orders = await prisma.order.findMany({
      where: { ...whereCondition, ...searchCondition, ...statusCondition, ...paymentStatusCondition },
      include: {
        service: true,
        provider: true,
        deliveryDriver: true,
        store: true,
        user: true,
        location: true
      },
      skip,
      take: +limit
    });

    const message = await translate('Orders retrieved successfully', { to: lang });

    const totalOrders = await prisma.order.count({ 
      where: { ...whereCondition, ...searchCondition, ...statusCondition, ...paymentStatusCondition } 
    });
    const totalPages = Math.ceil(totalOrders / limit);

    // إرسال التحديث عبر Socket.IO
    if (req.io) {
      req.io.to('admin').emit('ordersUpdated', {
        orders,
        totalOrders,
        totalPages,
        currentPage: page
      });
    }

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        orders,
        totalOrders,
        totalPages,
        currentPage: page
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Create Order
const createOrder = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const {
      userId,
      serviceId,
      providerId,
      deliveryDriverId,
      totalAmount,
      type,
      notes,
      imageUrl,
      locationId,
      price,
      duration,
      paymentMethod,
      store,
      ...createOrderData
    } = req.body;

    const service = type === "service" ? await prisma.serviceParameter.findUnique({
      where: { id: serviceId },
    }) : null;

    if (!service && type === "service") {
      const message = await translate('Service not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "user" },
    });
    if (!user) {
      const message = await translate('User not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    const location = await prisma.userLocation.findUnique({
      where: { id: locationId }
    });
    if (!location) {
      const message = await translate('User Location not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    let newOrder;
    if (type === "service") {
      if (!userId || !serviceId || !providerId || !totalAmount || !price || !paymentMethod) {
        const message = await translate('All fields are required', { to: lang });
        return res.status(400).json({ status: false, message, code: 400, data: null });
      }
      const provider = await prisma.worker.findUnique({
        where: { id: providerId },
      });
      if (!provider) {
        const message = await translate('Worker not found', { to: lang });
        return res.status(404).json({ status: false, message, code: 404, data: null });
      }

      const [notesTranslated] = await Promise.all([
        translate(notes, { to: "en" })
      ]);

      newOrder = await prisma.order.create({
        data: {
          user: {
            connect: { id: user.id }
          },
          serviceId,
          providerId,
          totalAmount,
          notes: notesTranslated,
          imageUrl,
          location: {
            connect: { id: location.id }
          },
          price,
          duration,
          ...createOrderData,
          paymentMethod
        },
        include: {
          user: true,
          service: true,
          provider: true,
          location: true
        }
      });

      // إرسال إشعار للعامل عبر Socket.IO
      if (req.io) {
        req.io.to(`worker_${providerId}`).emit('newOrder', {
          type: 'service',
          order: newOrder
        });
      }
    } else if (type === "delivery") {
      if (!userId || !totalAmount || !price || !paymentMethod) {
        const message = await translate('All fields are required', { to: lang });
        return res.status(400).json({ status: false, message, code: 400, data: null });
      }

      const [notesTranslated] = await Promise.all([
        translate(notes, { to: "en" })
      ]);

      newOrder = await prisma.order.create({
        data: {
          user: {
            connect: { id: user.id }
          },
          totalAmount,
          notes: notesTranslated,
          imageUrl,
          location: {
            connect: { id: location.id }
          },
          price,
          duration,
          ...createOrderData,
          paymentMethod,
          store: {
            create: store.map((store) => ({
              storeId: store.storeId,
              products: {
                create: store.products.map((product) => ({
                  productId: product.productId,
                  quantity: product.quantity
                }))
              }
            }))
          }
        },
        include: {
          user: true,
          store: {
            include: {
              store: true,
              products: {
                include: {
                  product: true
                }
              }
            }
          },
          location: true
        }
      });

      // إرسال إشعار للمتاجر عبر Socket.IO
      if (req.io) {
        store.forEach(storeItem => {
          req.io.to(`store_${storeItem.storeId}`).emit('newOrder', {
            type: 'delivery',
            order: newOrder
          });
        });
      }
    }

    const message = await translate('Order created successfully', { to: lang });

    // إرسال إشعار للمستخدم وللوحة التحكم
    if (req.io) {
      req.io.to(`user_${userId}`).emit('orderCreated', newOrder);
      req.io.to('admin').emit('newOrder', newOrder);
    }

    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: newOrder
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Get Order By ID
const getOrderById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        service: true,
        provider: true,
        store: true,
        location: true
      }
    });

    if (!order) {
      const message = await translate('Order not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const message = await translate('Order found', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: order
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Order
const updateOrder = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const {
      status,
      totalAmount,
      paymentStatus,
      price,
      duration,
      updatedBy
    } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      const message = await translate('Order not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        totalAmount: totalAmount || order.totalAmount,
        paymentStatus,
        price: price || order.price,
        duration: duration || order.duration
      },
      include: {
        user: true,
        provider: true,
        store: true
      }
    });

    // إرسال إشعارات عبر Socket.IO
    if (req.io) {
      if (updatedBy === 'worker') {
        req.io.to(`user_${order.userId}`).emit('orderUpdated', updatedOrder);
      } else if (updatedBy === 'user') {
        if (order.providerId) {
          req.io.to(`worker_${order.providerId}`).emit('orderUpdated', updatedOrder);
        }
        order.store?.forEach(store => {
          req.io.to(`store_${store.id}`).emit('orderUpdated', updatedOrder);
        });
      }
      req.io.to('admin').emit('orderUpdated', updatedOrder);
    }

    const message = await translate('Order updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedOrder
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Delete Order
const deleteOrder = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        provider: true,
        store: true
      }
    });

    if (!order) {
      const message = await translate('Order not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    await prisma.order.delete({
      where: { id },
    });

    // إرسال إشعارات عبر Socket.IO
    if (req.io) {
      req.io.to(`user_${order.userId}`).emit('orderDeleted', { id });
      if (order.providerId) {
        req.io.to(`worker_${order.providerId}`).emit('orderDeleted', { id });
      }
      order.store?.forEach(store => {
        req.io.to(`store_${store.id}`).emit('orderDeleted', { id });
      });
      req.io.to('admin').emit('orderDeleted', { id });
    }

    const message = await translate('Order deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
};
// عايز اعمل prompt علشان اعدل بيه في كود backend معمول ب node js , prisma انا عايز احول الapis و الكود ل socket io المشروع متقسم ل  prisma\schema.prisma src\controllers src\middleware src\routes src\utils src\app.js src\prismaClient.js  عايز اعدل في كل فايل بحيث يكون المشروع متكلمل وبدون اخطاء عايز ابعت رسايل في كل عمليه بتتم اول حاجه في عمليات ال orders عايز لما المستخدم يعمل order لو هو نوعه 