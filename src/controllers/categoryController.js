const prisma = require('../prismaClient');
const translate = require('translate-google');

// Get All Categories
const getAllCategories = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  const type = req.query.type; // Added type query parameter
  try {
    const categories = await prisma.category.findMany({
      where: type ? { type } : {}, // Filter categories by type if provided
    });

    let message = await translate('Categories retrieved successfully', { to: lang });
    let categoriesData = [];

    for (let i = 0; i < categories.length; i++) {
      if (lang == 'en') {
        categoriesData.push(categories[i]);
      } else {
        categoriesData.push({
          ...categories[i],
          name: await translate(categories[i].name, { to: lang }),
          slug: await translate(categories[i].slug, { to: lang }),
          description: await translate(categories[i].description, { to: lang }),
          status: await translate(categories[i].status, { to: lang }),
        });
      }
    }

    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: categoriesData
    });
  } catch (error) {
    let message = await translate(`Internal server error ${error.message}`, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Create Category
const createCategory = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { name, slug, description, status, sortOrder, imageUrl, type } = req.body;

    // Validate required fields, including the type
    if (!name || !slug || !description || !status || !sortOrder || !type) {
      let message = await translate('Name, slug, description, status, sortOrder, and type are required', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }

    // Translate to English
    let translateName = await translate(name, { to: "en" });
    let translateSlug = await translate(slug, { to: "en" });
    let translateDescription = await translate(description, { to: "en" });
    let translateStatus = await translate(status, { to: "en" });

    // Create category with type
    const newCategory = await prisma.category.create({
      data: { 
        name: translateName, 
        slug: translateSlug, 
        description: translateDescription, 
        status: translateStatus, 
        sortOrder, 
        imageUrl, 
        type // Include the type field
      },
    });

    // Translate success message
    let message = await translate('Category created successfully', { to: lang });

    // Format response based on language
    let categoryData = lang == 'en' ? newCategory : {
      ...newCategory,
      name: await translate(newCategory.name, { to: lang }),
      slug: await translate(newCategory.slug, { to: lang }),
      description: await translate(newCategory.description, { to: lang }),
      status: await translate(newCategory.status, { to: lang }),
    };

    // Send response
    res.status(201).json({
      status: true,
      message: message,
      code: 201,
      data: categoryData
    });

  } catch (error) {
    let message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { id } = req.params;
    const { name, slug, description, status, sortOrder, imageUrl, type } = req.body;

    if (!name || !slug || !description || !status || !sortOrder || !type) {
      let message = await translate('Name, slug, description, status, sortOrder, and type are required', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }

    if (!id) {
      let message = await translate('id is required', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      let message = await translate('Category not found', { to: lang });
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
    }

    let translateName = await translate(name, { to: "en" });
    let translateSlug = await translate(slug, { to: "en" });
    let translateDescription = await translate(description, { to: "en" });
    let translateStatus = await translate(status, { to: "en" });

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { 
        name: translateName, 
        slug: translateSlug, 
        description: translateDescription, 
        status: translateStatus, 
        sortOrder, 
        imageUrl, 
        type // Include the type field
      },
    });

    let message = await translate('Category updated successfully', { to: lang });

    let categoryData = lang == 'en' ? updatedCategory : {
      ...updatedCategory,
      name: await translate(updatedCategory.name, { to: lang }),
      slug: await translate(updatedCategory.slug, { to: lang }),
      description: await translate(updatedCategory.description, { to: lang }),
      status: await translate(updatedCategory.status, { to: lang }),
    };

    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: categoryData
    });

  } catch (error) {
    let message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { id } = req.params;
    const category = await prisma.category.delete({
      where: { id },
    });
    let message = await translate('Category deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: null
    });
  } catch (error) {
    let message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
