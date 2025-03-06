const prisma = require('../prismaClient');
const translate = require('translate-google');

// Helper function to translate FAQ array
async function translateFaqs(faqs, targetLang, toEnglish = false) {
  if (!faqs) return null;
  
  return Promise.all(faqs.map(async (faq) => ({
    question: await translate(faq.question, { to: toEnglish ? 'en' : targetLang }),
    answer: await translate(faq.answer, { to: toEnglish ? 'en' : targetLang })
  })));
}

// Helper function to translate whatIncluded array
async function translateWhatIncluded(items, targetLang, toEnglish = false) {
  if (!items) return null;
  return Promise.all(items.map(item => translate(item, { to: toEnglish ? 'en' : targetLang })));
}

// Get All Service Parameters
const getAllServiceParameters = async (req, res) => {
  const lang = req.query.lang || 'en';
  const { serviceId } = req.query;

  try {
    const parameters = await prisma.serviceParameter.findMany({
      where: serviceId ? { serviceId } : {},
      orderBy: { sortOrder: 'asc' }
    });

    const message = await translate('Service parameters retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: parameters
      });
      return;
    }

    // ترجمة جميع البارامترات في وقت واحد
    const translatedParameters = await Promise.all(parameters.map(async (param) => {
      const [
        translatedName,
        translatedDesc,
        translatedFaqs,
        translatedWhatIncluded
      ] = await Promise.all([
        translate(param.name, { to: lang }),
        param.description ? translate(param.description, { to: lang }) : null,
        param.faqs ? translateFaqs(param.faqs, lang) : null,
        param.whatIncluded ? translateWhatIncluded(param.whatIncluded, lang) : null
      ]);

      return {
        ...param,
        name: translatedName,
        description: translatedDesc,
        faqs: translatedFaqs,
        whatIncluded: translatedWhatIncluded
      };
    }));

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedParameters
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Create Service Parameter
const createServiceParameter = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const {
      name,
      description,
      imageUrl,
      price,
      warranty,
      installmentAvailable,
      installmentMonths,
      monthlyInstallment,
      serviceId,
      status,
      sortOrder,
      faqs,
      whatIncluded,
      iconUrl
    } = req.body;

    if (!name || !price || !serviceId) {
      const message = await translate('Name, price, and service ID are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      const message = await translate('Service not found', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // ترجمة جميع الحقول النصية إلى الإنجليزية في وقت واحد
    const [
      translatedName,
      translatedDesc,
      translatedFaqs,
      translatedWhatIncluded
    ] = await Promise.all([
      translate(name, { to: "en" }),
      description ? translate(description, { to: "en" }) : null,
      faqs ? translateFaqs(faqs, 'en', true) : null,
      whatIncluded ? translateWhatIncluded(whatIncluded, 'en', true) : null
    ]);

    const newParameter = await prisma.serviceParameter.create({
      data: {
        name: translatedName,
        description: translatedDesc,
        imageUrl,
        price,
        warranty,
        installmentAvailable,
        installmentMonths,
        monthlyInstallment,
        serviceId,
        status: status || 'active',
        sortOrder: sortOrder || 0,
        faqs: translatedFaqs,
        whatIncluded: translatedWhatIncluded,
        iconUrl
      },
    });

    const message = await translate('Service parameter created successfully', { to: lang });

    if (lang === 'en') {
      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: newParameter
      });
      return;
    }

    // ترجمة البيانات للغة المطلوبة
    const [
      finalName,
      finalDesc,
      finalFaqs,
      finalWhatIncluded
    ] = await Promise.all([
      translate(newParameter.name, { to: lang }),
      newParameter.description ? translate(newParameter.description, { to: lang }) : null,
      newParameter.faqs ? translateFaqs(newParameter.faqs, lang) : null,
      newParameter.whatIncluded ? translateWhatIncluded(newParameter.whatIncluded, lang) : null
    ]);

    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        ...newParameter,
        name: finalName,
        description: finalDesc,
        faqs: finalFaqs,
        whatIncluded: finalWhatIncluded
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Get Service Parameter By ID
const getServiceParameterById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    
    const parameter = await prisma.serviceParameter.findUnique({
      where: { id },
    });

    if (!parameter) {
      const message = await translate('Service parameter not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const message = await translate('Service parameter retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: parameter
      });
      return;
    }

    // ترجمة جميع البيانات في وقت واحد
    const [
      translatedName,
      translatedDesc,
      translatedFaqs,
      translatedWhatIncluded
    ] = await Promise.all([
      translate(parameter.name, { to: lang }),
      parameter.description ? translate(parameter.description, { to: lang }) : null,
      parameter.faqs ? translateFaqs(parameter.faqs, lang) : null,
      parameter.whatIncluded ? translateWhatIncluded(parameter.whatIncluded, lang) : null
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...parameter,
        name: translatedName,
        description: translatedDesc,
        faqs: translatedFaqs,
        whatIncluded: translatedWhatIncluded
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Service Parameter
const updateServiceParameter = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const {
      name,
      description,
      imageUrl,
      price,
      warranty,
      installmentAvailable,
      installmentMonths,
      monthlyInstallment,
      status,
      sortOrder,
      faqs,
      iconUrl,
      whatIncluded
    } = req.body;

    const parameter = await prisma.serviceParameter.findUnique({
      where: { id },
    });

    if (!parameter) {
      const message = await translate('Service parameter not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة الحقول المحدثة إلى الإنجليزية
    const [
      translatedName,
      translatedDesc,
      translatedFaqs,
      translatedWhatIncluded
    ] = await Promise.all([
      name ? translate(name, { to: "en" }) : parameter.name,
      description ? translate(description, { to: "en" }) : parameter.description,
      faqs ? translateFaqs(faqs, 'en', true) : parameter.faqs,
      whatIncluded ? translateWhatIncluded(whatIncluded, 'en', true) : parameter.whatIncluded
    ]);

    const updatedParameter = await prisma.serviceParameter.update({
      where: { id },
      data: {
        name: translatedName,
        description: translatedDesc,
        iconUrl: iconUrl || parameter.iconUrl,
        imageUrl: imageUrl || parameter.imageUrl,
        price: price || parameter.price,
        warranty: warranty || parameter.warranty,
        installmentAvailable: installmentAvailable ?? parameter.installmentAvailable,
        installmentMonths: installmentMonths || parameter.installmentMonths,
        monthlyInstallment: monthlyInstallment || parameter.monthlyInstallment,
        status: status || parameter.status,
        sortOrder: sortOrder || parameter.sortOrder,
        faqs: translatedFaqs,
        whatIncluded: translatedWhatIncluded
      },
    });

    const message = await translate('Service parameter updated successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: updatedParameter
      });
      return;
    }

    // ترجمة البيانات المحدثة للغة المطلوبة
    const [
      finalName,
      finalDesc,
      finalFaqs,
      finalWhatIncluded
    ] = await Promise.all([
      translate(updatedParameter.name, { to: lang }),
      updatedParameter.description ? translate(updatedParameter.description, { to: lang }) : null,
      updatedParameter.faqs ? translateFaqs(updatedParameter.faqs, lang) : null,
      updatedParameter.whatIncluded ? translateWhatIncluded(updatedParameter.whatIncluded, lang) : null
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedParameter,
        name: finalName,
        description: finalDesc,
        faqs: finalFaqs,
        whatIncluded: finalWhatIncluded
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Delete Service Parameter
const deleteServiceParameter = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;

    const parameter = await prisma.serviceParameter.findUnique({
      where: { id },
    });

    if (!parameter) {
      const message = await translate('Service parameter not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    await prisma.serviceParameter.delete({
      where: { id },
    });

    const message = await translate('Service parameter deleted successfully', { to: lang });
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
  getAllServiceParameters,
  createServiceParameter,
  getServiceParameterById,
  updateServiceParameter,
  deleteServiceParameter
};
