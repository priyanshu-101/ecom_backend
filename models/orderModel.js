// Order Models and Schemas for Firebase Firestore
// These models define the structure and validation for order-related data

const { body, param, query, validationResult } = require('express-validator');

// Order Status Enum
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Payment Status Enum
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment Methods Enum
const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
  RAZORPAY: 'razorpay',
  CASH_ON_DELIVERY: 'cash_on_delivery',
  BANK_TRANSFER: 'bank_transfer'
};

// Order Item Schema
const OrderItemSchema = {
  productId: {
    type: 'string',
    required: true,
    description: 'Reference to the product'
  },
  productName: {
    type: 'string',
    required: true,
    description: 'Product name at time of order'
  },
  productImage: {
    type: 'string',
    required: false,
    description: 'Product image URL'
  },
  price: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Original product price'
  },
  discountPrice: {
    type: 'number',
    required: false,
    min: 0,
    description: 'Discounted price if applicable'
  },
  finalPrice: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Final price used for calculation'
  },
  quantity: {
    type: 'number',
    required: true,
    min: 1,
    description: 'Quantity ordered'
  },
  itemTotal: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Total for this item (finalPrice * quantity)'
  },
  sku: {
    type: 'string',
    required: false,
    description: 'Product SKU'
  },
  category: {
    type: 'string',
    required: false,
    description: 'Product category'
  }
};

// Shipping Address Schema
const ShippingAddressSchema = {
  firstName: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50
  },
  lastName: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50
  },
  company: {
    type: 'string',
    required: false,
    maxLength: 100
  },
  street: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 200
  },
  apartment: {
    type: 'string',
    required: false,
    maxLength: 50
  },
  city: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50
  },
  state: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50
  },
  zipCode: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 20
  },
  country: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50
  },
  phone: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 20
  },
  email: {
    type: 'string',
    required: false,
    format: 'email'
  }
};

// Order Summary Schema
const OrderSummarySchema = {
  subtotal: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Sum of all item totals'
  },
  shipping: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Shipping cost'
  },
  tax: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Tax amount'
  },
  discount: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Total discount applied'
  },
  totalAmount: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Final total amount'
  },
  totalItems: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Total quantity of items'
  },
  itemCount: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Number of different products'
  }
};

// Status History Schema
const StatusHistorySchema = {
  status: {
    type: 'string',
    required: true,
    enum: Object.values(ORDER_STATUS)
  },
  timestamp: {
    type: 'date',
    required: true
  },
  note: {
    type: 'string',
    required: false,
    maxLength: 500
  },
  updatedBy: {
    type: 'string',
    required: false,
    description: 'User ID who updated the status'
  }
};

