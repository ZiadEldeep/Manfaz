const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const translate = require('translate-google');

// Get All Categories
const getAllCategories = async (req, res) => {
  const lang = req.query.lang || 'en'; 
  const type = req.query.type;
  const search = req.query.search;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;
  let where = {};
  if (type) {
    where.type = type;
  }
  if (search) {
    where.name = { contains: search, mode: Prisma.QueryMode.insensitive };
  }
  try {
    const categories = await prisma.category.findMany({
      where,
      skip,
      take: parseInt(limit),
    });

    const message = await translate('Categories retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({ 
        status: true, 
        message, 
        code: 200, 
        data: categories 
      });
      return;
    }

    // ترجمة جميع الفئات في وقت واحد
    const translatedCategories = await Promise.all(categories.map(async (category) => {
      const [
        translatedName,
        translatedSlug,
        translatedDesc,
        translatedStatus,
        translatedSubName,
        translatedInfo
      ] = await Promise.all([
        translate(category.name, { to: lang }),
        translate(category.slug, { to: lang }),
        category.description ? translate(category.description, { to: lang }) : null,
        translate(category.status, { to: lang }),
        category.subName ? translate(category.subName, { to: lang }) : null,
        category.info ? translate(category.info, { to: lang }) : null
      ]);

      return {
        ...category,
        name: translatedName,
        slug: translatedSlug,
        description: translatedDesc,
        status: translatedStatus,
        subName: translatedSubName,
        info: translatedInfo
      };
    }));

    res.status(200).json({ 
      status: true, 
      message, 
      code: 200, 
      data: translatedCategories 
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Create Category
const createCategory = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { name, slug, description, status, sortOrder, imageUrl, type, subName, info, price,subType } = req.body;

    if (!name || !slug || !description || !status || !sortOrder || !type ) {
      const message = await translate('Missing required fields', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }
    if(type === 'delivery'){
      if(!subType){
        const message = await translate('Sub type is required', { to: lang });
        return res.status(400).json({ status: false, message, code: 400, data: null });
      }
    }
    const [
      translatedName,
      translatedSlug,
      translatedDesc,
      translatedStatus,
      translatedSubName,
      translatedInfo
    ] = await Promise.all([
      translate(name, { to: "en" }),
      translate(slug, { to: "en" }),
      translate(description, { to: "en" }),
      translate(status, { to: "en" }),
      subName ? translate(subName, { to: "en" }) : null,
      info ? translate(info, { to: "en" }) : null
    ]);

    const newCategory = await prisma.category.create({
      data: {
        name: translatedName,
        slug: translatedSlug,
        description: translatedDesc,
        status: translatedStatus,
        sortOrder,
        imageUrl,
        type,
        subType,
        subName: translatedSubName,
        info: translatedInfo,
        price: price ?? 0,
      },
    });

    const message = await translate('Category created successfully', { to: lang });

    if (lang === 'en') {
      res.status(201).json({ 
        status: true, 
        message, 
        code: 201, 
        data: newCategory 
      });
      return;
    }

    // ترجمة البيانات للغة المطلوبة
    const [
      finalName,
      finalSlug,
      finalDesc,
      finalStatus,
      finalSubName,
      finalInfo
    ] = await Promise.all([
      translate(newCategory.name, { to: lang }),
      translate(newCategory.slug, { to: lang }),
      translate(newCategory.description, { to: lang }),
      translate(newCategory.status, { to: lang }),
      newCategory.subName ? translate(newCategory.subName, { to: lang }) : null,
      newCategory.info ? translate(newCategory.info, { to: lang }) : null
    ]);

    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        ...newCategory,
        name: finalName,
        slug: finalSlug,
        description: finalDesc,
        status: finalStatus,
        subName: finalSubName,
        info: finalInfo
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { name, slug, description, status, sortOrder, imageUrl, type, subName, info, price } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      const message = await translate('Category not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة الحقول المحدثة إلى الإنجليزية
    const [
      translatedName,
      translatedSlug,
      translatedDesc,
      translatedStatus,
      translatedSubName,
      translatedInfo
    ] = await Promise.all([
      name ? translate(name, { to: "en" }) : category.name,
      slug ? translate(slug, { to: "en" }) : category.slug,
      description ? translate(description, { to: "en" }) : category.description,
      status ? translate(status, { to: "en" }) : category.status,
      subName ? translate(subName, { to: "en" }) : category.subName,
      info ? translate(info, { to: "en" }) : category.info
    ]);

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: translatedName,
        slug: translatedSlug,
        description: translatedDesc,
        status: translatedStatus,
        sortOrder: sortOrder || category.sortOrder,
        imageUrl: imageUrl || category.imageUrl,
        type: type || category.type,
        subName: translatedSubName,
        info: translatedInfo,
        price: price ?? category.price,
      },
    });

    const message = await translate('Category updated successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({ 
        status: true, 
        message, 
        code: 200, 
        data: updatedCategory 
      });
      return;
    }

    // ترجمة البيانات المحدثة للغة المطلوبة
    const [
      finalName,
      finalSlug,
      finalDesc,
      finalStatus,
      finalSubName,
      finalInfo
    ] = await Promise.all([
      translate(updatedCategory.name, { to: lang }),
      translate(updatedCategory.slug, { to: lang }),
      translate(updatedCategory.description, { to: lang }),
      translate(updatedCategory.status, { to: lang }),
      updatedCategory.subName ? translate(updatedCategory.subName, { to: lang }) : null,
      updatedCategory.info ? translate(updatedCategory.info, { to: lang }) : null
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedCategory,
        name: finalName,
        slug: finalSlug,
        description: finalDesc,
        status: finalStatus,
        subName: finalSubName,
        info: finalInfo
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });

    const message = await translate('Category deleted successfully', { to: lang });
    res.status(200).json({ status: true, message, code: 200, data: null });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
