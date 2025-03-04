const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const  translate  = require('translate-google');

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
      deliveryFee,
      locations,
      categoryId
    } = req.body;

    if (!name || !type || !address || !categoryId) {
      const message = await translate('Name, type and address and category Id are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }
    let category=await prisma.category.findUnique({where:{id:categoryId}});
    if(!category){
      const message = await translate('Category not found', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }
    let {translateName,translateDescription,translateType,translateAddress} =  await Promise.all([translate(name,{to:"en"}),translate(description,{to:"en"}),translate(type,{to:"en"}),translate(address,{to:"en"})]);
    const store = await prisma.store.create({
      data: {
        name:translateName,
        description:translateDescription,
        type:translateType,
        logo,
        coverImage,
        images,
        address:translateAddress,
        phone,
        email,
        workingHours,
        locations,
        workingHours,
        minOrderAmount,
        categoryId,
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
    // ترجمة البيانات باستخدام Promise.all
    let [translateName, translateDescription] = await Promise.all([
      translate(name, {to: 'en'}),
      description ? translate(description, {to: 'en'}) : Promise.resolve(null)
    ]);

    // ترجمة المكونات إذا كانت موجودة
    let translateIngredients = [];
    if (ingredients && ingredients.length > 0) {
      translateIngredients = await Promise.all(
        ingredients.map(ingredient => translate(ingredient, {to: 'en'}))
      );
    }

    // ترجمة الإضافات إذا كانت موجودة
    let translateExtras = {...extras};
    if (extras) {
      if (extras.sizes) {
        translateExtras.sizes = await Promise.all(
          extras.sizes.map(size => translate(size, {to: 'en'}))
        );
      }
      
      if (extras.additions) {
        translateExtras.additions = await Promise.all(
          extras.additions.map(async addition => ({
            name: await translate(addition.name, {to: 'en'}),
            price: addition.price
          }))
        );
      }
    }
    const product = await prisma.product.create({
      data: {
        name:translateName,
        description:translateDescription,
        price,
        salePrice,
        images,
        storeId,
        categoryId,
        ingredients:translateIngredients,
        extras:translateExtras
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
    let {translateName,translateDescription,translateType} = await translate([name,description,type],{to:"en"});
    const offer = await prisma.storeOffer.create({
      data: {
        name:translateName,
        description:translateDescription,
        type:translateType,
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
    let {translateName,translateDescription,translateType,translateAddress} = await translate([updateData.name,updateData.description,updateData.type,updateData.address],{to:"en"});
    const store = await prisma.store.update({
      where: { id },
      data: {
        ...updateData,
        name:translateName,
        description:translateDescription,
        type:translateType,
        address:translateAddress,    
      }
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
    let {translateName,translateDescription} = await translate([name,description],{to:"en"});
    const category = await prisma.storeCategory.create({
      data: {
        name:translateName,
        description:translateDescription,
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

// الحصول على خصومات المتجر
const getStoreDiscounts = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    
    const discounts = await prisma.discount.findMany({
      where: {
        storeId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    const message = await translate('Discounts retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: discounts
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء خصم جديد
const createDiscount = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const {
      name,
      description,
      type,
      value,
      startDate,
      endDate,
      minOrderAmount,
      maxDiscountAmount,
      applicableProducts,
      applicableCategories
    } = req.body;

    if (!name || !type || !value || !startDate || !endDate) {
      const message = await translate('Missing required fields', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const discount = await prisma.discount.create({
      data: {
        storeId,
        name,
        description,
        type,
        value,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minOrderAmount,
        maxDiscountAmount,
        applicableProducts,
        applicableCategories
      }
    });

    const message = await translate('Discount created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: discount
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
// تحديث الخصم
const updateDiscount = async (req, res) => {
  const { storeId, id } = req.params;
  const { lang = 'ar' } = req.query;
  
  try {
    const discount = await prisma.discount.update({
      where: {
        id: parseInt(id),
        storeId: parseInt(storeId)
      },
      data: {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        value: req.body.value,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        minOrderAmount: req.body.minOrderAmount,
        maxDiscountAmount: req.body.maxDiscountAmount,
        applicableProducts: req.body.applicableProducts,
        applicableCategories: req.body.applicableCategories
      }
    });

    const message = await translate('Discount updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: discount
    });

  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// حذف الخصم
const deleteDiscount = async (req, res) => {
  const { storeId, id } = req.params;
  const { lang = 'ar' } = req.query;

  try {
    await prisma.discount.delete({
      where: {
        id: parseInt(id),
        storeId: parseInt(storeId)
      }
    });

    const message = await translate('Discount deleted successfully', { to: lang });
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

// الحصول على كوبونات المتجر
const getStoreCoupons = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    
    const coupons = await prisma.coupon.findMany({
      where: {
        storeId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    const message = await translate('Coupons retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: coupons
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء كوبون جديد
const createCoupon = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const {
      code,
      name,
      description,
      type,
      value,
      startDate,
      endDate,
      maxUses,
      minOrderAmount,
      maxDiscountAmount,
      applicableProducts,
      applicableCategories
    } = req.body;

    if (!code || !name || !type || !value || !startDate || !endDate) {
      const message = await translate('Missing required fields', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // التحقق من عدم وجود كوبون بنفس الكود
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      const message = await translate('Coupon code already exists', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const coupon = await prisma.coupon.create({
      data: {
        storeId,
        code,
        name,
        description,
        type,
        value,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxUses,
        minOrderAmount,
        maxDiscountAmount,
        applicableProducts,
        applicableCategories
      }
    });

    const message = await translate('Coupon created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: coupon
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// التحقق من صلاحية الكوبون
const validateCoupon = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const { code, orderAmount, products, categories } = req.body;

    const coupon = await prisma.coupon.findFirst({
      where: {
        code,
        storeId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    if (!coupon) {
      const message = await translate('Invalid coupon code', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // التحقق من عدد مرات الاستخدام
    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
      const message = await translate('Coupon has reached maximum usage limit', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // التحقق من الحد الأدنى للطلب
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      const message = await translate('Order amount is less than minimum required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // حساب قيمة الخصم
    let discountAmount = coupon.type === 'PERCENTAGE' 
      ? (orderAmount * coupon.value / 100)
      : coupon.value;

    // تطبيق الحد الأقصى للخصم إذا وجد
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    const message = await translate('Coupon is valid', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        coupon,
        discountAmount,
        finalAmount: orderAmount - discountAmount
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// تحديث الكوبون
const updateCoupon = async (req, res) => {
  const { storeId, id } = req.params;
  const { lang = 'ar' } = req.query;
  
  try {
    const coupon = await prisma.coupon.update({
      where: {
        id: parseInt(id),
        storeId: parseInt(storeId)
      },
      data: {
        code: req.body.code,
        type: req.body.type,
        value: req.body.value,
        maxUses: req.body.maxUses,
        minOrderAmount: req.body.minOrderAmount,
        maxDiscountAmount: req.body.maxDiscountAmount,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        isActive: req.body.isActive
      }
    });

    const message = await translate('Coupon updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: coupon
    });

  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// حذف الكوبون
const deleteCoupon = async (req, res) => {
  const { storeId, id } = req.params;
  const { lang = 'ar' } = req.query;

  try {
    await prisma.coupon.delete({
      where: {
        id: parseInt(id),
        storeId: parseInt(storeId)
      }
    });

    const message = await translate('Coupon deleted successfully', { to: lang });
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
  createStoreLocation,
  getStoreDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getStoreCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
}; 