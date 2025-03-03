const express = require('express');
const {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getStoreCategories,
  createStoreCategory,
  getStoreProducts,
  createStoreProduct,
  getStoreOffers,
  createStoreOffer,
  getStoreLocations,
  createStoreLocation
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

module.exports = router; 