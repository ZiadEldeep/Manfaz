const prisma = require('../prismaClient');
const translate = require('translate-google');

// Get All Delivery Drivers
const getAllDeliveryDrivers = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const drivers = await prisma.deliveryDriver.findMany();
    const message = await translate('Delivery drivers retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: drivers
      });
      return;
    }

    // ترجمة جميع السائقين في وقت واحد
    const translatedDrivers = await Promise.all(drivers.map(async (driver) => {
      const translatedVehicleType = driver.vehicleType ? 
        await translate(driver.vehicleType, { to: lang }) : null;

      return {
        ...driver,
        vehicleType: translatedVehicleType,
      };
    }));

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedDrivers
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Create Delivery Driver
const createDeliveryDriver = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { userId, vehicleType, license, availability } = req.body;

    if (!userId || !vehicleType || !license) {
      const message = await translate('All required fields must be provided', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const message = await translate('User not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة نوع المركبة إلى الإنجليزية
    const translatedVehicleType = await translate(vehicleType, { to: "en" });

    const newDriver = await prisma.deliveryDriver.create({
      data: {
        userId,
        vehicleType: translatedVehicleType,
        license,
        availability: availability ?? true,
      },
    });

    const message = await translate('Delivery driver created successfully', { to: lang });

    if (lang === 'en') {
      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: newDriver
      });
      return;
    }

    // ترجمة البيانات للغة المطلوبة
    const finalVehicleType = await translate(newDriver.vehicleType, { to: lang });

    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        ...newDriver,
        vehicleType: finalVehicleType
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Get Delivery Driver By ID
const getDeliveryDriverById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const driver = await prisma.deliveryDriver.findUnique({
      where: { id },
    });

    if (!driver) {
      const message = await translate('Delivery driver not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const message = await translate('Delivery driver retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: driver
      });
      return;
    }

    // ترجمة البيانات للغة المطلوبة
    const translatedVehicleType = driver.vehicleType ? 
      await translate(driver.vehicleType, { to: lang }) : null;

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...driver,
        vehicleType: translatedVehicleType
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Delivery Driver
const updateDeliveryDriver = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { vehicleType, license, availability, rating, reviewsCount } = req.body;

    const driver = await prisma.deliveryDriver.findUnique({
      where: { id },
    });

    if (!driver) {
      const message = await translate('Delivery driver not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة نوع المركبة إلى الإنجليزية إذا تم تحديثه
    const translatedVehicleType = vehicleType ? 
      await translate(vehicleType, { to: "en" }) : driver.vehicleType;

    const updatedDriver = await prisma.deliveryDriver.update({
      where: { id },
      data: {
        vehicleType: translatedVehicleType,
        license: license || driver.license,
        availability: availability ?? driver.availability,
        rating: rating || driver.rating,
        reviewsCount: reviewsCount || driver.reviewsCount,
      },
    });

    const message = await translate('Delivery driver updated successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: updatedDriver
      });
      return;
    }

    // ترجمة البيانات المحدثة للغة المطلوبة
    const finalVehicleType = updatedDriver.vehicleType ? 
      await translate(updatedDriver.vehicleType, { to: lang }) : null;

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedDriver,
        vehicleType: finalVehicleType
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Delete Delivery Driver
const deleteDeliveryDriver = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    await prisma.deliveryDriver.delete({
      where: { id },
    });

    const message = await translate('Delivery driver deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const message = await translate('Delivery driver not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null,
      });
    }
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

module.exports = {
  getAllDeliveryDrivers,
  getDeliveryDriverById,
  createDeliveryDriver,
  updateDeliveryDriver,
  deleteDeliveryDriver,
}; 