const paypalConfig = {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    currency: 'SAR',
    webhookId: process.env.PAYPAL_WEBHOOK_ID
};

module.exports = paypalConfig; 