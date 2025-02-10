const prisma = require('../prismaClient');

// Get All Services
const getAllServices = async (req, res) => {
  const { type } = req.query; // Get 'type' from query parameters

  try {
    const services = await prisma.service.findMany({
      where: type ? { type } : {}, // Add filter if 'type' is provided
    });
    res.status(200).json({
            status: true,
            message: 'Services retrieved successfully',
            code: 200,
            data: services
          });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};


// Create Service
const createService = async (req, res) => {
  try {
    const { name, slug, description, categoryId, type, price, duration,imageUrl } = req.body;
    if (!name || !slug || !description || !categoryId || !type || !price || !duration) {
      return res.status(400).json({ status: false, message: 'Name, slug, description, category ID, type, price, and duration are required', code: 400, data: null });
    }
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return res.status(400).json({ status: false, message: 'Category not found', code: 400, data: null });
    }
    const newService = await prisma.service.create({
      data: { name, slug, description, categoryId, type, price, duration,imageUrl },
    });
    res.status(201).json({
            status: true,
            message: 'Service created successfully',
            code: 201,
            data: newService
          });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Get Service By ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id },
    });
    if (!service) return res.status(404).json({ status: false, message: 'Service not found', code: 404, data: null });
    res.status(200).json({
            status: true,
            message: 'Service retrieved successfully',
            code: 200,
            data: service
          });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
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
    res.status(200).json({
            status: true,
            message: 'Service updated successfully',
            code: 200,
            data: updatedService
          });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Delete Service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({
      where: { id },
    });
    res.status(200).json({
            status: true,
            message: 'Service deleted successfully',
            code: 200,
            data: null
          });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

module.exports = {
  getAllServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
};
