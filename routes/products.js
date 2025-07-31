const express = require('express');
const router = express.Router();
const { addProduct, getproducts, getProductById } = require('../controllers/productController');
const upload = require('../config/multer');
const { auth, isAdmin } = require('../middleware/auth');

router.post('/', auth, isAdmin, upload.array('images', 5), addProduct);
router.get('/', getproducts);
router.get('/:productId', getProductById);

module.exports = router;