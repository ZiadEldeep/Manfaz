const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const translate = require('../translate');
const {endOfDay} = require('date-fns');
// Get All Orders
const getAllOrders = async (req, res) => {
  const lang = req.query.lang || 'en';
  const { userId, role, limit = 10, page = 1, search, status, paymentStatus,date } = req.query;
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
    let dateCondition = {};
    if (date) {
      dateCondition = { createdAt: { gte: new Date(date),lte: endOfDay(new Date(date)) },updatedAt: { gte: new Date(date),lte: endOfDay(new Date(date)) } };
    }
    let paymentStatusCondition = {};
    if (paymentStatus) {
      paymentStatusCondition = { paymentStatus: paymentStatus };
    }
    const whereCondition =
      role === 'user' ? { userId } : role === 'worker' ? { provider: { userId } } : { deliveryDriver: { userId } }

    const orders = await prisma.order.findMany({
      orderBy: [
        { createdAt: 'desc' }, // or 'desc'
        { updatedAt: 'desc' }  // or 'desc'
      ],
      where: { ...whereCondition, ...searchCondition, ...statusCondition, ...paymentStatusCondition, ...dateCondition },
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        },
        deliveryDriver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        },
        store: {
          include: {
            store:{
              select:{
                id:true,
                name:true,
                logo:true
              }
            }
          }
        },
        user: true,
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
      latitude,
      longitude,
      address,
      price,
      duration,
      paymentMethod,
      store,
      id,
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
          service: {
            connect: { id: service.id } // Connect the service by their ID
          },
          provider: {
            connect: { id: provider.id } // Connect the provider by their ID
          },
          totalAmount,
          notes: notesTranslated,
          imageUrl,
          latitude,
          longitude,
          address,
          price,
          duration,
          ...createOrderData,
          paymentMethod
        },
        include: {
          user: true,
          service: true,
          provider: true,
        }
      });

      // إنشاء إشعار للعامل
      const workerNotification = await prisma.notification.create({
        data: {
          title: await translate('طلب خدمة جديد', { to: lang }),
          message: await translate(`لديك طلب خدمة جديد من ${user.name}`, { to: lang }),
          type: 'worker',
          relatedId: providerId,
          isRead: false
        }
      });

      // إرسال الإشعار للعامل عبر Socket.IO
      if (req.io) {
        req.io.to(`worker:${providerId}`).emit('newNotification', workerNotification);
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
          latitude,
          longitude,
          address,
          price,
          duration,
          ...createOrderData,
          paymentMethod,
          store: {
            create: store.map((store) => ({
              store: {
                connect: { id: store.storeId } // Connect the store by their ID
              },
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
        }
      });

      // إنشاء إشعار للموظفين
      const employees = await prisma.employee.findMany({
        where: {
          role: 'customer_service',
          isActive: true
        }
      });

      for (const employee of employees) {
        const employeeNotification = await prisma.notification.create({
          data: {
            title: await translate('طلب توصيل جديد', { to: lang }),
            message: await translate(`لديك طلب توصيل جديد من ${user.name}`, { to: lang }),
            type: 'employee',
            relatedId: employee.id,
            isRead: false
          }
        });

        // إرسال الإشعار للموظف عبر Socket.IO
        if (req.io) {
          req.io.to(`employee:${employee.id}`).emit('newNotification', employeeNotification);
        }
      }

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
      updatedBy,
      rejectionMessage
    } = req.body;

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
        if (status === 'in_progress') {
          // إشعار الموافقة على الطلب
          const userNotification = await prisma.notification.create({
            data: {
              title: await translate('تم قبول طلبك', { to: lang }),
              message: await translate(`قام العامل ${order.provider.title} بقبول طلبك وجاري تنفيذه`, { to: lang }),
              type: 'user',
              relatedId: order.userId,
              isRead: false
            }
          });

          req.io.to(`user_${order.userId}`).emit('newNotification', userNotification);
        } else if (status === 'canceled') {
          // إشعار رفض الطلب
          const userNotification = await prisma.notification.create({
            data: {
              title: await translate('تم رفض طلبك', { to: lang }),
              message: await translate(
                rejectionMessage || 
                `عذراً، قام العامل ${order.provider.title} برفض طلبك. يمكنك تجربة عمال آخرين.`, 
                { to: lang }
              ),
              type: 'user',
              relatedId: order.userId,
              isRead: false
            }
          });

          req.io.to(`user_${order.userId}`).emit('newNotification', userNotification);
        }
      } else if (updatedBy === 'user') {
        if (order.providerId) {
          req.io.to(`worker_${order.providerId}`).emit('orderUpdated', updatedOrder);
        }
        order.store?.forEach(store => {
          req.io.to(`store_${store.id}`).emit('orderUpdated', updatedOrder);
        });
      }

      // إرسال إشعار عند اكتمال الطلب
      if (status === 'completed') {
        const userNotification = await prisma.notification.create({
          data: {
            title: await translate('تم إكمال طلبك', { to: lang }),
            message: await translate(`تم إكمال طلبك بنجاح. نتمنى أن تكون راضياً عن الخدمة المقدمة`, { to: lang }),
            type: 'user',
            relatedId: order.userId,
            isRead: false
          }
        });

        // إرسال إشعار للموظفين
        const employees = await prisma.employee.findMany({
          where: {
            role: 'customer_service',
            isActive: true
          }
        });

        for (const employee of employees) {
          const employeeNotification = await prisma.notification.create({
            data: {
              title: await translate('طلب مكتمل', { to: lang }),
              message: await translate(`تم إكمال الطلب رقم ${order.id} بنجاح`, { to: lang }),
              type: 'employee',
              relatedId: employee.id,
              isRead: false
            }
          });

          req.io.to(`employee:${employee.id}`).emit('newNotification', employeeNotification);
        }

        req.io.to(`user_${order.userId}`).emit('newNotification', userNotification);
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