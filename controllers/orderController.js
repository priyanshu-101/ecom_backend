const { asyncHandler } = require('../middleware/errorHandler');
const OrderService = require('../services/orderService');

const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    productIds, 
    shippingAddress,
    paymentMethod,
    orderNotes
  } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Product IDs are required'
    });
  }

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required'
    });
  }

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required'
    });
  }

  try {
    const order = await OrderService.createOrderFromCartItems(userId, {
      productIds,
      shippingAddress,
      paymentMethod,
      orderNotes
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    if (error.message.includes('not found') || 
        error.message.includes('not available') ||
        error.message.includes('Insufficient stock') ||
        error.message.includes('Cart is empty') ||
        error.message.includes('not in cart')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
});

const createOrderFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    shippingAddress,
    paymentMethod,
    orderNotes
  } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required'
    });
  }

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required'
    });
  }

  try {
    const order = await OrderService.createOrderFromCart(userId, {
      shippingAddress,
      paymentMethod,
      orderNotes
    });

    res.status(201).json({
      success: true,
      message: 'Order created from cart successfully',
      data: order
    });
  } catch (error) {
    if (error.message === 'Cart is empty' ||
        error.message.includes('not found') || 
        error.message.includes('not available') ||
        error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
});

const getOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await OrderService.getOrderById(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user owns this order (unless admin)
  if (req.user.role !== 'admin' && order.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, paymentStatus, limit } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (paymentStatus) filters.paymentStatus = paymentStatus;
  if (limit) filters.limit = parseInt(limit);

  const orders = await OrderService.getUserOrders(userId, filters);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: {
      orders,
      count: orders.length
    }
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { status, paymentStatus, limit } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (paymentStatus) filters.paymentStatus = paymentStatus;
  if (limit) filters.limit = parseInt(limit);

  const orders = await OrderService.getAllOrders(filters);

  res.status(200).json({
    success: true,
    message: 'All orders retrieved successfully',
    data: {
      orders,
      count: orders.length
    }
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, note } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  try {
    const updatedOrder = await OrderService.updateOrderStatus(orderId, status, note);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (error.message === 'Invalid order status') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    throw error;
  }
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentStatus, transactionId } = req.body;

  if (!paymentStatus) {
    return res.status(400).json({
      success: false,
      message: 'Payment status is required'
    });
  }

  try {
    const updatedOrder = await OrderService.updatePaymentStatus(orderId, paymentStatus, transactionId);

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (error.message === 'Invalid payment status') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    throw error;
  }
});

const addTrackingNumber = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { trackingNumber, carrier } = req.body;

  if (!trackingNumber) {
    return res.status(400).json({
      success: false,
      message: 'Tracking number is required'
    });
  }

  try {
    const updatedOrder = await OrderService.addTrackingNumber(orderId, trackingNumber, carrier);

    res.status(200).json({
      success: true,
      message: 'Tracking number added successfully',
      data: updatedOrder
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    throw error;
  }
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const order = await OrderService.getOrderById(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user owns this order (unless admin)
  if (req.user.role !== 'admin' && order.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  try {
    const cancelledOrder = await OrderService.cancelOrder(orderId, reason);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: cancelledOrder
    });
  } catch (error) {
    if (error.message.includes('Cannot cancel order')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
});

const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await OrderService.getOrderStats();

  res.status(200).json({
    success: true,
    message: 'Order statistics retrieved successfully',
    data: stats
  });
});

module.exports = {
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
};