const jwt = require('jsonwebtoken');
const translate = require('translate-google');
const ACCESS_SECRET_ADMIN = process.env.ACCESS_SECRET_ADMIN
const REFRESH_SECRET_ADMIN = process.env.REFRESH_SECRET_ADMIN 

const authenticateToken = async (req, res, next) => {
    let lang = req.query.lang || 'en';
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from the Authorization header

  if (!token) {
    let message =await translate('Unauthorized token is missing', lang);
    return res.status(401).json({ message, code: 401, data: null, status: false }); // Unauthorized
  }
  
  let message =await translate('Forbidden access token', lang);
  jwt.verify(token, ACCESS_SECRET_ADMIN, (err, user) => {
    if (err) {
      return res.status(403).json({ message, code: 403, data: null, status: false });
    }
    req.user = user; // Store user info in request
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = authenticateToken;