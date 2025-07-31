const { asyncHandler } = require('../middleware/errorHandler');
const ProductService = require('../services/productService');

const addProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    discountPrice,
    category,
    brand,
    stock,
    sku,
    specifications,
    isFeatured
  } = req.body;

  if (!name || !description || !price || !category || !stock) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, description, price, category, and stock'
    });
  }

  let imagePaths = [];
  if (req.files && req.files.length > 0) {
    imagePaths = req.files.map(file => `/uploads/${file.filename}`);
  }

  const newProduct = await ProductService.createProduct({
    name,
    description,
    price,
    discountPrice,
    category,
    brand,
    images: imagePaths,
    stock,
    specifications,
    isFeatured: isFeatured || false,
    createdBy: req.user.id,
    createdByName: `${req.user.firstName} ${req.user.lastName}`
  });

  res.status(201).json({
    success: true,
    message: 'Product added successfully',
    data: newProduct
  });
});

module.exports = {
  addProduct
};
