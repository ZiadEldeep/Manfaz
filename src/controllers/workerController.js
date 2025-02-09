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
    const newWorker = await prisma.worker.create({
      data: { userId, skills, experience, hourlyRate },
    });
    res.status(201).json(newWorker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllWorkers, createWorker };
