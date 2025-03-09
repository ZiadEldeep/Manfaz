const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const translate = require('translate-google');

const getAllUserLocations = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const locations = await prisma.userLocation.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('userLocationsUpdated', locations);
    }

    const message = await translate('Locations retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: await translate('Failed to retrieve locations', { to: lang }),
      code: 500,
      error: error.message
    });
  }
};

// الحصول على عناوين المستخدم
const getUserLocations = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { userId } = req.params;

    const locations = await prisma.userLocation.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const message = await translate('Locations retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: locations
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إضافة عنوان جديد
const createUserLocation = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { userId } = req.params;
    const {
      name,
      address,
      apartment,
      floor,
      building,
      street,
      area,
      city,
      latitude,
      longitude,
      type,
      notes,
      isDefault
    } = req.body;

    if (!name || !address || !city || !latitude || !longitude) {
      const message = await translate('Name, address, city, latitude and longitude are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // إذا كان العنوان الجديد افتراضي، نقوم بإلغاء الافتراضي من العناوين الأخرى
    if (isDefault) {
      await prisma.userLocation.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const location = await prisma.userLocation.create({
      data: {
        userId,
        name,
        address,
        apartment,
        floor,
        building,
        street,
        area,
        city,
        latitude,
        longitude,
        type: type || 'other',
        notes,
        isDefault: isDefault || false
      }
    });

    // إرسال إشعارات
    if (req.io) {
      // إشعار للمستخدم
      req.io.to(`user_${userId}`).emit('newLocation', location);

      // إشعار للوحة التحكم
      req.io.to('admin').emit('newUserLocation', {
        userId,
        location
      });
    }

    const message = await translate('Location added successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: location
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// تحديث عنوان
const updateUserLocation = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;
    const updateData = req.body;

    const location = await prisma.userLocation.findUnique({
      where: { id }
    });

    if (!location) {
      const message = await translate('Location not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // إذا كان التحديث يتضمن جعل العنوان افتراضي
    if (updateData.isDefault) {
      await prisma.userLocation.updateMany({
        where: {
          userId: location.userId,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const updatedLocation = await prisma.userLocation.update({
      where: { id },
      data: updateData
    });

    // إرسال إشعارات التحديث
    if (req.io) {
      // إشعار للمستخدم
      req.io.to(`user_${location.userId}`).emit('locationUpdated', updatedLocation);

      // إشعار للوحة التحكم
      req.io.to('admin').emit('userLocationUpdated', {
        userId: location.userId,
        location: updatedLocation
      });
    }

    const message = await translate('Location updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedLocation
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// حذف عنوان
const deleteUserLocation = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;

    const location = await prisma.userLocation.findUnique({
      where: { id }
    });

    if (!location) {
      const message = await translate('Location not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    await prisma.userLocation.delete({
      where: { id }
    });

    // إذا كان العنوان المحذوف افتراضي، نجعل أقدم عنوان هو الافتراضي
    if (location.isDefault) {
      const oldestLocation = await prisma.userLocation.findFirst({
        where: { userId: location.userId },
        orderBy: { createdAt: 'asc' }
      });

      if (oldestLocation) {
        await prisma.userLocation.update({
          where: { id: oldestLocation.id },
          data: { isDefault: true }
        });

        // إرسال إشعار بتحديث العنوان الافتراضي
        if (req.io) {
          req.io.to(`user_${location.userId}`).emit('defaultLocationChanged', oldestLocation);
        }
      }
    }

    // إرسال إشعارات الحذف
    if (req.io) {
      // إشعار للمستخدم
      req.io.to(`user_${location.userId}`).emit('locationDeleted', { id });

      // إشعار للوحة التحكم
      req.io.to('admin').emit('userLocationDeleted', {
        userId: location.userId,
        locationId: id
      });
    }

    const message = await translate('Location deleted successfully', { to: lang });
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

// تعيين عنوان كافتراضي
const setDefaultLocation = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;

    const location = await prisma.userLocation.findUnique({
      where: { id }
    });

    if (!location) {
      const message = await translate('Location not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // إلغاء الافتراضي من جميع عناوين المستخدم
    await prisma.userLocation.updateMany({
      where: { userId: location.userId },
      data: { isDefault: false }
    });

    // تعيين العنوان المحدد كافتراضي
    const updatedLocation = await prisma.userLocation.update({
      where: { id },
      data: { isDefault: true }
    });

    // إرسال إشعارات
    if (req.io) {
      // إشعار للمستخدم
      req.io.to(`user_${location.userId}`).emit('defaultLocationChanged', updatedLocation);

      // إشعار للوحة التحكم
      req.io.to('admin').emit('userDefaultLocationChanged', {
        userId: location.userId,
        location: updatedLocation
      });
    }

    const message = await translate('Default location set successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedLocation
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

module.exports = {
  getUserLocations,
  createUserLocation,
  updateUserLocation,
  deleteUserLocation,
  setDefaultLocation,
  getAllUserLocations
}; 