const prisma = require('../prismaClient');

// Get All Categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Category
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, status, sortOrder,imageUrl } = req.body;
    if (!name || !slug || !description || !status || !sortOrder) {
      return res.status(400).json({ error: 'Name, slug, description, status, and sortOrder are required' });
    }
    const newCategory = await prisma.category.create({
      data: { name, slug, description, status, sortOrder,imageUrl },
    });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllCategories, createCategory };
