const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Orders
const getAllOrders = async (req, res) => {
  const lang = req.query.lang || 'en';
  const { userId, role, limit = 10, page = 1, search, status, paymentStatus } = req.query;
  const skip = (page - 1) * limit;
  let searchTranslated = search ? await translate(search, { to: lang }) : undefined;
  let searchCondition = {};
  if (searchTranslated) {
    searchCondition = {
      OR: [
        { description: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } },
        { address: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } },
        { store: { name: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } } }
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
  try {
    const orders = await prisma.order.findMany({
      where: { ...whereCondition, ...searchCondition, ...statusCondition, ...paymentStatusCondition },
      include: {
        service: true,
        provider: true,
        deliveryDriver: true,
        store: true,
        user: true
      },
      skip,
      take: +limit
    });
    const message = await translate('Orders retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: orders
      });
      return;
    }

    // ترجمة جميع الطلبات في وقت واحد
    const translatedOrders = await Promise.all(orders.map(async (order) => {
      const [translatedDesc, translatedAddress] = await Promise.all([
        order.description ? translate(order.description, { to: lang }) : null,
        order.address ? translate(order.address, { to: lang }) : null
      ]);

      return {
        ...order,
        description: translatedDesc,
        address: translatedAddress
      };
    }));
    const totalOrders = await prisma.order.count({ where: { ...whereCondition, ...searchCondition, ...statusCondition, ...paymentStatusCondition } });
    const totalPages = Math.ceil(totalOrders / limit);
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        orders: translatedOrders, totalPages,
        currentPage: page,
        totalOrders
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
      description,
      notes,
      imageUrl,
      locationId,
      price,
      duration,
      ...createOrderData
    } = req.body;

    const service =type === "service" ? await prisma.serviceParameter.findUnique({
      where: { id: serviceId },
    }):type === "dilivery" ? await prisma.store.findUnique({
      where: { id: serviceId },
    }):null;

    if (!service) {
      const message = await translate('Service not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId,role:"user" },
    });
    if (!user) {
      const message = await translate('User not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });      
    }
    const location = await prisma.userLocation.findUnique({
    where:{id:locationId}
    })
    if (!location) {
      const message = await translate('User Location not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });  
    }
    // التحقق من نوع الطلب وإنشاءه
    if (type === "service") {
      if (!userId || !serviceId || !providerId || !totalAmount || !price ) {
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

      // ترجمة الحقول النصية إلى الإنجليزية
      const [translatedDesc,notesTranslated] = await Promise.all([
        translate(description, { to: "en" }),
        translate(notes, { to: "en" })
      ]);

      const newOrder = await prisma.order.create({
        data: {
          userId,
          serviceId,
          providerId,
          totalAmount,
          description: translatedDesc,
          notes:notesTranslated,
          imageUrl,
          locationId,
          price,
          duration,...createOrderData
        },
      });

      const message = await translate('Order created successfully', { to: lang });

      if (lang === 'en') {
        res.status(201).json({
          status: true,
          message,
          code: 201,
          data: newOrder
        });
        return;
      }

      // ترجمة البيانات للغة المطلوبة
      const [finalDesc, finalNotes] = await Promise.all([
        translate(newOrder.description, { to: lang }),
        translate(newOrder.notes, { to: lang })
      ]);

      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: {
          ...newOrder,
          description: finalDesc,
          notes: finalNotes
        }
      });
    }else{
      if (!userId  || !totalAmount  || !price ) {
        const message = await translate('All fields are required', { to: lang });
        return res.status(400).json({ status: false, message, code: 400, data: null });
      }

      // ترجمة الحقول النصية إلى الإنجليزية
      const [translatedDesc,notesTranslated] = await Promise.all([
        translate(description, { to: "en" }),
        translate(notes, { to: "en" })
      ]);

      const newOrder = await prisma.order.create({
        data: {
          userId,
          storeId:service.id,
          totalAmount,
          description: translatedDesc,
          notes:notesTranslated,
          imageUrl,
          locationId,
          price,
          duration,...createOrderData
        },
      });

      const message = await translate('Order created successfully', { to: lang });

      if (lang === 'en') {
        res.status(201).json({
          status: true,
          message,
          code: 201,
          data: newOrder
        });
        return;
      }

      // ترجمة البيانات للغة المطلوبة
      const [finalDesc, finalNotes] = await Promise.all([
        translate(newOrder.description, { to: lang }),
        translate(newOrder.notes, { to: lang })
      ]);

      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: {
          ...newOrder,
          description: finalDesc,
          notes: finalNotes
        }
      });

    }
    // else if (type === "delivery") {
    //   // نفس المنطق السابق ولكن للتوصيل
    //   if (!userId || !serviceId || !deliveryDriverId || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
    //     const message = await translate('All fields are required', { to: lang });
    //     return res.status(400).json({ status: false, message, code: 400, data: null });
    //   }

    //   const deliveryDriver = await prisma.deliveryDriver.findUnique({
    //     where: { id: deliveryDriverId },
    //   });

    //   if (!deliveryDriver) {
    //     const message = await translate('Delivery driver not found', { to: lang });
    //     return res.status(404).json({ status: false, message, code: 404, data: null });
    //   }

    //   // ترجمة الحقول النصية إلى الإنجليزية
    //   const [translatedDesc, translatedAddress] = await Promise.all([
    //     translate(description, { to: "en" }),
    //     translate(address, { to: "en" })
    //   ]);

    //   const newOrder = await prisma.order.create({
    //     data: {
    //       userId,
    //       serviceId,
    //       deliveryDriverId,
    //       totalAmount,
    //       description: translatedDesc,
    //       imageUrl,
    //       address: translatedAddress,
    //       latitude,
    //       longitude,
    //       price,
    //       duration
    //     },
    //   });

    //   const message = await translate('Order created successfully', { to: lang });

    //   if (lang === 'en') {
    //     res.status(201).json({
    //       status: true,
    //       message,
    //       code: 201,
    //       data: newOrder
    //     });
    //     return;
    //   }

    //   // ترجمة البيانات للغة المطلوبة
    //   const [finalDesc, finalAddress] = await Promise.all([
    //     translate(newOrder.description, { to: lang }),
    //     translate(newOrder.address, { to: lang })
    //   ]);

    //   res.status(201).json({
    //     status: true,
    //     message,
    //     code: 201,
    //     data: {
    //       ...newOrder,
    //       description: finalDesc,
    //       address: finalAddress
    //     }
    //   });
    // }
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
    });

    if (!order) {
      const message = await translate('Order not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null
      });
    }

    const message = await translate('Order found', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: order
      });
      return;
    }

    // ترجمة البيانات للغة المطلوبة
    const [translatedDesc, translatedAddress] = await Promise.all([
      order.description ? translate(order.description, { to: lang }) : null,
      order.address ? translate(order.address, { to: lang }) : null
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...order,
        description: translatedDesc,
        address: translatedAddress
      }
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
      description,
      address,
      status,
      totalAmount,
      paymentStatus,
      price,
      duration
    } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      const message = await translate('Order not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة الحقول النصية إلى الإنجليزية
    const [translatedDesc, translatedAddress, translatedStatus, translatedPayStatus] = await Promise.all([
      description ? translate(description, { to: "en" }) : order.description,
      address ? translate(address, { to: "en" }) : order.address,
      status ? translate(status, { to: "en" }) : order.status,
      paymentStatus ? translate(paymentStatus, { to: "en" }) : order.paymentStatus
    ]);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        description: translatedDesc,
        address: translatedAddress,
        status: translatedStatus,
        totalAmount: totalAmount || order.totalAmount,
        paymentStatus: translatedPayStatus,
        price: price || order.price,
        duration: duration || order.duration
      },
    });

    const message = await translate('Order updated successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: updatedOrder
      });
      return;
    }

    // ترجمة البيانات المحدثة للغة المطلوبة
    const [finalDesc, finalAddress, finalStatus, finalPayStatus] = await Promise.all([
      translate(updatedOrder.description, { to: lang }),
      translate(updatedOrder.address, { to: lang }),
      translate(updatedOrder.status, { to: lang }),
      translate(updatedOrder.paymentStatus, { to: lang })
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedOrder,
        description: finalDesc,
        address: finalAddress,
        status: finalStatus,
        paymentStatus: finalPayStatus
      }
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
    });

    if (!order) {
      const message = await translate('Order not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    await prisma.order.delete({
      where: { id },
    });

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
