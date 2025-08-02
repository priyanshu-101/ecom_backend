const express = require('express');
const router = express.Router();
const {
  createOrder,
  createOrderFromCart,
  getOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  addTrackingNumber,
  cancelOrder,
  getOrderStats
} = require('../controllers/orderController');
const { auth, isAdmin } = require('../middleware/auth');
router.use(auth);


router.post('/', createOrder);                           // Create order with specific items
router.post('/from-cart', createOrderFromCart);          // Create order from cart
router.get('/my-orders', getUserOrders);                 // Get user's orders
router.get('/:orderId', getOrder);                       // Get specific order
router.patch('/:orderId/cancel', cancelOrder);           // Cancel order

router.get('/', isAdmin, getAllOrders);                  // Get all orders (admin)
router.get('/stats/overview', isAdmin, getOrderStats);   // Get order statistics (admin)
router.patch('/:orderId/status', isAdmin, updateOrderStatus);     // Update order status (admin)
router.patch('/:orderId/payment', isAdmin, updatePaymentStatus);  // Update payment status (admin)
router.patch('/:orderId/tracking', isAdmin, addTrackingNumber);   // Add tracking number (admin)

module.exports = router;
