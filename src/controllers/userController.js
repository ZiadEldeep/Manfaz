const prisma = require('../prismaClient');

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({
      status: true,
      message: 'Users retrieved successfully',
      code: 200,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `Failed to retrieve users ${error.message}`,
      code: 500,
      data: null,
    });
  }
};

// Get User By ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
        code: 404,
        data: null,
      });
    }

    res.status(200).json({
      status: true,
      message: 'User retrieved successfully',
      code: 200,
      data: user,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        status: false,
        message: 'User not found',
        code: 404,
        data: null,
      });
    }
    res.status(500).json({
      status: false,
      message: `Failed to retrieve user ${error.message}`,
      code: 500,
      data: null,
    });
  }
};


// Update an Existing User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, verificationCode } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, phone, password, verificationCode },
    });

    res.status(200).json({
      status: true,
      message: 'User updated successfully',
      code: 200,
      data: updatedUser,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        status: false,
        message: 'User not found',
        code: 404,
        data: null,
      });
    }
    res.status(500).json({
      status: false,
      message: `Failed to update user ${error.message}`,
      code: 500,
      data: null,
    });
  }
};

// Delete a User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      status: true,
      message: 'User deleted successfully',
      code: 200,
      data: null,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        status: false,
        message: 'User not found',
        code: 404,
        data: null,
      });
    }
    res.status(500).json({
      status: false,
      message: `Failed to delete user ${error.message}`,
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
