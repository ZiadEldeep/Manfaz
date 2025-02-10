const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Workers
const getAllWorkers = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const workers = await prisma.worker.findMany();
    const message=await translate('Workers retrieved successfully', { to: lang });
    let data=[]
    for (let i = 0; i < workers.length; i++) {
      if (lang == 'en') {
        data.push(workers[i])
      }else{
        data.push({
          ...workers[i],
          skills:workers[i]?.skills?.map(async(e)=>await translate(e, { to: lang }))||[],
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
    const message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Create Worker
const createWorker = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { userId, skills, experience, hourlyRate } = req.body;
    if (!userId || !skills || !experience || !hourlyRate) {
      const message=await translate('All fields are required', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      const message=await translate('User not found', { to: lang });
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
    }
    let translateSkills=await skills.map(async(e)=>await translate(e, { to: "en" }))
    const newWorker = await prisma.worker.create({
      data: { userId, skills:translateSkills, experience, hourlyRate },
    });
    const message=await translate('Worker created successfully', { to: lang });
    let data=lang=='en'?newWorker:{...newWorker,skills:await newWorker.skills.map(async(e)=>await translate(e, { to: lang }))}
    res.status(201).json({
      status: true,
      message: message,
      code: 201,
      data: data
    });
  } catch (error) {
    const message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Get Worker By ID
const getWorkerById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const worker = await prisma.worker.findUnique({
      where: { id },
    });
    if (!worker){ 
      let message=await translate('Worker not found', { to: lang });
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
   } let message=await translate('Worker retrieved successfully', { to: lang });
    let data=lang=='en'?worker:{...worker,skills:await worker.skills.map(async(e)=>await translate(e, { to: lang }))}
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: data
    });
  } catch (error) {
    if (error.code === 'P2025') {
      let message=await translate('Worker not found', { to: lang });
      return res.status(404).json({
        status: false,
        message: message,
        code: 404,
        data: null,
      });
    }
    let message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Update Worker By ID
const updateWorker = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { skills, experience, hourlyRate } = req.body;
    if (!id) {
      const message=await translate('id is required', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }
    const worker = await prisma.worker.findUnique({
      where: { id },
    });
    if (!worker){ 
      let message=await translate('Worker not found', { to: lang });
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
   }
    let translateSkills=await skills.map(async(e)=>await translate(e, { to: "en" }))
    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: { skills:translateSkills, experience, hourlyRate },
    });
    let message=await translate('Worker updated successfully', { to: lang });
    let data=lang=='en'?updatedWorker:{...updatedWorker,skills:await updatedWorker.skills.map(async(e)=>await translate(e, { to: lang }))}
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: data
    });
  } catch (error) {
    let message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Delete Worker By ID
const deleteWorker = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    await prisma.worker.delete({
      where: { id },
    });
    let message=await translate('Worker deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: null
    });
  } catch (error) {
    if (error.code === 'P2025') {
      let message=await translate('Worker not found', { to: lang });
      return res.status(404).json({
        status: false,
        message: message,
        code: 404,
        data: null,
      });
    }
    let message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};
module.exports = { getAllWorkers, createWorker, getWorkerById, updateWorker, deleteWorker };
