const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Users
const getAllUsers = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const users = await prisma.user.findMany();
    const message=await translate('Users retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: users,
    });
  } catch (error) {
    let message=await translate(`Failed to retrieve users ${error.message}`, { to: lang });
    res.status(500).json({
      status: false,
      message: message,
      code: 500,
      data: null,
    });
  }
};

// Get User By ID
const getUserById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      const message=await translate('User not found', { to: lang });
      return res.status(404).json({
        status: false,
        message: message,
        code: 404,
        data: null,
      });
    }
let message=await translate('User retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: user,
    });
  } catch (error) {
    if (error.code === 'P2025') {
        let message=await translate('User not found', { to: lang });
      return res.status(404).json({
        status: false,
        message: message,
        code: 404,
        data: null,
      });
    }
    let message=await translate(error.message, { to: lang });
    res.status(500).json({
      status: false,
      message: message,
      code: 500,
      data: null,
    });
  }
};


// Update an Existing User
const updateUser = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { name, email, phone, password, verificationCode } = req.body;
    if (!id) {
      let message=await translate('id is required', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user){
      let message=await translate('User not found', { to: lang });
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
     }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, phone, password, verificationCode },
    });
    let message=await translate('User updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: updatedUser,
    });
  } catch (error) {
    if (error.code === 'P2025') {
        let message=await translate('User not found', { to: lang });
      return res.status(404).json({
        status: false,
        message: message,
        code: 404,
        data: null,
      });
    }
    let message = await translate(`Failed to update user ${error.message}`, { to: lang });
    res.status(500).json({
      status: false,
      message: message,
      code: 500,
      data: null,
    });
  }
};

// Delete a User
const deleteUser = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;

    await prisma.order.deleteMany({
      where: { userId: id },
    });
    await prisma.deliveryDriver.deleteMany({
      where: { userId: id },
    });
    await prisma.worker.deleteMany({
      where: { userId: id },
    });
await prisma.user.delete({
  where: { id },
});

    let message=await translate('User deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: null,
    });
  } catch (error) {
    if (error.code === 'P2025') {
        let message=await translate('User not found', { to: lang });
      return res.status(404).json({
        status: false,
        message: message,
        code: 404,
        data: null,
      });
    }
    let message=await translate(`Failed to delete user ${error.message}`, { to: lang });
    res.status(500).json({
      status: false,
      message: message,
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
