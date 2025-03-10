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
  try {
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

    const totalOrders = await prisma.order.count({ where: { ...whereCondition, ...searchCondition, ...statusCondition, ...paymentStatusCondition } });
    const totalPages = Math.ceil(totalOrders / limit);
    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: {orders,totalOrders, totalPages, currentPage: page}
      });
      return;
    }

    const translatedOrders = await Promise.all(orders.map(async (order) => {
      const [ translatedAddress] = await Promise.all([
        order.address ? translate(order.location.address, { to: lang }) : null
      ]);

      return {
        ...order,
        address: translatedAddress
      };
    }));
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
      notes,
      imageUrl,
      locationId,
      price,
      duration,
      paymentMethod,
      store,
      ...createOrderData
    } = req.body;

    const service =type === "service" ? await prisma.serviceParameter.findUnique({
      where: { id: serviceId },
    }):null;

    if (!service && type === "service") {
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
      if (!userId || !serviceId || !providerId || !totalAmount || !price || !paymentMethod ) {
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
      const [notesTranslated] = await Promise.all([
        translate(notes, { to: "en" })
      ]);

      const newOrder = await prisma.order.create({
        data: {
          user: {
            connect: { id: user.id } // Connect the user by their ID
          },
          service:{
            connect: { id: service.id } // Connect the service by their ID
          },
          provider:{
            connect: { id: provider.id } // Connect the provider by their ID
          },
          totalAmount,
          notes:notesTranslated,
          imageUrl,
          location: {
            connect: { id: location.id } // Connect the location by their ID
          },
          price,
          duration,...createOrderData,
          paymentMethod
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
      const [finalNotes] = await Promise.all([
        translate(newOrder.notes, { to: lang })
      ]);

      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: {
          ...newOrder,

          notes: finalNotes
        }
      });
    }else if (type === "delivery"){
      if (!userId  || !totalAmount  || !price || !paymentMethod ) {
        const message = await translate('All fields are required', { to: lang });
        return res.status(400).json({ status: false, message, code: 400, data: null });
      }

      // ترجمة الحقول النصية إلى الإنجليزية
      const [notesTranslated] = await Promise.all([
        translate(notes, { to: "en" })
      ]);

      const newOrder = await prisma.order.create({
        data: {
          user: {
            connect: { id: user.id } // Connect the user by their ID
          },
          totalAmount,
          notes:notesTranslated,
          imageUrl,
          location: {
            connect: { id: location.id } // Connect the location by their ID
          },
          price,
          duration,...createOrderData,
          paymentMethod,
          store:{
            create:store.map((store)=>({
              store:{
                connect: { id: store.storeId } // Connect the store by their ID
              },
              products:{
                create:store.products.map((product)=>({
                  productId:product.productId,
                  quantity:product.quantity
                }))
              }
            }))
          }
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
      const [ finalNotes] = await Promise.all([
        translate(newOrder.notes, { to: lang })
      ]);

      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: {
          ...newOrder,
          notes: finalNotes
        }
      });

    }
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
    const [translatedAddress] = await Promise.all([
      order.address ? translate(order.address, { to: lang }) : null
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...order,
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

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        totalAmount: totalAmount || order.totalAmount,
        paymentStatus,
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


    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedOrder,
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
