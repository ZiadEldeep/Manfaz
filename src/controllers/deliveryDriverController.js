const prisma = require('../prismaClient');

// Get All Delivery Drivers
const getAllDeliveryDrivers = async (req, res) => {
  try {
    const drivers = await prisma.deliveryDriver.findMany();
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Delivery Driver By ID
const getDeliveryDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await prisma.deliveryDriver.findUnique({
      where: { id },
    });
    if (!driver) return res.status(404).json({ error: 'Delivery driver not found' });
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a New Delivery Driver
const createDeliveryDriver = async (req, res) => {
  try {
    const { userId, vehicleType, license, availability } = req.body;
    if (!userId || !vehicleType || !license || !availability) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newDriver = await prisma.deliveryDriver.create({
      data: {
        userId,
        vehicleType,
        license,
        availability,
      },
    });

    res.status(201).json(newDriver);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    res.status(200).json(updatedDriver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a Delivery Driver
const deleteDeliveryDriver = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.deliveryDriver.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Delivery driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllDeliveryDrivers,
  getDeliveryDriverById,
  createDeliveryDriver,
  updateDeliveryDriver,
  deleteDeliveryDriver,
};
