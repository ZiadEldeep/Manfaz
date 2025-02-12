const prisma = require('../prismaClient');
const translate = require('translate-google');

// Get All Categories
const getAllCategories = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  const type = req.query.type;

  try {
    const categories = await prisma.category.findMany({
      where: type ? { type } : {},
    });

    let message = await translate('Categories retrieved successfully', { to: lang });
    let categoriesData = [];

    for (let category of categories) {
      if (lang === 'en') {
        categoriesData.push(category);
      } else {
        categoriesData.push({
          ...category,
          name: await translate(category.name, { to: lang }),
          slug: await translate(category.slug, { to: lang }),
          description: await translate(category.description, { to: lang }),
          status: await translate(category.status, { to: lang }),
          subName: category.subName ? await translate(category.subName, { to: lang }) : null,
          info: category.info ? await translate(category.info, { to: lang }) : null,
          price: category.price,
        });
      }
    }

    res.status(200).json({ status: true, message, code: 200, data: categoriesData });
  } catch (error) {
    let message = await translate(`Internal server error: ${error.message}`, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Create Category
const createCategory = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { name, slug, description, status, sortOrder, imageUrl, type, subName, info, price } = req.body;

    if (!name || !slug || !description || !status || !sortOrder || !type) {
      let message = await translate('Missing required fields', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const newCategory = await prisma.category.create({
      data: { 
        name: await translate(name, { to: "en" }), 
        slug: await translate(slug, { to: "en" }), 
        description: await translate(description, { to: "en" }), 
        status: await translate(status, { to: "en" }), 
        sortOrder, 
        imageUrl, 
        type,
        subName: subName ? await translate(subName, { to: "en" }) : null,
        info: info ? await translate(info, { to: "en" }) : null,
        price: price ?? 0,
      },
    });

    let message = await translate('Category created successfully', { to: lang });

    res.status(201).json({ status: true, message, code: 201, data: newCategory });

  } catch (error) {
    let message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { id } = req.params;
    const { name, slug, description, status, sortOrder, imageUrl, type, subName, info, price } = req.body;

    if (!id) {
      let message = await translate('ID is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      let message = await translate('Category not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { 
        name: await translate(name, { to: "en" }), 
        slug: await translate(slug, { to: "en" }), 
        description: await translate(description, { to: "en" }), 
        status: await translate(status, { to: "en" }), 
        sortOrder, 
        imageUrl, 
        type,
        subName: subName ? await translate(subName, { to: "en" }) : null,
        info: info ? await translate(info, { to: "en" }) : null,
        price: price ?? 0,
      },
    });

    let message = await translate('Category updated successfully', { to: lang });

    res.status(200).json({ status: true, message, code: 200, data: updatedCategory });

  } catch (error) {
    let message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });

    let message = await translate('Category deleted successfully', { to: lang });
    res.status(200).json({ status: true, message, code: 200, data: null });

  } catch (error) {
    let message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
