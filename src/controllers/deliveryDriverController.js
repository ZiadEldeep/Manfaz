const prisma = require('../prismaClient');

// Get All Delivery Drivers
const getAllDeliveryDrivers = async (req, res) => {
  try {
    const drivers = await prisma.deliveryDriver.findMany();
    res.status(200).json({
      status: true,
      message: 'Delivery drivers fetched successfully',
      code: 200,
      data: drivers
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Get Delivery Driver By ID
const getDeliveryDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await prisma.deliveryDriver.findUnique({
      where: { id },
    });
    if (!driver) return res.status(404).json({ status: false, message: 'Delivery driver not found', code: 404, data: null });
    res.status(200).json({
      status: true,
      message: 'Delivery driver fetched successfully',
      code: 200,
      data: driver
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Create a New Delivery Driver
const createDeliveryDriver = async (req, res) => {
  try {
    const { userId, vehicleType, license, availability } = req.body;
    if (!userId || !vehicleType || !license || !availability) {
      return res.status(400).json({ status: false, message: 'All fields are required', code: 400, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return res.status(404).json({ status: false, message: 'User not found', code: 404, data: null });

    const newDriver = await prisma.deliveryDriver.create({
      data: {
        userId,
        vehicleType,
        license,
        availability,
      },
    });

    res.status(201).json({
      status: true,
      message: 'Delivery driver created successfully',
      code: 201,
      data: newDriver
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Update a Delivery Driver
const updateDeliveryDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleType, license, availability, rating, reviewsCount } = req.body;

    const updatedDriver = await prisma.deliveryDriver.update({
      where: { id },
      data: {
        vehicleType,
        license,
        availability,
        rating,
        reviewsCount,
      },
    });

    res.status(200).json({
      status: true,
      message: 'Delivery driver updated successfully',
      code: 200,
      data: updatedDriver
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Delete a Delivery Driver
const deleteDeliveryDriver = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.deliveryDriver.delete({
      where: { id },
    });

    res.status(200).json({
      status: true,
      message: 'Delivery driver deleted successfully',
      code: 200,
      data: null
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        status: false,
        message: 'Delivery driver not found',
        code: 404,
        data: null,
      });
    }
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

module.exports = {
  getAllDeliveryDrivers,
  getDeliveryDriverById,
  createDeliveryDriver,
  updateDeliveryDriver,
  deleteDeliveryDriver,
};
