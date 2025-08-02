const { asyncHandler } = require('../middleware/errorHandler');
const WishlistService = require('../services/wishlistService');

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  try {
    const wishlistItem = await WishlistService.addToWishlist(userId, productId);

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: wishlistItem
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (error.message === 'Product already in wishlist') {
      return res.status(409).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    throw error;
  }
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    await WishlistService.removeFromWishlist(userId, productId);

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully'
    });
  } catch (error) {
    if (error.message === 'Product not found in wishlist') {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    throw error;
  }
});

const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const wishlistItems = await WishlistService.getUserWishlist(userId);

  res.status(200).json({
    success: true,
    message: 'Wishlist retrieved successfully',
    data: {
      items: wishlistItems,
      count: wishlistItems.length
    }
  });
});

const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await WishlistService.clearWishlist(userId);

  res.status(200).json({
    success: true,
    message: 'Wishlist cleared successfully'
  });
});

const checkWishlistStatus = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  console.log('Checking wishlist status for user:', userId, 'product:', productId);

  const isInWishlist = await WishlistService.isProductInWishlist(userId, productId);
  console.log(isInWishlist);

  res.status(200).json({
    success: true,
    data: {
      productId,
      isInWishlist
    }
  });
});

const getWishlistCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await WishlistService.getWishlistCount(userId);

  res.status(200).json({
    success: true,
    data: {
      count
    }
  });
});

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist,
  checkWishlistStatus,
  getWishlistCount
};
