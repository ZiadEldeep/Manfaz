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

// ... باقي الدوال

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