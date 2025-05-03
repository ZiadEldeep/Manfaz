const express = require('express');
const protect = require('../middleware/authAdminMiddleware');
const {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getStoreCategories,
  getAllStoreCategories,
  createStoreCategory,
  getStoreProducts,
  createStoreProduct,
  getStoreProductById,
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
  updateStoreProduct,
  getStoresAllOffers,
  getStoreOfferById,
  updateStoreOffer,
  deleteStoreOffer
} = require('../controllers/storeController');

const router = express.Router();

// المتاجر
// stores
router.get('/', getAllStores);
router.get('/:id', getStoreById);
router.post('/', createStore);
router.put('/:id', updateStore);
router.delete('/:id', deleteStore);

// تصنيفات المتجر
router.get('/:storeId/categories', getStoreCategories);
router.get('/categories/all', getAllStoreCategories);
router.post('/:storeId/categories', createStoreCategory);

// منتجات المتجر
router.get('/:storeId/products', getStoreProducts);
router.post('/:storeId/products', protect, createStoreProduct);
router.get('/products/:id', getStoreProductById);
router.put('/:storeId/products/:id', updateStoreProduct);

// عروض المتجر
router.get('/:storeId/offers', getStoreOffers);
router.get('/offers/all', getStoresAllOffers);
router.post('/:storeId/offers', createStoreOffer);
router.get('/offers/one/:id', getStoreOfferById);
router.put('/:storeId/offers/:id', updateStoreOffer);
router.delete('/:storeId/offers/:id', deleteStoreOffer);

// فروع المتجر
router.get('/:storeId/locations', getStoreLocations);
router.post('/:storeId/locations', createStoreLocation);

// الخصومات
router.get('/:storeId/discounts', getStoreDiscounts);
router.post('/:storeId/discounts', createDiscount);
router.put('/:storeId/discounts/:id', updateDiscount);
router.delete('/:storeId/discounts/:id', deleteDiscount);

// الكوبونات
router.get('/:storeId/coupons', getStoreCoupons);
router.post('/:storeId/coupons', protect, createCoupon);
router.put('/:storeId/coupons/:id', updateCoupon);
router.delete('/:storeId/coupons/:id', deleteCoupon);
router.post('/:storeId/validate-coupon', validateCoupon);

module.exports = router; 