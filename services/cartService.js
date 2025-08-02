const { db } = require('../config/firebase');

class CartService {
  constructor() {
    this.collection = db.collection('carts');
    this.productsCollection = db.collection('products');
  }

  async addToCart(userId, productId, quantity = 1) {
    // Check if product exists and is active
    const productDoc = await this.productsCollection.doc(productId).get();
    if (!productDoc.exists) {
      throw new Error('Product not found');
    }

    const product = productDoc.data();
    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    // Check stock availability
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}`);
    }

    // Check if item already exists in cart
    const existingCart = await this.collection
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();

    if (!existingCart.empty) {
      // Update quantity if item exists
      const cartDoc = existingCart.docs[0];
      const currentData = cartDoc.data();
      const newQuantity = currentData.quantity + quantity;

      // Check total stock availability
      if (product.stock < newQuantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`);
      }

      await cartDoc.ref.update({
        quantity: newQuantity,
        updatedAt: new Date()
      });

      const updatedDoc = await cartDoc.ref.get();
      return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    // Add new item to cart
    const docRef = await this.collection.add({
      userId,
      productId,
      quantity,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  async removeFromCart(userId, productId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();

    if (snapshot.empty) {
      throw new Error('Product not found in cart');
    }

    const doc = snapshot.docs[0];
    await doc.ref.delete();
    return true;
  }

  async updateCartItemQuantity(userId, productId, quantity) {
    if (quantity <= 0) {
      return await this.removeFromCart(userId, productId);
    }

    // Check product stock
    const productDoc = await this.productsCollection.doc(productId).get();
    if (!productDoc.exists) {
      throw new Error('Product not found');
    }

    const product = productDoc.data();
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}`);
    }

    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();

    if (snapshot.empty) {
      throw new Error('Product not found in cart');
    }

    const doc = snapshot.docs[0];
    await doc.ref.update({
      quantity,
      updatedAt: new Date()
    });

    const updatedDoc = await doc.ref.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async getUserCart(userId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .get();

    const cartItems = [];
    let totalAmount = 0;
    let totalItems = 0;

    for (const doc of snapshot.docs) {
      const cartData = doc.data();
      
      // Get product details
      const productDoc = await this.productsCollection.doc(cartData.productId).get();
      
      if (productDoc.exists) {
        const productData = productDoc.data();
        
        // Check if product is still active and in stock
        if (productData.isActive && productData.stock > 0) {
          // Adjust quantity if stock is less than cart quantity
          let adjustedQuantity = cartData.quantity;
          if (productData.stock < cartData.quantity) {
            adjustedQuantity = productData.stock;
            // Update cart with adjusted quantity
            await doc.ref.update({
              quantity: adjustedQuantity,
              updatedAt: new Date()
            });
          }

          const itemPrice = productData.discountPrice || productData.price;
          const itemTotal = itemPrice * adjustedQuantity;

          cartItems.push({
            id: doc.id,
            userId: cartData.userId,
            productId: cartData.productId,
            quantity: adjustedQuantity,
            createdAt: cartData.createdAt,
            updatedAt: cartData.updatedAt,
            product: {
              id: productDoc.id,
              name: productData.name,
              price: productData.price,
              discountPrice: productData.discountPrice,
              images: productData.images || [],
              stock: productData.stock,
              category: productData.category,
              brand: productData.brand
            },
            itemTotal
          });

          totalAmount += itemTotal;
          totalItems += adjustedQuantity;
        } else {
          // Remove inactive or out of stock products from cart
          await doc.ref.delete();
        }
      } else {
        // Remove products that no longer exist
        await doc.ref.delete();
      }
    }

    // Sort by createdAt in descending order (newest first) in JavaScript
    const sortedItems = cartItems.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return dateB - dateA;
    });

    return {
      items: sortedItems,
      summary: {
        totalItems,
        totalAmount,
        itemCount: sortedItems.length
      }
    };
  }

  async clearCart(userId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return true;
  }

  async getCartCount(userId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .get();

    let totalItems = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      totalItems += data.quantity;
    }

    return totalItems;
  }

  async moveToWishlist(userId, productId) {
    // This would require integration with wishlist service
    // For now, just remove from cart
    return await this.removeFromCart(userId, productId);
  }

  async incrementCartItem(userId, productId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();

    if (snapshot.empty) {
      throw new Error('Product not found in cart');
    }

    const cartDoc = snapshot.docs[0];
    const cartData = cartDoc.data();
    const newQuantity = cartData.quantity + 1;

    // Check product stock
    const productDoc = await this.productsCollection.doc(productId).get();
    if (!productDoc.exists) {
      throw new Error('Product not found');
    }

    const product = productDoc.data();
    if (product.stock < newQuantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`);
    }

    await cartDoc.ref.update({
      quantity: newQuantity,
      updatedAt: new Date()
    });

    const updatedDoc = await cartDoc.ref.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async decrementCartItem(userId, productId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();

    if (snapshot.empty) {
      throw new Error('Product not found in cart');
    }

    const cartDoc = snapshot.docs[0];
    const cartData = cartDoc.data();
    const newQuantity = cartData.quantity - 1;

    // If quantity becomes 0 or less, remove the item
    if (newQuantity <= 0) {
      await cartDoc.ref.delete();
      return { removed: true, message: 'Product removed from cart' };
    }

    await cartDoc.ref.update({
      quantity: newQuantity,
      updatedAt: new Date()
    });

    const updatedDoc = await cartDoc.ref.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }
}

module.exports = new CartService();
