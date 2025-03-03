const prisma = require('../prismaClient');
const translate = require('translate-google');
// Get All Services
const getAllServices = async (req, res) => {
  const lang = req.query.lang || 'en';
  const { type, categoryId } = req.query;

  try {
    const services = await prisma.service.findMany({
      where: type ? { type, categoryId } : {},
      include: {
        category: true,
      },
    });

    const message = await translate('Services retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: services
      });
      return;
    }

    // ترجمة جميع الخدمات في وقت واحد
    const translatedServices = await Promise.all(services.map(async (service) => {
      const [
        translatedName,
        translatedSlug,
        translatedDesc,
        translatedSubType,
        translatedCategoryName
      ] = await Promise.all([
        translate(service.name, { to: lang }),
        translate(service.slug, { to: lang }),
        service.description ? translate(service.description, { to: lang }) : null,
        service.subType ? translate(service.subType, { to: lang }) : null,
        service.category ? translate(service.category.name, { to: lang }) : null
      ]);

      return {
        ...service,
        name: translatedName,
        slug: translatedSlug,
        description: translatedDesc,
        subType: translatedSubType,
        category: service.category ? {
          ...service.category,
          name: translatedCategoryName
        } : null
      };
    }));

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedServices
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};


// Create Service
const createService = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { 
      name, 
      slug, 
      description, 
      categoryId, 
      type, 
      subType,
      price, 
      duration,
      imageUrl,
      iconUrl 
    } = req.body;

    if (!name || !slug || !description || !categoryId || !type || !price || !duration) {
      const message = await translate('All required fields must be provided', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      const message = await translate('Category not found', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // ترجمة جميع الحقول النصية إلى الإنجليزية في وقت واحد
    const [
      translatedName,
      translatedSlug,
      translatedDesc,
      translatedSubType
    ] = await Promise.all([
      translate(name, { to: "en" }),
      translate(slug, { to: "en" }),
      translate(description, { to: "en" }),
      subType ? translate(subType, { to: "en" }) : null
    ]);

    const newService = await prisma.service.create({
      data: {
        name: translatedName,
        slug: translatedSlug,
        description: translatedDesc,
        categoryId,
        type,
        subType: translatedSubType,
        price,
        duration,
        imageUrl,
        iconUrl
      },
    });

    const message = await translate('Service created successfully', { to: lang });

    if (lang === 'en') {
      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: newService
      });
      return;
    }

    // ترجمة البيانات للغة المطلوبة
    const [
      finalName,
      finalSlug,
      finalDesc,
      finalSubType
    ] = await Promise.all([
      translate(newService.name, { to: lang }),
      translate(newService.slug, { to: lang }),
      translate(newService.description, { to: lang }),
      newService.subType ? translate(newService.subType, { to: lang }) : null
    ]);

    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        ...newService,
        name: finalName,
        slug: finalSlug,
        description: finalDesc,
        subType: finalSubType
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Get Service By ID
const getServiceById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        parameters: true,
      }
    });

    if (!service) {
      const message = await translate('Service not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const message = await translate('Service retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: service
      });
      return;
    }

    // ترجمة الخدمة وبارامتراتها في وقت واحد
    const [
      translatedName,
      translatedSlug,
      translatedDesc,
      translatedSubType,
      translatedParameters
    ] = await Promise.all([
      translate(service.name, { to: lang }),
      translate(service.slug, { to: lang }),
      service.description ? translate(service.description, { to: lang }) : null,
      service.subType ? translate(service.subType, { to: lang }) : null,
      Promise.all(service.parameters.map(async (param) => ({
        ...param,
        name: await translate(param.name, { to: lang }),
        description: param.description ? await translate(param.description, { to: lang }) : null
      })))
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...service,
        name: translatedName,
        slug: translatedSlug,
        description: translatedDesc,
        subType: translatedSubType,
        parameters: translatedParameters
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Service
const updateService = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      categoryId,
      type,
      subType,
      price,
      duration,
      imageUrl,
      iconUrl
    } = req.body;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      const message = await translate('Service not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة الحقول المحدثة إلى الإنجليزية
    const [
      translatedName,
      translatedSlug,
      translatedDesc,
      translatedSubType
    ] = await Promise.all([
      name ? translate(name, { to: "en" }) : service.name,
      slug ? translate(slug, { to: "en" }) : service.slug,
      description ? translate(description, { to: "en" }) : service.description,
      subType ? translate(subType, { to: "en" }) : service.subType
    ]);

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: translatedName,
        slug: translatedSlug,
        description: translatedDesc,
        categoryId: categoryId || service.categoryId,
        type: type || service.type,
        subType: translatedSubType,
        price: price || service.price,
        duration: duration || service.duration,
        imageUrl: imageUrl || service.imageUrl,
        iconUrl: iconUrl || service.iconUrl
      },
    });

    const message = await translate('Service updated successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: updatedService
      });
      return;
    }

    // ترجمة البيانات المحدثة للغة المطلوبة
    const [
      finalName,
      finalSlug,
      finalDesc,
      finalSubType
    ] = await Promise.all([
      translate(updatedService.name, { to: lang }),
      translate(updatedService.slug, { to: lang }),
      translate(updatedService.description, { to: lang }),
      updatedService.subType ? translate(updatedService.subType, { to: lang }) : null
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedService,
        name: finalName,
        slug: finalSlug,
        description: finalDesc,
        subType: finalSubType
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Delete Service
const deleteService = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      const message = await translate('Service not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    await prisma.service.delete({
      where: { id },
    });

    const message = await translate('Service deleted successfully', { to: lang });
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
  getAllServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
};
