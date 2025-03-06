const { tr } = require('translate-google/languages');
const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Workers
const getAllWorkers = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const workers = await prisma.worker.findMany({include: { user: {
      select: {
        id: true,
        name: true,
        locations: true,
      },
    } }});
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
      skills 
    } = req.body;

    if (!userId || !title || !description || !hourlyRate || !skills) {
      const message = await translate('All required fields must be provided', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId,role:"worker" },
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
        totalEarned: 0
      },
    });

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
      include: { user:true }
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
    const { title, description, skills, hourlyRate, isVerified,totalJobsDone,about,
      experiences ,
      reviews ,userId } = req.body;

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
      let experienceTranslated=await Promise.all(experiences.map(e=>{
        let [title,description,company,duration]= Promise.all([
          translate(e.title, { to: "en" }),
          translate(e.description, { to: "en" }),
          translate(e.company, { to: "en" }),
          translate(e.duration,{to:"en"} )
        ])
        return {
          ...e,
          title,
          workerId: id,
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
        where:{id:userId,role:"user"}
      })
      if (!user) {
        const message = await translate('User not found', { to: lang });
        return res.status(404).json({ status: false, message, code: 404, data: null });
        
      }
      let reviewTranslated=await Promise.all(reviews.map(r=>{
        let [comment]= Promise.all([
          translate(r.comment , { to: "en" }),
        ])
        return {
          ...r,
          comment,
          workerId:id,
          userId,
        }
      }))
      await prisma.review.createMany({
        data: reviewTranslated
      })
      
    }
    // ترجمة جميع الحقول المحدثة في وقت واحد
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
        hourlyRate: hourlyRate || worker.hourlyRate
      },
    });

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
      translate(updatedWorker.title, { to: lang }),
      translate(updatedWorker.description, { to: lang }),
      Promise.all(updatedWorker.skills.map(skill => translate(skill, { to: lang })))
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
module.exports = { getAllWorkers, createWorker, getWorkerById, updateWorker, deleteWorker };
