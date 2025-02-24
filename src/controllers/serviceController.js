const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Services
const getAllServices = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  const { type,categoryId } = req.query; // Get 'type' from query parameters

  try {
    const services = await prisma.service.findMany({
      where: type ? { type,categoryId } : {}, // Add filter if 'type' is provided
    });
    let message=await translate('Services retrieved successfully', { to: lang });
    let data=[];
    for (let i = 0; i < services.length; i++) {
      if (lang == 'en') {
        data.push(services[i])
      }else{
        data.push({
          ...services[i],
            name: await translate(services[i].name, { to: lang }),
            slug: await translate(services[i].slug, { to: lang }),
            description: await translate(services[i].description, { to: lang }),
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


// Create Service
const createService = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { name, slug, description, categoryId, type, price, duration,imageUrl } = req.body;
    if (!name || !slug || !description || !categoryId || !type || !price || !duration) {
      const message=await translate('Name, slug, description, category ID, type, price, and duration are required', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      const message=await translate('Category not found', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }
    let translateName=await translate(name, { to: "en" });
    let translateSlug=await translate(slug, { to: "en" });
    let translateDescription=await translate(description, { to: "en" });
    const newService = await prisma.service.create({
      data: { name: translateName, slug: translateSlug, description: translateDescription, categoryId, type, price, duration,imageUrl },
    });
    const message=await translate('Service created successfully', { to: lang });
    const data=lang=='en'?newService:{...newService,name:await translate(newService.name, { to: lang }),slug:await translate(newService.slug, { to: lang }),description:await translate(newService.description, { to: lang })}
    res.status(201).json({
            status: true,
            message: message,
            code: 201,
            data: data
          });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Get Service By ID
const getServiceById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        parameters: true,
      }
    });
    let message=await translate('Service retrieved successfully', { to: lang });
    let data=lang=='en'?service:{...service,name:await translate(service.name, { to: lang }),slug:await translate(service.slug, { to: lang }),description:await translate(service.description, { to: lang })}
    if (!service) return res.status(404).json({ status: false, message: message, code: 404, data: null });
    res.status(200).json({
            status: true,
            message: message,
            code: 200,
            data: data
          });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Update Service
const updateService = async (req, res) => {
  let lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { name, slug, description, categoryId, type, price, duration,imageUrl } = req.body;
    let service=await prisma.service.findUnique({
        where: { id },
      })
    if (!service){
      let message=await translate('Service not found', { to: lang });
       return res.status(404).json({ status: false, message: message, code: 404, data: null });
     }
      let translateName=await translate(name, { to: "en" });
    let translateSlug=await translate(slug, { to: "en" });
    let translateDescription=await translate(description, { to: "en" });
    const updatedService = await prisma.service.update({
      where: { id },
      data: { name:translateName, slug:translateSlug, description:translateDescription, categoryId, type, price, duration,imageUrl },
    });
    let message=await translate('Service updated successfully', { to: lang });
    const data=lang=='en'?updatedService:{...updatedService,name:await translate(updatedService.name, { to: lang }),slug:await translate(updatedService.slug, { to: lang }),description:await translate(updatedService.description, { to: lang })}
    res.status(200).json({
            status: true,
            message: message,
            code: 200,
            data: data
          });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Delete Service
const deleteService = async (req, res) => {
  let lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    await prisma.service.delete({
      where: { id },
    });
    let message=await translate('Service deleted successfully', { to: lang });
    res.status(200).json({
            status: true,
            message: message,
            code: 200,
            data: null
          });
  } catch (error) {
    let message=await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

module.exports = {
  getAllServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
};
