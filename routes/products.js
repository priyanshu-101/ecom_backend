const express = require('express');
const router = express.Router();
const { addProduct, getproducts, getProductById, deleteProduct, updateProduct } = require('../controllers/productController');
const upload = require('../config/multer');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleAuth');

router.post('/', auth, adminOnly, upload.array('images', 5), addProduct);
router.get('/', getproducts);
router.get('/:productId', getProductById);
router.delete('/:productId', auth, adminOnly, deleteProduct);
router.put('/:productId', auth, adminOnly, upload.array('images', 5), updateProduct);


module.exports = router;