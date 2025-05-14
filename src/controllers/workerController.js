const prisma = require('../prismaClient');
const translate = require('../translate');
const { addDays, startOfMonth, endOfMonth } = require("date-fns");
// Get All Workers
const getAllWorkers = async (req, res) => {
  const lang = req.query.lang || 'en';
  let { categoryId, longitude, latitude } = req.query;
  let maxDistance = 10; // 10 كيلومتر

  try {
    const workers = await prisma.worker.findMany({
      where: categoryId ? {
        WorkerCategory: {
          some: {
            categoryId
          }
        }
      } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            locations: true,
            imageUrl: true
          },
        }
      }
    });

    // // فلترة حسب المسافة إذا تم توفير الإحداثيات
    // if (longitude && latitude) {
    //   longitude = parseFloat(longitude);
    //   latitude = parseFloat(latitude);

    //   const workersWithDistance = workers.filter(worker => {
    //     if (!worker.user.locations || worker.user.locations.length === 0) return false;

    //     // حساب المسافة لكل موقع من مواقع العامل
    //     const distances = worker.user.locations.map(location => {
    //       console.log(location);
    //       const R = 6371; // نصف قطر الأرض بالكيلومتر
    //       const dLat = (location.latitude - latitude) * Math.PI / 180;
    //       const dLon = (location.longitude - longitude) * Math.PI / 180;
    //       const a =
    //         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //         Math.cos(latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) *
    //         Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //       const distance = R * c;
    //       return distance;
    //     });

    //     // إرجاع العامل إذا كان أي من مواقعه ضمن المسافة المطلوبة
    //     return Math.min(...distances) <= maxDistance;
    //   });

    //   // إرسال تحديث للوحة التحكم
    //   if (req.io) {
    //     req.io.to('admin').emit('workersUpdated', workersWithDistance);
    //   }

    //   const message = await translate('Workers retrieved successfully', { to: lang });

    //   if (lang === 'en') {
    //     res.status(200).json({
    //       status: true,
    //       message,
    //       code: 200,
    //       data: workersWithDistance
    //     });
    //     return;
    //   }

    //   // ترجمة جميع العمال في وقت واحد
    //   const translatedWorkers = await Promise.all(workersWithDistance.map(async (worker) => {
    //     const [translatedTitle, translatedDesc, translatedSkills] = await Promise.all([
    //       translate(worker.title, { to: lang }),
    //       translate(worker.description, { to: lang }),
    //       Promise.all(worker.skills.map(skill => translate(skill, { to: lang })))
    //     ]);

    //     return {
    //       ...worker,
    //       title: translatedTitle,
    //       description: translatedDesc,
    //       skills: translatedSkills
    //     };
    //   }));

    //   res.status(200).json({
    //     status: true,
    //     message,
    //     code: 200,
    //     data: translatedWorkers
    //   });
    //   return;
    // }

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('workersUpdated', workers);
    }

    const message = await translate('Workers retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: workers
      });
      return;
    }

    // ترجمة جميع العمال في وقت واحد
    const translatedWorkers = await Promise.all(workers.map(async (worker) => {
      const [translatedTitle, translatedDesc, translatedSkills] = await Promise.all([
        translate(worker.title, { to: lang }),
        translate(worker.description, { to: lang }),
        Promise.all(worker.skills.map(skill => translate(skill, { to: lang })))
      ]);

      return {
        ...worker,
        title: translatedTitle,
        description: translatedDesc,
        skills: translatedSkills
      };
    }));

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedWorkers
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Create Worker
const createWorker = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const {
      userId,
      title,
      description,
      profileImage,
      hourlyRate,
      skills,
      WorkerCategory
    } = req.body;
    const currentDate = new Date();
    const startMonth = startOfMonth(currentDate); // أول يوم في الشهر
    const endMonth = endOfMonth(currentDate); // آخر يوم في الشهر

    const schedules = [];
    for (let day = startMonth; day <= endMonth; day = addDays(day, 1)) {
      schedules.push({
        date: day,
        scheduledTime: new Date(day.setHours(9, 0, 0, 0)), // بدء العمل الساعة 9 صباحًا
        day: day.toLocaleDateString("en-US", { weekday: "long" }), // استخراج اسم اليوم (Monday, Tuesday...)
        shiftType: "MORNING",
        maxOrders: 10,
        ordersCount: 0,
        isFull: false,
        status: "SCHEDULED",
        priority: "MEDIUM",
      });
    }
    if (!userId || !title || !description || !hourlyRate || !skills) {
      const message = await translate('All required fields must be provided', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "worker" },
    });

    if (!user) {
      const message = await translate('User not found as worker', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة جميع الحقول في وقت واحد
    const [translateTitle, translateDesc, translateSkills] = await Promise.all([
      translate(title, { to: "en" }),
      translate(description, { to: "en" }),
      Promise.all(skills.map(skill => translate(skill, { to: "en" })))
    ]);

    const newWorker = await prisma.worker.create({
      data: {
        userId,
        title: translateTitle,
        description: translateDesc,
        profileImage,
        hourlyRate,
        skills: translateSkills,
        isAvailable: true,
        isFavorite: false,
        jobSuccessRate: 0,
        totalEarned: 0,
        WorkerCategory: {
          create: WorkerCategory.map(category => ({
            categoryId: category.categoryId
          }))
        },
        ScheduleOrder: {
          create: {
            Schedule: schedules
          }
        }
      },
      include: {
        user: true,
        WorkerCategory: true
      }
    });
    // if (WorkerCategory) {
    //   await prisma.workerCategory.createMany({
    //     data: WorkerCategory.map(category => ({
    //       categoryId: category.categoryId,
    //       workerId: newWorker.id
    //     }))
    //   })
    // }

    // إرسال إشعار للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('newWorker', newWorker);
    }

    const message = await translate('Worker created successfully', { to: lang });

    if (lang === 'en') {
      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: newWorker
      });
      return;
    }

    // ترجمة البيانات للغة المطلوبة
    const [transTitle, transDesc, transSkills] = await Promise.all([
      translate(newWorker.title, { to: lang }),
      translate(newWorker.description, { to: lang }),
      Promise.all(newWorker.skills.map(skill => translate(skill, { to: lang })))
    ]);

    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        ...newWorker,
        title: transTitle,
        description: transDesc,
        skills: transSkills
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Get Worker By ID
const getWorkerById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: { user: true, WorkerCategory: true }
    });

    if (!worker) {
      const message = await translate('Worker not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null
      });
    }

    const message = await translate('Worker retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: worker
      });
      return;
    }

    // ترجمة جميع البيانات في وقت واحد
    const [transTitle, transDesc, transSkills] = await Promise.all([
      translate(worker.title, { to: lang }),
      translate(worker.description, { to: lang }),
      Promise.all(worker.skills.map(skill => translate(skill, { to: lang })))
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...worker,
        title: transTitle,
        description: transDesc,
        skills: transSkills
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Worker
const updateWorker = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { title, description, skills, hourlyRate, isVerified, totalJobsDone, about,
      experiences,
      reviews, userId, WorkerCategory, isAvailable } = req.body;

    if (!id) {
      const message = await translate('id is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const worker = await prisma.worker.findUnique({
      where: { id },
    });

    if (!worker) {
      const message = await translate('Worker not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    if (experiences) {
      let experienceTranslated = await Promise.all(experiences.map(e => {
        let [title, description, company, duration] = Promise.all([
          translate(e.title, { to: "en" }),
          translate(e.description, { to: "en" }),
          translate(e.company, { to: "en" }),
          translate(e.duration, { to: "en" })
        ])
        return {
          workerId: id,
          ...e,
          title,
          description,
          company,
          duration
        }
      }))
      await prisma.workExperience.createMany({
        data: experienceTranslated
      })

    }
    if (reviews && userId) {
      let user = await prisma.user.findUnique({
        where: { id: userId, role: "user" }
      })
      if (!user) {
        const message = await translate('User not found', { to: lang });
        return res.status(404).json({ status: false, message, code: 404, data: null });

      }
      let reviewTranslated = await Promise.all(reviews.map(r => {
        let [comment] = Promise.all([
          translate(r.comment, { to: "en" }),
        ])
        return {
          ...r,
          comment,
          workerId: id,
          userId,
        }
      }))
      await prisma.review.createMany({
        data: reviewTranslated
      })

    }
    // ترجمة جميع الحقول المحدثة في وقت واحد
    if (WorkerCategory) {
      WorkerCategory.map(async category => {
        let workerCategory = await prisma.workerCategory.findFirst({
          where: {
            categoryId: category.categoryId,
            workerId: id,
          },
        });

        if (!workerCategory) {
          await prisma.workerCategory.create({
            data: {
              categoryId: category.categoryId,
              workerId: id
            }
          })
        }
      })
    }
    const [transTitle, transDesc, transSkills] = await Promise.all([
      title ? translate(title, { to: "en" }) : worker.title,
      description ? translate(description, { to: "en" }) : worker.description,
      skills ? Promise.all(skills.map(skill => translate(skill, { to: "en" }))) : worker.skills
    ]);

    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: {
        title: transTitle,
        description: transDesc,
        skills: transSkills,
        hourlyRate: hourlyRate || worker.hourlyRate,
        isAvailable: isAvailable !== undefined ? isAvailable : worker.isAvailable
      },
      include: {
        user: true,
        WorkerCategory: true
      }
    });

    // إرسال إشعارات التحديث
    if (req.io) {
      // إشعار للعامل نفسه
      req.io.to(`worker_${id}`).emit('profileUpdated', updatedWorker);

      // إشعار للوحة التحكم
      req.io.to('admin').emit('workerUpdated', updatedWorker);

      // إذا تم تحديث حالة التوفر
      if (isAvailable !== undefined) {
        req.io.emit('workerAvailabilityChanged', {
          workerId: id,
          isAvailable
        });
      }
    }

    const message = await translate('Worker updated successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: updatedWorker
      });
      return;
    }

    // ترجمة البيانات المحدثة للغة المطلوبة
    const [finalTitle, finalDesc, finalSkills] = await Promise.all([
      translate(updatedWorker.title, { to: "en" }),
      translate(updatedWorker.description, { to: "en" }),
      Promise.all(updatedWorker.skills.map(skill => translate(skill, { to: "en" })))
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedWorker,
        title: finalTitle,
        description: finalDesc,
        skills: finalSkills
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Delete Worker
const deleteWorker = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    await prisma.worker.delete({
      where: { id },
    });
    const message = await translate('Worker deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const message = await translate('Worker not found', { to: lang });
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
let updateAvailability = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    // تحقق من وجود العامل
    const workerExists = await prisma.worker.findUnique({
      where: { id }
    });

    if (!workerExists) {
      const message = await translate('Worker not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null,
      });
    }

    const worker = await prisma.worker.update({
      where: { id },
      data: { isAvailable },
    });

    // إرسال إشعارات التحديث
    if (req.io) {
      req.io.to(`worker_${id}`).emit('availabilityUpdated', worker);
      req.io.to('admin').emit('workerUpdated', worker);
    }

    const message = await translate('Availability updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: worker
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
// Get All Reviews
const getAllReviews = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { workerId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { workerId },
      include: {
        worker: true,
        user: true,
        order: true
      },
    });
    res.status(200).json({
      status: true,
      message: await translate('Reviews retrieved successfully', { to: lang }),
      code: 200,
      data: reviews,
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Create Review
const createReview = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { workerId, rating, comment, userId, orderId } = req.body;
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
    });
    if (!worker) {
      const message = await translate('Worker not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null,
      });
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      const message = await translate('Order not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null,
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      const message = await translate('User not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null,
      });
    }
    const review = await prisma.review.create({
      data: {
        workerId,
        rating,
        comment,
        userId,
        orderId,
      },
      include: {
        user: true,
        worker: true,
        order: true
      }
    });

    // إرسال إشعارات التقييم
    if (req.io) {
      // إشعار للعامل
      req.io.to(`worker_${workerId}`).emit('newReview', review);

      // إشعار للوحة التحكم
      req.io.to('admin').emit('newReview', {
        type: 'worker',
        review
      });
    }

    const message = await translate('Review created successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: review,
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Review
const updateReview = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const review = await prisma.review.update({
      where: { id },
      data: req.body,
      include: {
        worker: true,
        user: true,
        order: true
      },
    });
    const message = await translate('Review updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: review,
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Delete Review
const deleteReview = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    await prisma.review.delete({
      where: { id },
    });
    const message = await translate('Review deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null,
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Schedule
const updateSchedule = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { workerId } = req.params;
    const { schedule } = req.body;

    const updatedSchedule = await prisma.scheduleOrder.update({
      where: { workerId },
      data: {
        schedule,
      },
      include: {
        worker: true
      }
    });

    // إرسال إشعارات تحديث الجدول
    if (req.io) {
      // إشعار للعامل
      req.io.to(`worker_${workerId}`).emit('scheduleUpdated', updatedSchedule);

      // إشعار للوحة التحكم
      req.io.to('admin').emit('workerScheduleUpdated', {
        workerId,
        schedule: updatedSchedule
      });
    }

    const message = await translate('Schedule updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedSchedule,
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

module.exports = { getAllWorkers, createWorker, getWorkerById, updateWorker, deleteWorker, getAllReviews, createReview, updateReview, deleteReview, updateSchedule, updateAvailability };
