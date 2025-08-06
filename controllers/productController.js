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
    } else {
        console.log('No files uploaded');
    }

    const productData = {
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
    };

    // Add SKU only if provided
    if (sku) {
        productData.sku = sku;
    }

    const newProduct = await ProductService.createProduct(productData);

    res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: newProduct
    });
});

const getproducts = asyncHandler(async (req, res) => {
    const products = await ProductService.getAllProducts();

    res.status(200).json({
        success: true,
        data: products
    });
});

const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const product = await ProductService.findProductById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
    res.status(200).json({
        success: true,
        data: product
    });
}
);

const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    
    const product = await ProductService.findProductById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
    
    await ProductService.deleteProduct(productId);
    
    res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
    });
}
);

const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const {
        name,
        description,
        price,
        discountPrice,
        category,
        brand,
        stock,
        specifications,
        isFeatured
    } = req.body;
    
    if (!name || !description || !price || !category || !stock) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields: name, description, price, category, and stock'
        });
    }

    // Get existing product to preserve images if no new images are uploaded
    const existingProduct = await ProductService.findProductById(productId);
    if (!existingProduct) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    let imagePaths = existingProduct.images || []; // Preserve existing images by default
    
    // Only update images if new files are uploaded
    if (req.files && req.files.length > 0) {
        imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    }

    const updatedProduct = await ProductService.updateProduct(productId, {
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
        updatedBy: req.user.id,
        updatedByName: `${req.user.firstName} ${req.user.lastName}`
    });
    
    res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
    });
}
);
module.exports = {
    addProduct,
    getproducts,
    getProductById,
    deleteProduct,
    updateProduct
};
