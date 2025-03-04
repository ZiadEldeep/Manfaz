const express = require('express');
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
  validateCoupon
} = require('../controllers/storeController');

const router = express.Router();

// المتاجر
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
router.post('/:storeId/products', createStoreProduct);

// عروض المتجر
router.get('/:storeId/offers', getStoreOffers);
router.post('/:storeId/offers', createStoreOffer);

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
router.post('/:storeId/coupons', createCoupon);
router.put('/:storeId/coupons/:id', updateCoupon);
router.delete('/:storeId/coupons/:id', deleteCoupon);
router.post('/:storeId/coupons/validate', validateCoupon);

module.exports = router; 