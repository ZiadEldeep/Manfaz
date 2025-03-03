const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { translate } = require('translate-google');

// الحصول على جميع المتاجر
const getAllStores = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const stores = await prisma.store.findMany({
      include: {
        categories: true,
        locations: true,
      }
    });

    const message = await translate('Stores retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: stores
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء متجر جديد
const createStore = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const {
      name,
      description,
      type,
      logo,
      coverImage,
      images,
      address,
      phone,
      email,
      workingHours,
      minOrderAmount,
      deliveryFee
    } = req.body;

    if (!name || !type || !address) {
      const message = await translate('Name, type and address are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const store = await prisma.store.create({
      data: {
        name,
        description,
        type,
        logo,
        coverImage,
        images,
        address,
        phone,
        email,
        workingHours,
        minOrderAmount,
        deliveryFee
      }
    });

    const message = await translate('Store created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: store
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إضافة منتج جديد للمتجر
const createStoreProduct = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const {
      name,
      description,
      price,
      salePrice,
      images,
      categoryId,
      ingredients,
      extras
    } = req.body;

    if (!name || !price || !categoryId) {
      const message = await translate('Name, price and category are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        salePrice,
        images,
        storeId,
        categoryId,
        ingredients,
        extras
      }
    });

    const message = await translate('Product created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: product
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إضافة عرض جديد للمتجر
const createStoreOffer = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const {
      name,
      description,
      type,
      image,
      startDate,
      endDate,
      discount
    } = req.body;

    if (!name || !type) {
      const message = await translate('Name and type are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const offer = await prisma.storeOffer.create({
      data: {
        name,
        description,
        type,
        image,
        startDate,
        endDate,
        discount,
        storeId
      }
    });

    const message = await translate('Offer created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: offer
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على متجر محدد
const getStoreById = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;
    
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        categories: true,
        products: true,
        offers: true,
        locations: true
      }
    });

    if (!store) {
      const message = await translate('Store not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const message = await translate('Store retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: store
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// تحديث بيانات متجر
const updateStore = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;
    const updateData = req.body;

    const store = await prisma.store.update({
      where: { id },
      data: updateData
    });

    const message = await translate('Store updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: store
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// حذف متجر
const deleteStore = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;

    await prisma.store.delete({
      where: { id }
    });

    const message = await translate('Store deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على تصنيفات المتجر
const getStoreCategories = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;

    const categories = await prisma.storeCategory.findMany({
      where: { storeId },
      include: {
        products: true
      }
    });

    const message = await translate('Categories retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: categories
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء تصنيف جديد
const createStoreCategory = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const { name, description, image, sortOrder } = req.body;

    if (!name) {
      const message = await translate('Category name is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const category = await prisma.storeCategory.create({
      data: {
        name,
        description,
        image,
        sortOrder,
        storeId
      }
    });

    const message = await translate('Category created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: category
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على منتجات المتجر
const getStoreProducts = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const { categoryId, search } = req.query;

    const where = {
      storeId,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      }
    });

    const message = await translate('Products retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: products
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على عروض المتجر
const getStoreOffers = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const { type, active } = req.query;

    const where = {
      storeId,
      ...(type && { type }),
      ...(active && { isActive: active === 'true' })
    };

    const offers = await prisma.storeOffer.findMany({ where });

    const message = await translate('Offers retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: offers
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على فروع المتجر
const getStoreLocations = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;

    const locations = await prisma.storeLocation.findMany({
      where: { storeId }
    });

    const message = await translate('Locations retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: locations
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء فرع جديد
const createStoreLocation = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const { name, address, latitude, longitude, phone, workingHours } = req.body;

    if (!name || !address) {
      const message = await translate('Location name and address are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const location = await prisma.storeLocation.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        phone,
        workingHours,
        storeId
      }
    });

    const message = await translate('Location created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: location
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

module.exports = {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getStoreCategories,
  createStoreCategory,
  getStoreProducts,
  createStoreProduct,
  getStoreOffers,
  createStoreOffer,
  getStoreLocations,
  createStoreLocation
}; 