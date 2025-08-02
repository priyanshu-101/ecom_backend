const { asyncHandler } = require('../middleware/errorHandler');
const CartService = require('../services/cartService');

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  if (quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be at least 1'
    });
  }

  try {
    const cartItem = await CartService.addToCart(userId, productId, quantity);

    res.status(201).json({
      success: true,
      message: 'Product added to cart successfully',
      data: cartItem
    });
  } catch (error) {
    if (error.message === 'Product not found' || 
        error.message === 'Product is not available') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    await CartService.removeFromCart(userId, productId);

    res.status(200).json({
      success: true,
      message: 'Product removed from cart successfully'
    });
  } catch (error) {
    if (error.message === 'Product not found in cart') {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    throw error;
  }
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid quantity is required'
    });
  }

  try {
    if (quantity === 0) {
      await CartService.removeFromCart(userId, productId);
      return res.status(200).json({
        success: true,
        message: 'Product removed from cart successfully'
      });
    }

    const updatedItem = await CartService.updateCartItemQuantity(userId, productId, quantity);

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    if (error.message === 'Product not found in cart' || 
        error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
});

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cart = await CartService.getUserCart(userId);

  res.status(200).json({
    success: true,
    message: 'Cart retrieved successfully',
    data: cart
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await CartService.clearCart(userId);

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully'
  });
});

const getCartCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await CartService.getCartCount(userId);

  res.status(200).json({
    success: true,
    data: {
      count
    }
  });
});

const moveToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    await CartService.moveToWishlist(userId, productId);

    res.status(200).json({
      success: true,
      message: 'Product moved to wishlist successfully'
    });
  } catch (error) {
    if (error.message === 'Product not found in cart') {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    throw error;
  }
});

const incrementCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const updatedItem = await CartService.incrementCartItem(userId, productId);

    res.status(200).json({
      success: true,
      message: 'Cart item quantity increased successfully',
      data: updatedItem
    });
  } catch (error) {
    if (error.message === 'Product not found in cart' || 
        error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
});

const decrementCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const result = await CartService.decrementCartItem(userId, productId);

    res.status(200).json({
      success: true,
      message: result.removed ? 'Product removed from cart' : 'Cart item quantity decreased successfully',
      data: result
    });
  } catch (error) {
    if (error.message === 'Product not found in cart') {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    throw error;
  }
});

module.exports = {
  addToCart,
  removeFromCart,
  updateCartItem,
  getCart,
  clearCart,
  getCartCount,
  moveToWishlist,
  incrementCartItem,
  decrementCartItem
};
