const { asyncHandler } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthService = require('../services/authService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  const existingUser = await AuthService.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await AuthService.createUser({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phone,
    role: role || 'customer',
    addresses: []
  });

  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  const user = await AuthService.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const token = generateToken(user.id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    }
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await AuthService.findUserById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses || [],
        createdAt: user.createdAt
      }
    }
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  const user = await AuthService.updateUser(req.user.id, {
    firstName,
    lastName,
    phone
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    }
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  const user = await AuthService.findUserById(req.user.id);

  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await AuthService.updateUser(req.user.id, {
    password: hashedPassword
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

const addAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zipCode, country, isDefault } = req.body;

  if (!street || !city || !state || !zipCode || !country) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all address fields'
    });
  }

  const addresses = await AuthService.addAddress(req.user.id, {
    street,
    city,
    state,
    zipCode,
    country,
    isDefault
  });

  res.status(200).json({
    success: true,
    message: 'Address added successfully',
    data: {
      addresses
    }
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const { street, city, state, zipCode, country, isDefault } = req.body;

  const addresses = await AuthService.updateAddress(req.user.id, addressId, {
    street,
    city,
    state,
    zipCode,
    country,
    isDefault
  });

  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: {
      addresses
    }
  });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const addresses = await AuthService.deleteAddress(req.user.id, addressId);

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: {
      addresses
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress
};