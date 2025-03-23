const tapConfig = {
    secretKey: process.env.TAP_SECRET_KEY,
    merchantId: process.env.TAP_MERCHANT_ID,
    apiUrl: process.env.NODE_ENV === 'production' 
        ? 'https://api.tap.company/v2'
        : 'https://api.tap.company/v2',
    currency: 'SAR',
    language: 'ar',
    contactInfo: {
        name: 'Manfaz',
        email: 'support@manfaz.com',
        phone: '+966500000000'
    }
};

module.exports = tapConfig; 