const jwt = require('jsonwebtoken');
const translate = require('translate-google');
const ACCESS_SECRET = process.env.ACCESS_SECRET 
const REFRESH_SECRET = process.env.REFRESH_SECRET 

const authenticateToken = async (req, res, next) => {
    let lang = req.query.lang || 'en';
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from the Authorization header

  if (!token) {
    let message =await translate('Unauthorized token is missing', { to: "ar" });
    return res.status(401).json({ message, code: 401, data: null, status: false }); // Unauthorized
  }
  
  let message =await translate('Forbidden access token', { to: "ar" });
  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message, code: 403, data: null, status: false });
    }
    req.user = user; // Store user info in request
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = authenticateToken;