const prisma = require('../prismaClient');

// Get All Workers
const getAllWorkers = async (req, res) => {
  try {
    const workers = await prisma.worker.findMany();
    res.status(200).json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Worker
const createWorker = async (req, res) => {
  try {
    const { userId, skills, experience, hourlyRate } = req.body;
    if (!userId || !skills || !experience || !hourlyRate) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newWorker = await prisma.worker.create({
      data: { userId, skills, experience, hourlyRate },
    });
    res.status(201).json(newWorker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Worker By ID
const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await prisma.worker.findUnique({
      where: { id },
    });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(200).json(updatedWorker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Worker By ID
const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.worker.delete({
      where: { id },
    });
    res.status(200).json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = { getAllWorkers, createWorker, getWorkerById, updateWorker, deleteWorker };
