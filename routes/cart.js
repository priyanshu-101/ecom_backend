const express = require('express');
const router = express.Router();
const {
  addToCart,
  removeFromCart,
  updateCartItem,
  getCart,
  clearCart,
  getCartCount,
  moveToWishlist,
  incrementCartItem,
  decrementCartItem
} = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getCart);
router.get('/count', getCartCount);
router.post('/', addToCart);
router.patch('/:productId/increment', incrementCartItem);
router.patch('/:productId/decrement', decrementCartItem);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.post('/:productId/move-to-wishlist', moveToWishlist);
router.delete('/', clearCart);

module.exports = router;
