const { db } = require('../config/firebase');

class OrderService {
  constructor() {
    this.collection = db.collection('orders');
    this.productsCollection = db.collection('products');
    this.cartsCollection = db.collection('carts');
    this.usersCollection = db.collection('users');
  }

  async createOrder(userId, orderData) {
    const {
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus = 'pending',
      orderNotes = ''
    } = orderData;

    // Validate items and calculate totals
    let totalAmount = 0;
    let totalItems = 0;
    const validatedItems = [];

    for (const item of items) {
      const productDoc = await this.productsCollection.doc(item.productId).get();
      
      if (!productDoc.exists) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const product = productDoc.data();
      
      if (!product.isActive) {
        throw new Error(`Product ${product.name} is not available`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      const itemPrice = product.discountPrice || product.price;
      const itemTotal = itemPrice * item.quantity;

      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        productImage: product.images?.[0] || '',
        price: product.price,
        discountPrice: product.discountPrice,
        finalPrice: itemPrice,
        quantity: item.quantity,
        itemTotal: itemTotal,
        sku: product.sku || '',
        category: product.category || ''
      });

      totalAmount += itemTotal;
      totalItems += item.quantity;
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order object
    const order = {
      orderNumber,
      userId,
      items: validatedItems,
      orderSummary: {
        subtotal: totalAmount,
        shipping: 0, // You can add shipping calculation logic
        tax: 0,      // You can add tax calculation logic
        discount: 0, // You can add discount logic
        totalAmount: totalAmount,
        totalItems: totalItems,
        itemCount: validatedItems.length
      },
      shippingAddress,
      paymentMethod,
      paymentStatus,
      orderStatus: 'pending',
      orderNotes,
      trackingNumber: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Order created'
        }
      ]
    };

    // Create order in database
    const docRef = await this.collection.add(order);

    // Update product stock
    const batch = db.batch();
    for (const item of validatedItems) {
      const productRef = this.productsCollection.doc(item.productId);
      const productDoc = await productRef.get();
      const currentStock = productDoc.data().stock;
      
      batch.update(productRef, {
        stock: currentStock - item.quantity,
        updatedAt: new Date()
      });
    }
    await batch.commit();

    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  async createOrderFromCart(userId, orderData) {
    // Get user's cart
    const cartSnapshot = await this.cartsCollection
      .where('userId', '==', userId)
      .get();

    if (cartSnapshot.empty) {
      throw new Error('Cart is empty');
    }

    const cartItems = [];
    
    for (const cartDoc of cartSnapshot.docs) {
      const cartData = cartDoc.data();
      cartItems.push({
        productId: cartData.productId,
        quantity: cartData.quantity
      });
    }

    // Create order from cart items
    const order = await this.createOrder(userId, {
      ...orderData,
      items: cartItems
    });

    // Clear user's cart after successful order
    const cartBatch = db.batch();
    cartSnapshot.docs.forEach(doc => {
      cartBatch.delete(doc.ref);
    });
    await cartBatch.commit();

    return order;
  }

  async createOrderFromCartItems(userId, orderData) {
    const { productIds, shippingAddress, paymentMethod, orderNotes } = orderData;

    // Get user's cart
    const cartSnapshot = await this.cartsCollection
      .where('userId', '==', userId)
      .get();

    if (cartSnapshot.empty) {
      throw new Error('Cart is empty');
    }

    // Filter cart items based on requested product IDs
    const cartItems = [];
    const cartData = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const productId of productIds) {
      const cartItem = cartData.find(item => item.productId === productId);
      
      if (!cartItem) {
        throw new Error(`Product ${productId} not found in cart`);
      }

      cartItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity
      });
    }

    // Create order from selected cart items
    const order = await this.createOrder(userId, {
      items: cartItems,
      shippingAddress,
      paymentMethod,
      orderNotes
    });

    // Remove ordered items from cart
    const cartBatch = db.batch();
    for (const productId of productIds) {
      const cartDoc = cartSnapshot.docs.find(doc => doc.data().productId === productId);
      if (cartDoc) {
        cartBatch.delete(cartDoc.ref);
      }
    }
    await cartBatch.commit();

    return order;
  }

  async getOrderById(orderId) {
    const doc = await this.collection.doc(orderId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  async getUserOrders(userId, filters = {}) {
    let query = this.collection.where('userId', '==', userId);

    if (filters.status) {
      query = query.where('orderStatus', '==', filters.status);
    }

    if (filters.paymentStatus) {
      query = query.where('paymentStatus', '==', filters.paymentStatus);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getAllOrders(filters = {}) {
    let query = this.collection;

    if (filters.status) {
      query = query.where('orderStatus', '==', filters.status);
    }

    if (filters.paymentStatus) {
      query = query.where('paymentStatus', '==', filters.paymentStatus);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async updateOrderStatus(orderId, status, note = '') {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}`
    });

    await this.collection.doc(orderId).update({
      orderStatus: status,
      updatedAt: new Date(),
      statusHistory
    });

    return await this.getOrderById(orderId);
  }

  async updatePaymentStatus(orderId, paymentStatus, transactionId = '') {
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    if (!validStatuses.includes(paymentStatus)) {
      throw new Error('Invalid payment status');
    }

    const updateData = {
      paymentStatus,
      updatedAt: new Date()
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (paymentStatus === 'paid') {
      updateData.paidAt = new Date();
    }

    await this.collection.doc(orderId).update(updateData);

    return await this.getOrderById(orderId);
  }

  async addTrackingNumber(orderId, trackingNumber, carrier = '') {
    const updateData = {
      trackingNumber,
      updatedAt: new Date()
    };

    if (carrier) {
      updateData.carrier = carrier;
    }

    await this.collection.doc(orderId).update(updateData);

    return await this.getOrderById(orderId);
  }

  async cancelOrder(orderId, reason = '') {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      throw new Error('Cannot cancel order that has been shipped or delivered');
    }

    // Restore product stock
    const batch = db.batch();
    for (const item of order.items) {
      const productRef = this.productsCollection.doc(item.productId);
      const productDoc = await productRef.get();
      
      if (productDoc.exists) {
        const currentStock = productDoc.data().stock;
        batch.update(productRef, {
          stock: currentStock + item.quantity,
          updatedAt: new Date()
        });
      }
    }
    await batch.commit();

    // Update order status
    return await this.updateOrderStatus(orderId, 'cancelled', reason || 'Order cancelled by user');
  }

  async generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  async getOrderStats() {
    const snapshot = await this.collection.get();
    const orders = snapshot.docs.map(doc => doc.data());

    const stats = {
      totalOrders: orders.length,
      totalRevenue: 0,
      statusCounts: {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      },
      paymentCounts: {
        pending: 0,
        paid: 0,
        failed: 0,
        refunded: 0
      }
    };

    orders.forEach(order => {
      if (order.paymentStatus === 'paid') {
        stats.totalRevenue += order.orderSummary?.totalAmount || 0;
      }
      
      stats.statusCounts[order.orderStatus] = (stats.statusCounts[order.orderStatus] || 0) + 1;
      stats.paymentCounts[order.paymentStatus] = (stats.paymentCounts[order.paymentStatus] || 0) + 1;
    });

    return stats;
  }
}

module.exports = new OrderService();
