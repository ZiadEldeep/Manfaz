const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Orders
const getAllOrders = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const orders = await prisma.order.findMany();
    const message=await translate('Orders retrieved successfully', { to: lang });

    const data=[]
    for (let i = 0; i < orders.length; i++) {
      if (lang == 'en') {
        data.push(orders[i])
      }else{
        data.push({
          ...orders[i],
            description: await translate(orders[i].description, { to: lang }),
        })
      }
    }
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: data
    });
  } catch (error) {
    const message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Create Order
const createOrder = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { userId, serviceId, providerId,deliveryDriverId, totalAmount,type,description,imageUrl,address,latitude,longitude,price,duration } = req.body;
    let service=await prisma.service.findUnique({
        where: { id: serviceId },
      })
    if (!service){
        const message=await translate('Service not found', { to: lang });
        return res.status(404).json({ status: false, message: message, code: 404, data: null });
    }if (type=="work") {
        if (!userId || !serviceId || !providerId  || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
            const message=await translate('All fields are required', { to: lang });
            return res.status(400).json({ status: false, message: message, code: 400, data: null });
        }
        let provider=await prisma.worker.findUnique({
            where: { id: providerId },
          })
        if (!provider){
            const message=await translate('Worker not found', { to: lang });
            return res.status(404).json({ status: false, message: message, code: 404, data: null });
        }
        let translateDescription=await translate(description, { to: "en" });
        const newOrder = await prisma.order.create({
            data: { userId, serviceId, providerId, totalAmount,description:translateDescription,imageUrl,address,latitude,longitude,price,duration },
          });
        const message=await translate('Order created successfully', { to: lang });
        const data=lang=='en'?newOrder:{...newOrder,description:await translate(newOrder.description, { to: lang })}
          res.status(201).json({
            status: true,
            message: message,
            code: 201,
            data: data
          });

    }else if(type=="delivery"){
        if (!userId || !serviceId || !deliveryDriverId || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
            const message=await translate('All fields are required', { to: lang });
            return res.status(400).json({ status: false, message: message, code: 400, data: null });
        }
        let deliveryDriver=await prisma.deliveryDriver.findUnique({
            where: { id: deliveryDriverId },
          })
        if (!deliveryDriver){
            const message=await translate('Delivery driver not found', { to: lang });
            return res.status(404).json({ status: false, message: message, code: 404, data: null });
        }
        let translateDescription=await translate(description, { to: "en" });
        const newOrder = await prisma.order.create({
            data: { userId, serviceId, deliveryDriverId, totalAmount,description:translateDescription,imageUrl,address,latitude,longitude,price,duration },
          });
        const message=await translate('Order created successfully', { to: lang });
        const data=lang=='en'?newOrder:{...newOrder,description:await translate(newOrder.description, { to: lang })}
          res.status(201).json({
            status: true,
            message: message,
            code: 201,
            data: data
          });
    }
   
  } catch (error) {
    const message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
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
    if (!order) return res.status(404).json({ status: false, message: 'Order not found', code: 404, data: null });
    const data=lang=='en'?order:{...order,description:await translate(order.description, { to: lang })}
    res.status(200).json({
      status: true,
      message: 'Order found',
      code: 200,
      data: data
    });
  } catch (error) {
    const message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Update Order
const updateOrder = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { id } = req.params;
    const { userId, serviceId, providerId,deliveryDriverId, totalAmount,type,description,imageUrl,address,latitude,longitude,price,duration } = req.body;
    let service=await prisma.service.findUnique({
        where: { id: serviceId },
      })
    if (!service) return res.status(404).json({ status: false, message: 'Service not found', code: 404, data: null });
    if (type=="work") {
        if (!userId || !serviceId || !providerId  || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
            return res.status(400).json({ status: false, message: 'All fields are required', code: 400, data: null });
        }
        let provider=await prisma.worker.findUnique({
            where: { id: providerId },
          })
        if (!provider) return res.status(404).json({ status: false, message: 'Worker not found', code: 404, data: null });
        let translateDescription=await translate(description, { to: "en" });
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { userId, serviceId, providerId, totalAmount,description:translateDescription,imageUrl,address,latitude,longitude,price,duration ,deliveryDriverId:undefined },
          });
          const message=await translate('Order updated successfully', { to: lang });
        const data=lang=='en'?updatedOrder:{...updatedOrder,description:await translate(updatedOrder.description, { to: lang })}
          res.status(201).json({
            status: true,
            message: message,
            code: 201,
            data: data
          });

    }else if(type=="delivery"){
        if (!userId || !serviceId || !deliveryDriverId || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
            return res.status(400).json({ status: false, message: 'All fields are required', code: 400, data: null });
        }
        let deliveryDriver=await prisma.deliveryDriver.findUnique({
            where: { id: deliveryDriverId },
          })
        if (!deliveryDriver) return res.status(404).json({ status: false, message: 'Delivery driver not found', code: 404, data: null });
        let translateDescription=await translate(description, { to: "en" });
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { userId, serviceId, deliveryDriverId, totalAmount,description:translateDescription,imageUrl,address,latitude,longitude,price,duration ,providerId:undefined},
          });
          const message=await translate('Order updated successfully', { to: lang });
        const data=lang=='en'?updatedOrder:{...updatedOrder,description:await translate(updatedOrder.description, { to: lang })}
          res.status(201).json({
            status: true,
            message: message,
            code: 201,
            data: data
          });
    }
    const message=await translate('All fields are required', { to: lang });
    res.status(400).json({ status: false, message: message, code: 400, data: null });
  } catch (error) {
    const message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Delete Order
const deleteOrder = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { id } = req.params;
    await prisma.order.delete({
      where: { id },
    });
    const message=await translate('Order deleted successfully', { to: lang });
    res.status(200).json({
            status: true,
            message: message,
            code: 200,
            data: null
          })
  } catch (error) {
    const message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
};