// Main Order Schema
const OrderSchema = {
  orderNumber: {
    type: 'string',
    required: true,
    unique: true,
    description: 'Unique order identifier'
  },
  userId: {
    type: 'string',
    required: true,
    description: 'Reference to the user who placed the order'
  },
  items: {
    type: 'array',
    required: true,
    minLength: 1,
    items: OrderItemSchema,
    description: 'Array of ordered items'
  },
  orderSummary: {
    type: 'object',
    required: true,
    schema: OrderSummarySchema
  },
  shippingAddress: {
    type: 'object',
    required: true,
    schema: ShippingAddressSchema
  },
  billingAddress: {
    type: 'object',
    required: false,
    schema: ShippingAddressSchema,
    description: 'If different from shipping address'
  },
  paymentMethod: {
    type: 'string',
    required: true,
    enum: Object.values(PAYMENT_METHODS)
  },
  paymentStatus: {
    type: 'string',
    required: true,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  orderStatus: {
    type: 'string',
    required: true,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  orderNotes: {
    type: 'string',
    required: false,
    maxLength: 1000
  },
  trackingNumber: {
    type: 'string',
    required: false
  },
  carrier: {
    type: 'string',
    required: false,
    description: 'Shipping carrier (UPS, FedEx, DHL, etc.)'
  },
  transactionId: {
    type: 'string',
    required: false,
    description: 'Payment gateway transaction ID'
  },
  estimatedDelivery: {
    type: 'date',
    required: false
  },
  actualDelivery: {
    type: 'date',
    required: false
  },
  paidAt: {
    type: 'date',
    required: false
  },
  shippedAt: {
    type: 'date',
    required: false
  },
  deliveredAt: {
    type: 'date',
    required: false
  },
  cancelledAt: {
    type: 'date',
    required: false
  },
  cancellationReason: {
    type: 'string',
    required: false,
    maxLength: 500
  },
  statusHistory: {
    type: 'array',
    required: true,
    items: StatusHistorySchema,
    description: 'History of status changes'
  },
  createdAt: {
    type: 'date',
    required: true,
    default: 'new Date()'
  },
  updatedAt: {
    type: 'date',
    required: true,
    default: 'new Date()'
  }
};

// Express Validator Rules for Order Creation
const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required')
    .custom((items) => {
      items.forEach((item, index) => {
        if (!item.productId) {
          throw new Error(`Item ${index + 1}: Product ID is required`);
        }
        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Item ${index + 1}: Quantity must be at least 1`);
        }
      });
      return true;
    }),

  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be 1-50 characters'),

  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be 1-50 characters'),

  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address is required and must be 5-200 characters'),

  body('shippingAddress.city')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('City is required and must be 1-50 characters'),

  body('shippingAddress.state')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('State is required and must be 1-50 characters'),

  body('shippingAddress.zipCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Zip code is required and must be 3-20 characters'),

  body('shippingAddress.country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country is required and must be 2-50 characters'),

  body('shippingAddress.phone')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number is required and must be 10-20 characters'),

  body('shippingAddress.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required if provided'),

  body('paymentMethod')
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage(`Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`),

  body('orderNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Order notes must not exceed 1000 characters')
];

// Express Validator Rules for Order Status Update
const updateOrderStatusValidation = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),

  body('status')
    .isIn(Object.values(ORDER_STATUS))
    .withMessage(`Status must be one of: ${Object.values(ORDER_STATUS).join(', ')}`),

  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Note must not exceed 500 characters')
];

// Express Validator Rules for Payment Status Update
const updatePaymentStatusValidation = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),

  body('paymentStatus')
    .isIn(Object.values(PAYMENT_STATUS))
    .withMessage(`Payment status must be one of: ${Object.values(PAYMENT_STATUS).join(', ')}`),

  body('transactionId')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be 1-100 characters if provided')
];

// Express Validator Rules for Adding Tracking
const addTrackingValidation = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),

  body('trackingNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tracking number is required and must be 1-50 characters'),

  body('carrier')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Carrier name must not exceed 50 characters')
];

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  // Schemas
  OrderSchema,
  OrderItemSchema,
  ShippingAddressSchema,
  OrderSummarySchema,
  StatusHistorySchema,

  // Enums
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,

  // Validation Rules
  createOrderValidation,
  updateOrderStatusValidation,
  updatePaymentStatusValidation,
  addTrackingValidation,
  handleValidationErrors,

  // Helper Functions
  validateOrderData: (orderData) => {
    const errors = [];

    // Validate required fields
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('Items array is required and must not be empty');
    }

    if (!orderData.shippingAddress) {
      errors.push('Shipping address is required');
    }

    if (!orderData.paymentMethod) {
      errors.push('Payment method is required');
    }

    // Validate payment method
    if (orderData.paymentMethod && !Object.values(PAYMENT_METHODS).includes(orderData.paymentMethod)) {
      errors.push(`Invalid payment method. Must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateOrderStatus: (status) => {
    return Object.values(ORDER_STATUS).includes(status);
  },

  validatePaymentStatus: (status) => {
    return Object.values(PAYMENT_STATUS).includes(status);
  },

  // Order calculation helpers
  calculateOrderSummary: (items, shippingCost = 0, taxRate = 0, discountAmount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const tax = subtotal * taxRate;
    const totalAmount = subtotal + shippingCost + tax - discountAmount;

    return {
      subtotal,
      shipping: shippingCost,
      tax,
      discount: discountAmount,
      totalAmount,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      itemCount: items.length
    };
  }
};
