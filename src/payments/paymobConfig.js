module.exports = {
    apiKey: process.env.PAYMOB_API_KEY,
    integrationId: process.env.PAYMOB_INTEGRATION_ID,
    iframeId: process.env.PAYMOB_IFRAME_ID,
    currency: 'SAR',
    baseUrl: process.env.PAYMOB_BASE_URL || 'https://ksa.paymob.com/api'
}; 