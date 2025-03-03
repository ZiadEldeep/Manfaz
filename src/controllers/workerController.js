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
    const { 
      userId, 
      title,
      description,
      location,
      profileImage,
      hourlyRate,
      skills 
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!userId || !title || !description || !location || !hourlyRate || !skills) {
      const message = await translate('All required fields must be provided', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const message = await translate('User not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    let translateSkills = await Promise.all(skills.map(skill => translate(skill, { to: "en" })));
    let translateTitle = await translate(title, { to: "en" });
    let translateDescription = await translate(description, { to: "en" });
    let translateLocation = await translate(location, { to: "en" });

    const newWorker = await prisma.worker.create({
      data: {
        userId,
        title: translateTitle,
        description: translateDescription,
        location: translateLocation,
        profileImage,
        hourlyRate,
        skills: translateSkills,
        isAvailable: true,
        isFavorite: false,
        jobSuccessRate: 0,
        totalEarned: 0
      },
    });

    const message = await translate('Worker created successfully', { to: lang });
    
    let data = newWorker;
    if (lang !== 'en') {
      data = {
        ...newWorker,
        title: await translate(newWorker.title, { to: lang }),
        description: await translate(newWorker.description, { to: lang }),
        location: await translate(newWorker.location, { to: lang }),
        skills: await Promise.all(newWorker.skills.map(skill => translate(skill, { to: lang })))
      };
    }

    res.status(201).json({
      status: true,
      message,
      code: 201,
      data
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
