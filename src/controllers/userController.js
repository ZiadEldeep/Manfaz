const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Users
const getAllUsers = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const users = await prisma.user.findMany();
    const message = await translate('Users retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: users
      });
      return;
    }



    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: users
    });
  } catch (error) {
    const message = await translate(`Failed to retrieve users: ${error.message}`, { to: lang });
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};

// Get User By ID
const getUserById = async (req, res) => {
  const lang = req.query.lang || 'en';
  const role = req.query.role || 'user';
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);   
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        locations: true,
        Worker:role==="worker"&&{
          include:{
            Order:{
              take:5
            },
            reviews:{
              take:5
            },
            earnings:{
              where:{
                createdAt:{
                  gte:startOfMonth
                }
              }
            }
          }
        }
      }
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
        let totalEarnings = await prisma.earning.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            workerId: user.Worker[0].id,
          },
        });
    let totalOrders = await prisma.order.count({
      where:role==="worker"?{
        providerId: user.Worker[0].id
      }:role==="user"?{
        userId: id
      }:null
    });
    let totalReviews =role==="worker"? await prisma.review.count({
      where:{
        workerId: user.Worker[0].id
      }
    }):0;

    const message = await translate('User retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: {...user,
          totalOrders,
          totalReviews,
          totalEarnings:totalEarnings._sum.amount || 0
        }
      });
      return;
    }
    let workerTranslated = await translate(user.Worker[0].title, { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...{...user,Worker:[...user.Worker,{...user.Worker[0],title:workerTranslated}]},
        totalOrders,
        totalReviews,
        totalEarnings:totalEarnings._sum.amount || 0
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};

// Update User
const updateUser = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { name, email, phone, password, verificationCode, imageUrl } = req.body;

    if (!id) {
      const message = await translate('ID is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      const message = await translate('User not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة الاسم إلى الإنجليزية إذا تم تحديثه
    const translatedName = name ? await translate(name, { to: "en" }) : user.name;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: translatedName,
        email: email || user.email,
        phone: phone || user.phone,
        password: password || user.password,
        verificationCode: verificationCode || user.verificationCode,
        imageUrl: imageUrl || user.imageUrl
      },
    });

    const message = await translate('User updated successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: updatedUser
      });
      return;
    }

    // ترجمة الاسم للغة المطلوبة
    const finalName = await translate(updatedUser.name, { to: lang });

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedUser,
        name: finalName
      }
    });
  } catch (error) {
    const message = await translate(`Failed to update user: ${error.message}`, { to: lang });
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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

    // حذف جميع السجلات المرتبطة
    await Promise.all([
      prisma.order.deleteMany({
        where: { userId: id },
      }),
      prisma.deliveryDriver.deleteMany({
        where: { userId: id },
      }),
      prisma.worker.deleteMany({
        where: { userId: id },
      })
    ]);

    await prisma.user.delete({
      where: { id },
    });

    const message = await translate('User deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null,
    });
  } catch (error) {
    const message = await translate(`Failed to delete user: ${error.message}`, { to: lang });
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
