const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const translate = require('../translate');

// الحصول على جميع المتاجر
const getAllStores = async (req, res) => {
  const lang = req.query.lang || 'ar';
  let limit = parseInt(req.query.limit) || 10;
  let page = parseInt(req.query.page) || 1;
  let offset = (page - 1) * limit;
  let search = req.query.search || '';
  let categoryId = req.query.categoryId || '';
  let filter = req.query.filter || '';
  let longitude = parseFloat(req.query.longitude);
  let latitude = parseFloat(req.query.latitude);
  let maxDistance = 10; // 10 كيلومتر

  try {
    let searchTranslated = search ? await translate(search, { to: 'en' }) : '';
    let searchQuery = search ? {
      AND: [{
        OR: [
          { name: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } },
          { type: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } },
          { address: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } }
        ]
      },
      filter.length > 0 ? {
        categories: {
          some: { id: filter }
        }
      } : {}
      ]
    } : filter.length > 0 ? {
      categories: {
        some: { id: filter }
      }
    } : {};

    // فلترة حسب المسافة إذا تم توفير الإحداثيات
    // if (longitude && latitude) {
    //   const stores = await prisma.store.findMany({
    //     where: categoryId ? { ...searchQuery, categoryId } : searchQuery,
    //     include: {
    //       category: true,
    //       locations: true,
    //       workingHours: true
    //     }
    //   });

    //   // حساب المسافة لكل متجر
    //   const storesWithDistance = stores.filter(store => {
    //     if (!store.locations || store.locations.length === 0) return false;

    //     // حساب المسافة لكل موقع من مواقع المتجر
    //     const distances = store.locations.map(location => {
    //       const R = 6371; // نصف قطر الأرض بالكيلومتر
    //       const dLat = (location.latitude - latitude) * Math.PI / 180;
    //       const dLon = (location.longitude - longitude) * Math.PI / 180;
    //       const a =
    //         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //         Math.cos(latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) *
    //         Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //       const distance = R * c;
    //       return distance;
    //     });

    //     // إرجاع المتجر إذا كان أي من مواقعه ضمن المسافة المطلوبة
    //     return Math.min(...distances) <= maxDistance;
    //   });

    //   // تطبيق التقسيم إلى صفحات
    //   const paginatedStores = storesWithDistance.slice(offset, offset + limit);

    //   // ترجمة بيانات المتاجر
    //   const translatedStores = await Promise.all(paginatedStores.map(async (store) => {
    //     const [
    //       translatedName,
    //       translatedDescription,
    //       translatedType,
    //       translatedAddress,
    //       translatedCategoryName
    //     ] = await Promise.all([
    //       translate(store.name, { to: lang }),
    //       store.description ? translate(store.description, { to: lang }) : null,
    //       translate(store.type, { to: lang }),
    //       translate(store.address, { to: lang }),
    //       store.category ? translate(store.category.name, { to: lang }) : null
    //     ]);

    //     return {
    //       ...store,
    //       name: translatedName,
    //       description: translatedDescription,
    //       type: translatedType,
    //       address: translatedAddress,
    //       category: store.category ? {
    //         ...store.category,
    //         name: translatedCategoryName
    //       } : null
    //     };
    //   }));

    //   const message = await translate('Stores retrieved successfully', { to: lang });
    //   res.status(200).json({
    //     status: true,
    //     message,
    //     code: 200,
    //     data: {
    //       stores: translatedStores,
    //       totalStores: storesWithDistance.length,
    //       currentPage: page,
    //       totalPages: Math.ceil(storesWithDistance.length / limit)
    //     }
    //   });
    //   return;
    // }

    const [stores, totalStores] = await Promise.all([
      prisma.store.findMany({
        where: categoryId ? { ...searchQuery, categoryId } : searchQuery,
        include: {
          category: true,
          locations: true,
          workingHours: true
        },
        skip: offset,
        take: limit
      }),
      prisma.store.count({
        where: categoryId ? { ...searchQuery, categoryId } : searchQuery
      })
    ]);

    // ترجمة بيانات المتاجر
    const translatedStores = await Promise.all(stores.map(async (store) => {
      const [
        translatedName,
        translatedDescription,
        translatedType,
        translatedAddress,
        translatedCategoryName
      ] = await Promise.all([
        translate(store.name, { to: lang }),
        store.description ? translate(store.description, { to: lang }) : null,
        translate(store.type, { to: lang }),
        translate(store.address, { to: lang }),
        store.category ? translate(store.category.name, { to: lang }) : null
      ]);

      return {
        ...store,
        name: translatedName,
        description: translatedDescription,
        type: translatedType,
        address: translatedAddress,
        category: store.category ? {
          ...store.category,
          name: translatedCategoryName
        } : null
      };
    }));

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('storesUpdated', {
        stores: translatedStores,
        totalStores,
        currentPage: page,
        totalPages: Math.ceil(totalStores / limit)
      });
    }

    const message = await translate('Stores retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        stores: translatedStores,
        totalStores,
        currentPage: page,
        totalPages: Math.ceil(totalStores / limit)
      }
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
      minOrderAmount,
      deliveryFee,
      categoryId,
      priceDriver,
      workingHours
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !type || !address || !categoryId) {
      const message = await translate('Name, type, address and category ID are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // التحقق من وجود التصنيف
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      const message = await translate('Category not found', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // ترجمة البيانات إلى الإنجليزية
    const [translatedName, translatedDescription, translatedType, translatedAddress] = await Promise.all([
      translate(name, { to: 'en' }),
      description ? translate(description, { to: 'en' }) : null,
      translate(type, { to: 'en' }),
      translate(address, { to: 'en' })
    ]);

    // إنشاء المتجر مع ساعات العمل
    const store = await prisma.store.create({
      data: {
        name: translatedName,
        description: translatedDescription,
        type: translatedType,
        logo,
        coverImage,
        images,
        address: translatedAddress,
        phone,
        email,
        minOrderAmount,
        categoryId,
        deliveryFee,
        priceDriver,
        workingHours: {
          create: workingHours || [
            {
              dayOfWeek: 0,
              isOpen: true,
              openTime: '09:00',
              closeTime: '22:00'
            }
          ]
        }
      },
      include: {
        category: true,
        workingHours: true
      }
    });

    // إرسال إشعار للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('newStore', {
        ...store,
        name: await translate(store.name, { to: lang }),
        description: store.description ? await translate(store.description, { to: lang }) : null
      });
    }

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
      extras,
      stock,
      rating
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !price || !categoryId) {
      const message = await translate('Name, price and category are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // ترجمة البيانات
    const [translatedName, translatedDescription] = await Promise.all([
      translate(name, { to: 'en' }),
      description ? translate(description, { to: 'en' }) : null
    ]);

    // ترجمة المكونات
    const translatedIngredients = ingredients ?
      await Promise.all(ingredients.map(ingredient => translate(ingredient, { to: 'en' }))) :
      [];

    // ترجمة الإضافات
    let translatedExtras = { ...extras };
    if (extras) {
      if (extras.sizes) {
        translatedExtras.sizes = await Promise.all(
          extras.sizes.map(size => translate(size, { to: 'en' }))
        );
      }
      if (extras.additions) {
        translatedExtras.additions = await Promise.all(
          extras.additions.map(async addition => ({
            name: await translate(addition.name, { to: 'en' }),
            price: addition.price
          }))
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        name: translatedName,
        description: translatedDescription,
        price,
        salePrice,
        images,
        storeId,
        categoryId,
        rating: rating || 3.0,
        ingredients: translatedIngredients,
        extras: translatedExtras,
        stock: stock || 0,
        isAvailable: true
      },
      include: {
        category: true,
        store: true
      }
    });

    // إرسال إشعارات
    if (req.io) {
      // إشعار للمتجر
      req.io.to(`store_${storeId}`).emit('newProduct', {
        ...product,
        name: await translate(product.name, { to: lang }),
        description: product.description ? await translate(product.description, { to: lang }) : null
      });

      // إشعار للوحة التحكم
      req.io.to('admin').emit('newStoreProduct', {
        storeId,
        product: {
          ...product,
          name: await translate(product.name, { to: lang }),
          description: product.description ? await translate(product.description, { to: lang }) : null
        }
      });
    }

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
const getStoreProductById = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: {
        id
      },
      include: {
        category: true,
        store: true
      }
    });
    if (!product) {
      const message = await translate('Product not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    if (lang === "en") {
      return res.status(200).json({
        status: true,
        message: 'Product found successfully',
        code: 200,
        data: product
      });
    }
    // ترجمة البيانات
    const [translatedName, translatedDescription] = await Promise.all([
      translate(product.name, { to: lang }),
      product.description ? translate(product.description, { to: lang }) : null
    ]);

    // ترجمة المكونات
    const translatedIngredients = product.ingredients ?
      await Promise.all(product.ingredients.map(ingredient => translate(ingredient, { to: lang }))) :
      [];

    // ترجمة الإضافات
    if (product.extras) {
      if (product.extras.sizes) {
        product.extras.sizes = await Promise.all(
          product.extras.sizes.map(size => translate(size, { to: lang }))
        );
      }
      if (product.extras.additions) {
        product.extras.additions = await Promise.all(
          product.extras.additions.map(async addition => ({
            name: await translate(addition.name, { to: lang }),
            price: addition.price
          }))
        );
      }
    }
    const message = await translate('Product retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...product,
        name: translatedName,
        description: translatedDescription,
        ingredients: translatedIngredients,
        extras: product.extras
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
}
// تعديل منتج في المتجر
const updateStoreProduct = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId, id } = req.params;
    const {
      name,
      description,
      type,
      image,
      startDate,
      endDate,
      discount,
      rating,
      applicableProducts
    } = req.body;
    // التحقق من البيانات المطلوبة  
    const product = await prisma.product.findUnique({
      where: {
        id
      }
    });
    if (!product) {
      const message = await translate('Product not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    const store = await prisma.store.findUnique({
      where: {
        id: storeId
      }
    });
    if (!store) {
      const message = await translate('Store not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    const updatedProduct = await prisma.product.update({
      where: {
        id
      },
      data: {
        name,
        description,
        type,
        image,
        startDate,
        endDate,
        discount,
        applicableProducts,
        rating
      }
    });
    const message = await translate('Product updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedProduct
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
      discount,
      applicableProducts
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !type || !discount) {
      const message = await translate('Name, type and discount are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }
    let store = await prisma.store.findUnique({
      where: {
        id: storeId
      }
    });
    if (!store) {
      const message = await translate('Store not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    let products = await prisma.product.findMany({
      where: {
        id: {
          in: applicableProducts
        }
      }
    });
    if (products.length !== applicableProducts.length) {
      const message = await translate('Products not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    let [translateName, translateDescription, translateType] = await Promise.all([translate(name, { to: "en" }), translate(description, { to: "en" }), translate(type, { to: "en" })]);
    const offer = await prisma.storeOffer.create({
      data: {
        name: translateName,
        description: translateDescription,
        type: translateType,
        image,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        discount,
        products: {
          create: products.map(product => ({
            productId: product.id
          }))
        },
        storeId: store.id
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
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        categories: true,
        products: true,
        offers: true,
        locations: true,
        workingHours: true,
        Coupon: true,
        category: true,
        Discount: true,
        GiftCard: true,
        Reward: true,
        OrdersStore: true
      }
    });

    if (!store) {
      const message = await translate('Store not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    if (lang === "en") {
      return res.status(200).json({
        status: true,
        message: 'Store retrieved successfully',
        code: 200,
        data: store
      })
    }
    let [translatedName, translatedDescription, translatedType, translatedAddress, message] = await Promise.all([
      translate(store.name, { to: lang }),
      translate(store.description, { to: lang }),
      translate(store.type, { to: lang }),
      translate(store.address, { to: lang }),
      translate('Store retrieved successfully', { to: lang })
    ]);

    return res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...store,
        name: translatedName,
        description: translatedDescription,
        type: translatedType,
        address: translatedAddress
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// تحديث بيانات متجر
const updateStore = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const updateData = req.body;
    let [translateName, translateDescription, translateType, translateAddress] = await Promise.all([translate(updateData.name, { to: "en" }), translate(updateData.description, { to: "en" }), translate(updateData.type, { to: "en" }), translate(updateData.address, { to: "en" })]);
    const store = await prisma.store.update({
      where: { id },
      data: {
        ...updateData,
        name: translateName,
        description: translateDescription,
        type: translateType,
        address: translateAddress,
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
  const lang = req.query.lang || 'en';
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
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;

    const categories = await prisma.storeCategory.findMany({
      where: { storeId },
      include: {
        products: true
      }
    });
    let [translatedCategories, message] = await Promise.all([
      Promise.all(categories.map(async (category) => {
        let [translatedName, translatedDescription] = await Promise.all([
          translate(category.name, { to: lang }),
          translate(category.description, { to: lang })
        ]);
        return {
          ...category,
          name: translatedName,
          description: translatedDescription
        };
      })),
      translate('Categories retrieved successfully', { to: lang })
    ]);
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedCategories
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
const getAllStoreCategories = async (req, res) => {
  const lang = req.query.lang || 'en';
  let limit = req.query.limit || 10;
  let page = req.query.page || 1;
  let offset = (page - 1) * limit;
  let search = req.query.search || '';
  let categoryId = req.query.categoryId || '';
  let longitude = parseFloat(req.query.longitude);
  let latitude = parseFloat(req.query.latitude);
  let maxDistance = 10; // 10 كيلومتر

  try {
    let searchTranslated = search ? await translate(search, { to: lang }) : '';
    let searchQuery = search ? { OR: [{ name: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } }, { description: { contains: searchTranslated, mode: Prisma.QueryMode.insensitive } }] } : {};

    // فلترة حسب المسافة إذا تم توفير الإحداثيات
    if (longitude && latitude) {
      const stores = await prisma.store.findMany({
        where: {
          ...searchQuery,
          ...(categoryId && categoryId !== "undefined" ? {
            categoryId
          } : {})
        },
        include: {
          locations: true
        }
      });

      // حساب المسافة لكل متجر
      const storesWithDistance = stores.filter(store => {
        if (!store.locations || store.locations.length === 0) return false;

        // حساب المسافة لكل موقع من مواقع المتجر
        const distances = store.locations.map(location => {
          const R = 6371; // نصف قطر الأرض بالكيلومتر
          const dLat = (location.latitude - latitude) * Math.PI / 180;
          const dLon = (location.longitude - longitude) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          return distance;
        });

        // إرجاع المتجر إذا كان أي من مواقعه ضمن المسافة المطلوبة
        return Math.min(...distances) <= maxDistance;
      });

      // الحصول على تصنيفات المتاجر التي تقع ضمن المسافة المطلوبة
      const storeIds = storesWithDistance.map(store => store.id);
      const categories = await prisma.storeCategory.findMany({
        where: {
          storeId: {
            in: storeIds
          }
        },
        skip: offset,
        take: +limit
      });

      let [translatedCategories, message] = await Promise.all([
        Promise.all(categories.map(async (category) => {
          let [translatedName, translatedDescription] = await Promise.all([
            translate(category.name, { to: lang }),
            translate(category.description, { to: lang })
          ]);
          return {
            ...category,
            name: translatedName,
            description: translatedDescription
          };
        })),
        translate('Categories retrieved successfully', { to: lang })
      ]);

      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: translatedCategories
      });
      return;
    }

    // ... existing code ...
  } catch (error) {
    console.log(error);
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء تصنيف جديد
const createStoreCategory = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;
    const { name, description, image, sortOrder } = req.body;

    if (!name) {
      const message = await translate('Category name is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }
    let [translateName, translateDescription] = await Promise.all([translate(name, { to: "en" }), translate(description, { to: "en" })]);
    const category = await prisma.storeCategory.create({
      data: {
        name: translateName,
        description: translateDescription,
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
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;
    const { categoryId, search } = req.query;
    let limit = req.query.limit || 10;
    let page = req.query.page || 1;
    let offset = (page - 1) * limit;

    const where = {
      storeId,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } }
        ]
      })
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      },
      skip: offset,
      take: +limit
    });
    let [translatedProducts, message] = await Promise.all([
      Promise.all(products.map(async (product) => {
        let [translatedName, translatedDescription, translatedIngredients, translatedSizes, translatedAdditions] = await Promise.all([
          translate(product.name, { to: lang }),
          translate(product.description, { to: lang }),
          Promise.all(product.ingredients.map(async (ingredient) => translate(ingredient, { to: lang }))),
          Promise.all(product.extras.sizes.map(async (size) => translate(size, { to: lang }))),
          Promise.all(product.extras.additions.map(async (addition) => translate(addition.name, { to: lang })))
        ]);
        return {
          ...product,
          name: translatedName,
          description: translatedDescription,
          ingredients: translatedIngredients,
          extras: {
            sizes: translatedSizes,
            additions: translatedAdditions
          }
        };
      })),
      translate('Products retrieved successfully', { to: lang })
    ]);
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedProducts
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على عروض المتجر
const getStoreOffers = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;
    const { type, active, longitude, latitude } = req.query;
    let maxDistance = 10; // 10 كيلومتر

    // فلترة حسب المسافة إذا تم توفير الإحداثيات
    if (longitude && latitude) {
      longitude = parseFloat(longitude);
      latitude = parseFloat(latitude);

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          locations: true
        }
      });

      if (!store) {
        const message = await translate('Store not found', { to: lang });
        return res.status(404).json({ status: false, message, code: 404, data: null });
      }

      // حساب المسافة لكل موقع من مواقع المتجر
      const distances = store.locations.map(location => {
        const R = 6371; // نصف قطر الأرض بالكيلومتر
        const dLat = (location.latitude - latitude) * Math.PI / 180;
        const dLon = (location.longitude - longitude) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
      });

      // التحقق من أن المتجر يقع ضمن المسافة المطلوبة
      if (Math.min(...distances) > maxDistance) {
        const message = await translate('No offers found within the specified distance', { to: lang });
        return res.status(200).json({ status: true, message, code: 200, data: [] });
      }
    }

    const where = {
      storeId,
      ...(type && { type }),
      ...(active && { isActive: active === 'true' })
    };

    const offers = await prisma.storeOffer.findMany({ where });
    let [translatedOffers, message] = await Promise.all([
      Promise.all(offers.map(async (offer) => {
        let [translatedName, translatedDescription] = await Promise.all([
          translate(offer.name, { to: lang }),
          translate(offer.description, { to: lang })
        ]);
        return {
          ...offer,
          name: translatedName,
          description: translatedDescription
        };
      })),
      translate('Offers retrieved successfully', { to: lang })
    ]);
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedOffers
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على فروع المتجر
const getStoreLocations = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;

    const locations = await prisma.storeLocation.findMany({
      where: { storeId }
    });
    let [translatedLocations, message] = await Promise.all([
      Promise.all(locations.map(async (location) => {
        let [translatedName, translatedAddress] = await Promise.all([
          translate(location.name, { to: lang }),
          translate(location.address, { to: lang })
        ]);
        return {
          ...location,
          name: translatedName,
          address: translatedAddress
        };
      })),
      translate('Locations retrieved successfully', { to: lang })
    ]);
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedLocations
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء فرع جديد
const createStoreLocation = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { storeId } = req.params;
    const { name, address, latitude, longitude, phone, workingHours } = req.body;

    if (!name || !address) {
      const message = await translate('Location name and address are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }
    let [translateName, translateAddress] = await Promise.all([translate(name, { to: "en" }), translate(address, { to: "en" })]);
    const location = await prisma.storeLocation.create({
      data: {
        name: translateName,
        address: translateAddress,
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
  const lang = req.query.lang || 'en';
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
    let [translatedDiscounts, message] = await Promise.all([
      Promise.all(discounts.map(async (discount) => {
        let [translatedName, translatedDescription] = await Promise.all([
          translate(discount.name, { to: lang }),
          translate(discount.description, { to: lang })
        ]);
        return {
          ...discount,
          name: translatedName,
          description: translatedDescription
        };
      })),
      translate('Discounts retrieved successfully', { to: lang })
    ]);
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedDiscounts
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء خصم جديد
const createDiscount = async (req, res) => {
  const lang = req.query.lang || 'en';
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
    let [translateName, translateDescription] = await Promise.all([translate(name, { to: "en" }), translate(description, { to: "en" })]);
    const discount = await prisma.discount.create({
      data: {
        storeId,
        name: translateName,
        description: translateDescription,
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
  const { lang = 'en' } = req.query;

  try {
    let [translateName, translateDescription] = await Promise.all([translate(req.body.name, { to: "en" }), translate(req.body.description, { to: "en" })]);
    const discount = await prisma.discount.update({
      where: {
        id: parseInt(id),
        storeId: parseInt(storeId)
      },
      data: {
        name: translateName,
        description: translateDescription,
        type: req.body.type,
        value: req.body.value,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        minOrderAmount: req.body.minOrderAmount,
        maxDiscountAmount: req.body.maxDiscountAmount,
        applicableProducts: req.body.applicableProducts,
        applicableCategories: req.body.applicableCategories
      },
      include: {
        store: true
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
  const { lang = 'en' } = req.query;

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
  const lang = req.query.lang || 'en';
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
    let [translatedCoupons, message] = await Promise.all([
      Promise.all(coupons.map(async (coupon) => {
        let [translatedName, translatedDescription] = await Promise.all([
          translate(coupon.name, { to: lang }),
          translate(coupon.description, { to: lang })
        ]);
        return {
          ...coupon,
          name: translatedName,
          description: translatedDescription
        };
      })),
      translate('Coupons retrieved successfully', { to: lang })
    ]);
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedCoupons
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء كوبون جديد
const createCoupon = async (req, res) => {
  const lang = req.query.lang || 'en';
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
    let [translateName, translateDescription] = await Promise.all([translate(name, { to: "en" }), translate(description, { to: "en" })]);
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
        name: translateName,
        description: translateDescription,
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

// التحقق من صلاحية الكوبون
const validateCoupon = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const { code, orderAmount, products } = req.body;

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

    // تطبيق الحد الأقصى للخصم
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    // إرسال إشعار باستخدام الكوبون
    if (req.io) {
      req.io.to(`store_${storeId}`).emit('couponValidated', {
        couponId: coupon.id,
        discountAmount,
        orderAmount
      });
    }

    const message = await translate('Coupon is valid', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        coupon: {
          ...coupon,
          name: await translate(coupon.name, { to: lang }),
          description: coupon.description ? await translate(coupon.description, { to: lang }) : null
        },
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
  const { lang = 'en' } = req.query;

  try {
    let [translateName, translateDescription] = await Promise.all([translate(req.body.name, { to: "en" }), translate(req.body.description, { to: "en" })]);
    const coupon = await prisma.coupon.update({
      where: {
        id: parseInt(id),
        storeId: parseInt(storeId)
      },
      data: {
        code: req.body.code,
        name: translateName,
        description: translateDescription,
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
  const { lang = 'en' } = req.query;

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

const getStoresAllOffers = async (req, res) => {
  const lang = req.query.lang || 'en';
  let longitude = parseFloat(req.query.longitude);
  let latitude = parseFloat(req.query.latitude);
  let take = parseInt(req.query.take) || 10;
  let maxDistance = 10; // 10 كيلومتر

  try {
    // فلترة حسب المسافة إذا تم توفير الإحداثيات
    if (longitude && latitude) {
      // الحصول على جميع المتاجر مع مواقعها
      const stores = await prisma.store.findMany({
        include: {
          locations: true
        }
      });

      // حساب المسافة لكل متجر
      const storesWithDistance = stores.filter(store => {
        if (!store.locations || store.locations.length === 0) return false;

        // حساب المسافة لكل موقع من مواقع المتجر
        const distances = store.locations.map(location => {
          const R = 6371; // نصف قطر الأرض بالكيلومتر
          const dLat = (location.latitude - latitude) * Math.PI / 180;
          const dLon = (location.longitude - longitude) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          return distance;
        });

        // إرجاع المتجر إذا كان أي من مواقعه ضمن المسافة المطلوبة
        return Math.min(...distances) <= maxDistance;
      });

      // الحصول على معرفات المتاجر التي تقع ضمن المسافة المطلوبة
      const storeIds = storesWithDistance.map(store => store.id);

      // الحصول على العروض للمتاجر التي تقع ضمن المسافة المطلوبة
      const offers = await prisma.storeOffer.findMany({
        where: {
          storeId: {
            in: storeIds
          },
          isActive: true
        },
        take,
        include: {
          store: {
            include: {
              locations: true
            }
          }
        }
      });

      // ترجمة العروض
      const translatedOffers = await Promise.all(offers.map(async (offer) => {
        const [translatedName, translatedDescription] = await Promise.all([
          translate(offer.name, { to: lang }),
          translate(offer.description, { to: lang })
        ]);

        return {
          ...offer,
          name: translatedName,
          description: translatedDescription
        };
      }));

      const message = await translate('Offers retrieved successfully', { to: lang });
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: translatedOffers
      });
      return;
    }

    // إذا لم يتم توفير الإحداثيات، إرجاع جميع العروض النشطة
    const offers = await prisma.storeOffer.findMany({
      where: {
        isActive: true
      },
      take,
      include: {
        store: {
          include: {
            locations: true
          }
        }
      }
    });

    // ترجمة العروض
    const translatedOffers = await Promise.all(offers.map(async (offer) => {
      const [translatedName, translatedDescription] = await Promise.all([
        translate(offer.name, { to: lang }),
        translate(offer.description, { to: lang })
      ]);

      return {
        ...offer,
        name: translatedName,
        description: translatedDescription
      };
    }));

    const message = await translate('Offers retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedOffers
    });
  } catch (error) {
    console.log(error);
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

const getStoreOfferById = async (req, res) => {
  const { id } = req.params;
  const { lang = 'en' } = req.query;
  try {
    const offer = await prisma.storeOffer.findUnique({
      where: { id: id },
      include: {
        products: {
          include: {
            product: true
          }
        },
        store: {
          include: {
            workingHours: true
          }
        }
      }
    });
    if (!offer) {
      const message = await translate('Offer not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }
    let [translatedName, translatedDescription] = await Promise.all([
      translate(offer.name, { to: lang }),
      translate(offer.description, { to: lang })
    ]);
    const message = await translate('Offer retrieved successfully', { to: lang });
    res.status(200).json({
      status: true, message, code: 200, data: {
        ...offer,
        name: translatedName,
        description: translatedDescription
      }
    });

  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

const updateStoreOffer = async (req, res) => {
  const { id, storeId } = req.params;
  const { lang = 'en' } = req.query;
  const { name, description, type, image, startDate, endDate, discount, applicableProducts } = req.body;
  try {
    let products = await prisma.product.findMany({
      where: {
        id: {
          in: applicableProducts
        }
      }
    });
    const offer = await prisma.storeOffer.update({
      where: { id: parseInt(id), storeId: parseInt(storeId) },
      data: {
        name,
        description,
        type,
        image,
        startDate,
        endDate, discount, products: {
          connect: products.map(product => ({ productId: product.id }))
        }
      }
    });
    let [translatedName, translatedDescription] = await Promise.all([
      translate(offer.name, { to: lang }),
      translate(offer.description, { to: lang })
    ]);
    const message = await translate('Offer updated successfully', { to: lang });
    res.status(200).json({
      status: true, message, code: 200, data: {
        ...offer,
        name: translatedName,
        description: translatedDescription
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

const deleteStoreOffer = async (req, res) => {
  const { id } = req.params;
  const { lang = 'en' } = req.query;
  try {
    await prisma.storeOffer.delete({
      where: { id: parseInt(id) }
    });
    const message = await translate('Offer deleted successfully', { to: lang });
    res.status(200).json({ status: true, message, code: 200, data: null });
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
  validateCoupon,
  getStoresAllOffers,
  getStoreOfferById,
  updateStoreOffer,
  deleteStoreOffer,
  getAllStoreCategories,
  createStoreCategory,
  getStoreProducts,
  createStoreProduct,
  getStoreProductById,
  updateStoreProduct
}; 