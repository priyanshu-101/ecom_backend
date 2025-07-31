const express = require('express');
const router = express.Router();
const { addProduct } = require('../controllers/productController');
const upload = require('../config/multer');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleAuth');

router.post('/', auth, adminOnly, upload.array('images', 5), addProduct);

module.exports = router;