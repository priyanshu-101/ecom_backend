const express = require('express');
const router = express.Router();
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist,
  checkWishlistStatus,
  getWishlistCount
} = require('../controllers/wishlistController');
const { auth } = require('../middleware/auth');

router.get('/',auth, getWishlist);
router.get('/count', auth, getWishlistCount);
router.get('/check/:productId', auth, checkWishlistStatus);
router.post('/',auth, addToWishlist);
router.delete('/:productId', auth, removeFromWishlist);
router.delete('/', auth, clearWishlist);

module.exports = router;
