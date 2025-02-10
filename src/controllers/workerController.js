const prisma = require('../prismaClient');

// Get All Workers
const getAllWorkers = async (req, res) => {
  try {
    const workers = await prisma.worker.findMany();
    res.status(200).json({
      status: true,
      message: 'Workers retrieved successfully',
      code: 200,
      data: workers
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Create Worker
const createWorker = async (req, res) => {
  try {
    const { userId, skills, experience, hourlyRate } = req.body;
    if (!userId || !skills || !experience || !hourlyRate) {
      return res.status(400).json({ status: false, message: 'All fields are required', code: 400, data: null });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return res.status(404).json({ status: false, message: 'User not found', code: 404, data: null });
    const newWorker = await prisma.worker.create({
      data: { userId, skills, experience, hourlyRate },
    });
    res.status(201).json({
      status: true,
      message: 'Worker created successfully',
      code: 201,
      data: newWorker
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Get Worker By ID
const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await prisma.worker.findUnique({
      where: { id },
    });
    if (!worker) return res.status(404).json({ status: false, message: 'Worker not found', code: 404, data: null });
    res.status(200).json({
      status: true,
      message: 'Worker retrieved successfully',
      code: 200,
      data: worker
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        status: false,
        message: 'Worker not found',
        code: 404,
        data: null,
      });
    }
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Update Worker By ID
const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { skills, experience, hourlyRate } = req.body;
    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: { skills, experience, hourlyRate },
    });
    res.status(200).json({
      status: true,
      message: 'Worker updated successfully',
      code: 200,
      data: updatedWorker
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Delete Worker By ID
const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.worker.delete({
      where: { id },
    });
    res.status(200).json({
      status: true,
      message: 'Worker deleted successfully',
      code: 200,
      data: null
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        status: false,
        message: 'Worker not found',
        code: 404,
        data: null,
      });
    }
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};
module.exports = { getAllWorkers, createWorker, getWorkerById, updateWorker, deleteWorker };
