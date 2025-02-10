const prisma = require('../prismaClient');

// Get All Orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany();
    res.status(200).json({
      status: true,
      message: 'Orders retrieved successfully',
      code: 200,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Create Order
const createOrder = async (req, res) => {
  try {
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
        const newOrder = await prisma.order.create({
            data: { userId, serviceId, providerId, totalAmount,description,imageUrl,address,latitude,longitude,price,duration },
          });
          res.status(201).json({
            status: true,
            message: 'Order created successfully',
            code: 201,
            data: newOrder
          });

    }else if(type=="delivery"){
        if (!userId || !serviceId || !deliveryDriverId || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
            return res.status(400).json({ status: false, message: 'All fields are required', code: 400, data: null });
        }
        let deliveryDriver=await prisma.deliveryDriver.findUnique({
            where: { id: deliveryDriverId },
          })
        if (!deliveryDriver) return res.status(404).json({ status: false, message: 'Delivery driver not found', code: 404, data: null });
        const newOrder = await prisma.order.create({
            data: { userId, serviceId, deliveryDriverId, totalAmount,description,imageUrl,address,latitude,longitude,price,duration },
          });
          res.status(201).json({
            status: true,
            message: 'Order created successfully',
            code: 201,
            data: newOrder
          });
    }
   
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Get Order By ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order) return res.status(404).json({ status: false, message: 'Order not found', code: 404, data: null });
    res.status(200).json({
      status: true,
      message: 'Order found',
      code: 200,
      data: order
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Update Order
const updateOrder = async (req, res) => {
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
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { userId, serviceId, providerId, totalAmount,description,imageUrl,address,latitude,longitude,price,duration ,deliveryDriverId:undefined },
          });
          res.status(201).json({
            status: true,
            message: 'Order updated successfully',
            code: 201,
            data: updatedOrder
          });

    }else if(type=="delivery"){
        if (!userId || !serviceId || !deliveryDriverId || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
            return res.status(400).json({ status: false, message: 'All fields are required', code: 400, data: null });
        }
        let deliveryDriver=await prisma.deliveryDriver.findUnique({
            where: { id: deliveryDriverId },
          })
        if (!deliveryDriver) return res.status(404).json({ status: false, message: 'Delivery driver not found', code: 404, data: null });
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { userId, serviceId, deliveryDriverId, totalAmount,description,imageUrl,address,latitude,longitude,price,duration ,providerId:undefined},
          });
          res.status(201).json({
            status: true,
            message: 'Order updated successfully',
            code: 201,
            data: updatedOrder
          });
    }

    res.status(400).json({ status: false, message: 'All fields are required', code: 400, data: null });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Delete Order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.order.delete({
      where: { id },
    });
    res.status(200).json({
            status: true,
            message: 'Order deleted successfully',
            code: 200,
            data: null
          })
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
};
