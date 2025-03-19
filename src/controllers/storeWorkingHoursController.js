const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const  translate  = require('../translate');

// التحقق مما إذا كان الوقت الحالي ضمن ساعات العمل
const isTimeInRange = (currentTime, openTime, closeTime) => {
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);

  const current = currentHour * 60 + currentMinute;
  const open = openHour * 60 + openMinute;
  const close = closeHour * 60 + closeMinute;

  return current >= open && current <= close;
};

// الحصول على مواعيد عمل المتجر
const getStoreWorkingHours = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;

    const workingHours = await prisma.storeWorkingHours.findMany({
      where: { 
        storeId,
        isSpecialDay: false 
      },
      orderBy: { dayOfWeek: 'asc' }
    });

    const specialDays = await prisma.storeWorkingHours.findMany({
      where: { 
        storeId,
        isSpecialDay: true 
      },
      orderBy: { specialDate: 'asc' }
    });

    const message = await translate('Working hours retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        regularHours: workingHours,
        specialDays
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// تعيين مواعيد عمل المتجر
const setStoreWorkingHours = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;
    const { workingHours } = req.body;

    if (!Array.isArray(workingHours) || workingHours.length !== 7) {
      const message = await translate('Working hours for all days of the week are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // حذف المواعيد القديمة
    await prisma.storeWorkingHours.deleteMany({
      where: { 
        storeId,
        isSpecialDay: false 
      }
    });

    // إضافة المواعيد الجديدة
    const newWorkingHours = await Promise.all(
      workingHours.map(hours => 
        prisma.storeWorkingHours.create({
          data: {
            storeId,
            dayOfWeek: hours.dayOfWeek,
            isOpen: hours.isOpen,
            openTime: hours.openTime,
            closeTime: hours.closeTime,
            breakStart: hours.breakStart,
            breakEnd: hours.breakEnd,
            note: hours.note
          }
        })
      )
    );

    const message = await translate('Working hours set successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: newWorkingHours
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// تحديث مواعيد يوم محدد
const updateWorkingHours = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { storeId, dayOfWeek } = req.params;
    const updateData = req.body;

    const workingHours = await prisma.storeWorkingHours.updateMany({
      where: { 
        storeId,
        dayOfWeek: parseInt(dayOfWeek),
        isSpecialDay: false
      },
      data: updateData
    });

    const message = await translate('Working hours updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: workingHours
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إضافة يوم خاص
const addSpecialDay = async (req, res) => {
    const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;
    const {
      specialDate,
      isOpen,
      openTime,
      closeTime,
      note
    } = req.body;

    if (!specialDate) {
      const message = await translate('Special date is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const specialDay = await prisma.storeWorkingHours.create({
      data: {
        storeId,
        specialDate: new Date(specialDate),
        isSpecialDay: true,
        isOpen,
        openTime,
        closeTime,
        note
      }
    });

    const message = await translate('Special day added successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: specialDay
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// التحقق من حالة المتجر (مفتوح/مغلق)
const checkStoreOpen = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // التحقق من الأيام الخاصة أولاً
    const specialDay = await prisma.storeWorkingHours.findFirst({
      where: {
        storeId,
        isSpecialDay: true,
        specialDate: {
          equals: new Date(now.setHours(0,0,0,0))
        }
      }
    });

    if (specialDay) {
      const isOpen = specialDay.isOpen && 
                    isTimeInRange(currentTime, specialDay.openTime, specialDay.closeTime);

      const message = await translate(
        isOpen ? 'Store is open' : 'Store is closed',
        { to: lang }
      );

      return res.status(200).json({
        status: true,
        message,
        code: 200,
        data: {
          isOpen,
          note: specialDay.note
        }
      });
    }

    // التحقق من ساعات العمل العادية
    const regularHours = await prisma.storeWorkingHours.findFirst({
      where: {
        storeId,
        dayOfWeek: currentDay,
        isSpecialDay: false
      }
    });

    if (!regularHours) {
      const message = await translate('Working hours not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const isOpen = regularHours.isOpen && 
                  isTimeInRange(currentTime, regularHours.openTime, regularHours.closeTime) &&
                  (!regularHours.breakStart || 
                   !isTimeInRange(currentTime, regularHours.breakStart, regularHours.breakEnd));

    const message = await translate(
      isOpen ? 'Store is open' : 'Store is closed',
      { to: lang }
    );

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        isOpen,
        currentDay,
        currentTime,
        workingHours: regularHours
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
// حذف يوم خاص
const deleteSpecialDay = async (req, res) => {
    const lang = req.query.lang || 'en';
  try {
    const { storeId, id } = req.params;

    await prisma.storeWorkingHours.delete({
      where: {
        id: parseInt(id),
        storeId: parseInt(storeId),
        isSpecialDay: true
      }
    });

    const message = await translate('Special day deleted successfully', { to: lang });
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
  getStoreWorkingHours,
  setStoreWorkingHours,
  updateWorkingHours,
  addSpecialDay,
  deleteSpecialDay,
  checkStoreOpen
}; 