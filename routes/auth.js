const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/addresses', auth, addAddress);
router.put('/addresses/:addressId', auth, updateAddress);
router.delete('/addresses/:addressId', auth, deleteAddress);

module.exports = router;