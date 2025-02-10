const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Delivery Drivers
const getAllDeliveryDrivers = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const drivers = await prisma.deliveryDriver.findMany();
    const message=(await translate('Delivery drivers retrieved successfully', { to: lang }));

    const data=[]
    for (let i = 0; i < drivers.length; i++) {
      if (lang == 'en') {
        data.push(drivers[i])
      }else{
        data.push({
          ...drivers[i],
            vehicleType: (await translate(drivers[i].vehicleType, { to: lang })),
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
    const message=(await translate(error.message, { to: lang }));
    res.status(500).json({ status: false, message: message, code: 500, data: null });
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
    if (!driver) return res.status(404).json({ status: false, message: 'Delivery driver not found', code: 404, data: null });
    const message=(await translate('Delivery driver fetched successfully', { to: lang }));
    const data=lang=='en'?driver:{...driver,vehicleType:(await translate(driver.vehicleType, { to: lang }))}
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: data
    });
  } catch (error) {
    const message=(await translate(error.message, { to: lang }));
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Create a New Delivery Driver
const createDeliveryDriver = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { userId, vehicleType, license, availability } = req.body;
    if (!userId || !vehicleType || !license || !availability) {
      const message=(await translate('All fields are required', { to: lang }));
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      const message=(await translate('User not found', { to: lang }));
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
    }
    let translateVehicleType=await translate(vehicleType, { to: "en" });
    const newDriver = await prisma.deliveryDriver.create({
      data: {
        userId,
        vehicleType:translateVehicleType,
        license,
        availability,
      },
    });

    const message=(await translate('Delivery driver created successfully', { to: lang }));
    const data=lang=='en'?newDriver:{...newDriver,vehicleType:(await translate(newDriver.vehicleType, { to: lang }))}
    res.status(201).json({
      status: true,
      message: message,
      code: 201,
      data: data
    });
  } catch (error) {
    const message=(await translate(error.message, { to: lang }));
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Update a Delivery Driver
const updateDeliveryDriver = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { id } = req.params;
    const { vehicleType, license, availability, rating, reviewsCount } = req.body;
    if (!id) {
      const message=(await translate('id is required', { to: lang }));
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }
    const driver = await prisma.deliveryDriver.findUnique({
      where: { id },
    });
    if (!driver){
      const message=(await translate('Delivery driver not found', { to: lang }));
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
     }
     let translateVehicleType=await translate(vehicleType, { to: "en" });
    const updatedDriver = await prisma.deliveryDriver.update({
      where: { id },
      data: {
        vehicleType:translateVehicleType,
        license,
        availability,
        rating,
        reviewsCount,
      },
    });

    const message=(await translate('Delivery driver updated successfully', { to: lang }));
    const data=lang=='en'?updatedDriver:{...updatedDriver,vehicleType:(await translate(updatedDriver.vehicleType, { to: lang }))}
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: data
    });
  } catch (error) {
    const message=(await translate(error.message, { to: lang }));
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Delete a Delivery Driver
const deleteDeliveryDriver = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { id } = req.params;

    const deletedDriver = await prisma.deliveryDriver.delete({
      where: { id },
    });

    const message=(await translate('Delivery driver deleted successfully', { to: lang }));
   
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: null
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const message=await translate('Delivery driver not found', { to: lang });
      return res.status(404).json({
        status: false,
        message: message,
        code: 404,
        data: null,
      });
    }
    const message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

module.exports = {
  getAllDeliveryDrivers,
  getDeliveryDriverById,
  createDeliveryDriver,
  updateDeliveryDriver,
  deleteDeliveryDriver,
};
