const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const translate = require('translate-google');

// الحصول على جميع التصنيفات
const getAllCategories = async (req, res) => {
  const lang = req.query.lang || 'ar';
  const type = req.query.type;
  const search = req.query.search;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // بناء شروط البحث
    let where = {};
    if (type) {
      where.type = type;
    }
    if (search) {
      const searchTranslated = await translate(search, { to: 'en' });
      where.OR = [
        { name: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } }
      ];
    }

    // جلب التصنيفات والعدد الإجمالي
    const [categories, totalCategories] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          services: true,
          Store: true,
          WorkerCategory: {
            include: {
              worker: true
            }
          }
        }
      }),
      prisma.category.count({ where })
    ]);

    // ترجمة التصنيفات
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

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('categoriesUpdated', {
        categories: translatedCategories,
        totalCategories,
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit)
      });
    }

    const message = await translate('Categories retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        categories: translatedCategories,
        totalCategories,
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit)
      }
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    const message = await translate('Failed to retrieve categories', { to: lang });
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null
    });
  }
};

// إنشاء تصنيف جديد
const createCategory = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const {
      name,
      slug,
      description,
      status,
      sortOrder,
      imageUrl,
      type,
      subName,
      info,
      price,
      subType
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !slug || !description || !status || !sortOrder || !type) {
      const message = await translate('Missing required fields', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null
      });
    }

    // التحقق من نوع التوصيل
    if (type === 'delivery' && !subType) {
      const message = await translate('Sub type is required for delivery category', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null
      });
    }

    // ترجمة البيانات إلى الإنجليزية
    const [
      translatedName,
      translatedSlug,
      translatedDesc,
      translatedStatus,
      translatedSubName,
      translatedInfo
    ] = await Promise.all([
      translate(name, { to: 'en' }),
      translate(slug, { to: 'en' }),
      translate(description, { to: 'en' }),
      translate(status, { to: 'en' }),
      subName ? translate(subName, { to: 'en' }) : null,
      info ? translate(info, { to: 'en' }) : null
    ]);

    // إنشاء التصنيف
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
        price: price || 0
      }
    });

    // إرسال إشعار للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('newCategory', {
        ...newCategory,
        name: await translate(newCategory.name, { to: lang }),
        description: await translate(newCategory.description, { to: lang })
      });
    }

    const message = await translate('Category created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: newCategory
    });
  } catch (error) {
    console.error('Create Category Error:', error);
    const message = await translate('Failed to create category', { to: lang });
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null
    });
  }
};

// تحديث تصنيف
const updateCategory = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      status,
      sortOrder,
      imageUrl,
      type,
      subName,
      info,
      price,
      subType
    } = req.body;

    // التحقق من وجود التصنيف
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      const message = await translate('Category not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null
      });
    }

    // التحقق من نوع التوصيل
    if (type === 'delivery' && !subType) {
      const message = await translate('Sub type is required for delivery category', { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null
      });
    }

    // ترجمة البيانات المحدثة
    const [
      translatedName,
      translatedSlug,
      translatedDesc,
      translatedStatus,
      translatedSubName,
      translatedInfo
    ] = await Promise.all([
      name ? translate(name, { to: 'en' }) : category.name,
      slug ? translate(slug, { to: 'en' }) : category.slug,
      description ? translate(description, { to: 'en' }) : category.description,
      status ? translate(status, { to: 'en' }) : category.status,
      subName ? translate(subName, { to: 'en' }) : category.subName,
      info ? translate(info, { to: 'en' }) : category.info
    ]);

    // تحديث التصنيف
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
        subType: subType || category.subType,
        subName: translatedSubName,
        info: translatedInfo,
        price: price ?? category.price
      }
    });

    // إرسال إشعار بالتحديث
    if (req.io) {
      req.io.to('admin').emit('categoryUpdated', {
        ...updatedCategory,
        name: await translate(updatedCategory.name, { to: lang }),
        description: await translate(updatedCategory.description, { to: lang })
      });
    }

    const message = await translate('Category updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update Category Error:', error);
    const message = await translate('Failed to update category', { to: lang });
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null
    });
  }
};

// حذف تصنيف
const deleteCategory = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;

    // التحقق من وجود التصنيف
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      const message = await translate('Category not found', { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null
      });
    }

    // حذف التصنيف
    await prisma.category.delete({
      where: { id }
    });

    // إرسال إشعار بالحذف
    if (req.io) {
      req.io.to('admin').emit('categoryDeleted', {
        id,
        name: category.name
      });
    }

    const message = await translate('Category deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null
    });
  } catch (error) {
    console.error('Delete Category Error:', error);
    const message = await translate('Failed to delete category', { to: lang });
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null
    });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
