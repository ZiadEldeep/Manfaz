const prisma = require('../prismaClient');
const translate = require('translate-google');

// Get All Service Parameters
const getAllServiceParameters = async (req, res) => {
  const lang = req.query.lang || 'en';
  const { serviceId } = req.query;

  try {
    const parameters = await prisma.serviceParameter.findMany({
      where: serviceId ? { serviceId } : {},
      orderBy: { sortOrder: 'asc' }
    });

    let message = await translate('Service parameters retrieved successfully', { to: lang });
    let data = [];
    
    for (let param of parameters) {
      if (lang === 'en') {
        data.push(param);
      } else {
        data.push({
          ...param,
          name: await translate(param.name, { to: lang }),
          description: param.description ? await translate(param.description, { to: lang }) : null,
        });
      }
    }

    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: data
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
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
      sortOrder
    } = req.body;

    if (!name || !price || !serviceId) {
      const message = await translate('Name, price, and service ID are required', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      const message = await translate('Service not found', { to: lang });
      return res.status(400).json({ status: false, message: message, code: 400, data: null });
    }

    let translateName = await translate(name, { to: "en" });
    let translateDescription = description ? await translate(description, { to: "en" }) : null;

    const newParameter = await prisma.serviceParameter.create({
      data: {
        name: translateName,
        description: translateDescription,
        imageUrl,
        price,
        warranty,
        installmentAvailable,
        installmentMonths,
        monthlyInstallment,
        serviceId,
        status,
        sortOrder: sortOrder || 0
      },
    });

    const message = await translate('Service parameter created successfully', { to: lang });
    const data = lang === 'en' ? newParameter : {
      ...newParameter,
      name: await translate(newParameter.name, { to: lang }),
      description: newParameter.description ? await translate(newParameter.description, { to: lang }) : null
    };

    res.status(201).json({
      status: true,
      message: message,
      code: 201,
      data: data
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
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
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
    }

    const data = lang === 'en' ? parameter : {
      ...parameter,
      name: await translate(parameter.name, { to: lang }),
      description: parameter.description ? await translate(parameter.description, { to: lang }) : null
    };

    const message = await translate('Service parameter retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: data
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
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
      sortOrder
    } = req.body;

    const parameter = await prisma.serviceParameter.findUnique({
      where: { id },
    });

    if (!parameter) {
      const message = await translate('Service parameter not found', { to: lang });
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
    }

    let translateName = name ? await translate(name, { to: "en" }) : undefined;
    let translateDescription = description ? await translate(description, { to: "en" }) : undefined;

    const updatedParameter = await prisma.serviceParameter.update({
      where: { id },
      data: {
        name: translateName,
        description: translateDescription,
        imageUrl,
        price,
        warranty,
        installmentAvailable,
        installmentMonths,
        monthlyInstallment,
        status,
        sortOrder
      },
    });

    const message = await translate('Service parameter updated successfully', { to: lang });
    const data = lang === 'en' ? updatedParameter : {
      ...updatedParameter,
      name: await translate(updatedParameter.name, { to: lang }),
      description: updatedParameter.description ? await translate(updatedParameter.description, { to: lang }) : null
    };

    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: data
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
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
      return res.status(404).json({ status: false, message: message, code: 404, data: null });
    }

    await prisma.serviceParameter.delete({
      where: { id },
    });

    const message = await translate('Service parameter deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message: message,
      code: 200,
      data: null
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message: message, code: 500, data: null });
  }
};

module.exports = {
  getAllServiceParameters,
  createServiceParameter,
  getServiceParameterById,
  updateServiceParameter,
  deleteServiceParameter
};
