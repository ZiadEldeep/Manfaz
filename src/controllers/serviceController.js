const prisma = require('../prismaClient');

// Get All Services
const getAllServices = async (req, res) => {
  const { type } = req.query; // Get 'type' from query parameters

  try {
    const services = await prisma.service.findMany({
      where: type ? { type } : {}, // Add filter if 'type' is provided
    });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Create Service
const createService = async (req, res) => {
  try {
    const { name, slug, description, categoryId, type, price, duration,imageUrl } = req.body;
    if (!name || !slug || !description || !categoryId || !type || !price || !duration) {
      return res.status(400).json({ error: 'Name, slug, description, category ID, type, price, and duration are required' });
    }
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }
    const newService = await prisma.service.create({
      data: { name, slug, description, categoryId, type, price, duration,imageUrl },
    });
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Service By ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id },
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await prisma.service.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
};
