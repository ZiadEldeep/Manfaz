const prisma = require('../prismaClient');

// Get All Categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json({
      status: true,
      message: 'Categories retrieved successfully',
      code: 200,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Create Category
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, status, sortOrder,imageUrl } = req.body;
    if (!name || !slug || !description || !status || !sortOrder) {
      return res.status(400).json({ status: false, message: 'Name, slug, description, status, and sortOrder are required', code: 400, data: null });
    }
    const newCategory = await prisma.category.create({
      data: { name, slug, description, status, sortOrder,imageUrl },
    });
    res.status(201).json({
      status: true,
      message: 'Category created successfully',
      code: 201,
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, status, sortOrder,imageUrl } = req.body;
    if (!name || !slug || !description || !status || !sortOrder) {
      return res.status(400).json({ status: false, message: 'Name, slug, description, status, and sortOrder are required', code: 400, data: null });
    }
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, slug, description, status, sortOrder,imageUrl },
    });
    res.status(200).json({
      status: true,
      message: 'Category updated successfully',
      code: 200,
      data: updatedCategory
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.delete({
      where: { id },
    });
    res.status(200).json({
      status: true,
      message: 'Category deleted successfully',
      code: 200,
      data: category
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, code: 500, data: null });
  }
};
module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
