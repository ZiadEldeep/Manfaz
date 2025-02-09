const prisma = require('../prismaClient');

// Get All Orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Order
const createOrder = async (req, res) => {
  try {
    const { userId, serviceId, providerId,deliveryDriverId, totalAmount,type,description,imageUrl,address,latitude,longitude,price,duration } = req.body;
    if (type=="work") {
        if (!userId || !serviceId || !providerId  || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        let provider=await prisma.worker.findUnique({
            where: { id: providerId },
          })
        if (!provider) return res.status(404).json({ error: 'Worker not found' });
        const newOrder = await prisma.order.create({
            data: { userId, serviceId, providerId, totalAmount,description,imageUrl,address,latitude,longitude,price,duration },
          });
          res.status(201).json(newOrder);

    }else if(type=="delivery"){
        if (!userId || !serviceId || !deliveryDriverId || !totalAmount || !description || !imageUrl || !address || !latitude || !longitude || !price || !duration) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        let deliveryDriver=await prisma.deliveryDriver.findUnique({
            where: { id: deliveryDriverId },
          })
        if (!deliveryDriver) return res.status(404).json({ error: 'Delivery driver not found' });
        const newOrder = await prisma.order.create({
            data: { userId, serviceId, deliveryDriverId, totalAmount,description,imageUrl,address,latitude,longitude,price,duration },
          });
          res.status(201).json(newOrder);
    }
   
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Order By ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Order
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.order.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
};
