const { db } = require('../config/firebase');

class WishlistService {
  constructor() {
    this.collection = db.collection('wishlists');
    this.productsCollection = db.collection('products');
  }

  async addToWishlist(userId, productId) {
    // Check if product exists
    const productDoc = await this.productsCollection.doc(productId).get();
    if (!productDoc.exists) {
      throw new Error('Product not found');
    }

    // Check if item already exists in wishlist
    const existingWishlist = await this.collection
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();

    if (!existingWishlist.empty) {
      throw new Error('Product already in wishlist');
    }

    // Add to wishlist
    const docRef = await this.collection.add({
      userId,
      productId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  async removeFromWishlist(userId, productId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();

    if (snapshot.empty) {
      throw new Error('Product not found in wishlist');
    }

    const doc = snapshot.docs[0];
    await doc.ref.delete();
    return true;
  }

  async getUserWishlist(userId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .get();

    const wishlistItems = [];

    for (const doc of snapshot.docs) {
      const wishlistData = doc.data();
      
      // Get product details
      const productDoc = await this.productsCollection.doc(wishlistData.productId).get();
      
      if (productDoc.exists) {
        const productData = productDoc.data();
        
        // Only include active products
        if (productData.isActive) {
          const finalPrice = productData.discountPrice || productData.price;
          
          wishlistItems.push({
            id: doc.id,
            userId: wishlistData.userId,
            productId: wishlistData.productId,
            createdAt: wishlistData.createdAt,
            updatedAt: wishlistData.updatedAt,
            product: {
              id: productDoc.id,
              name: productData.name,
              description: productData.description,
              price: productData.price,
              discountPrice: productData.discountPrice,
              finalPrice: finalPrice,
              images: productData.images || [],
              category: productData.category,
              brand: productData.brand,
              stock: productData.stock,
              isInStock: productData.stock > 0,
              rating: productData.rating || 0,
              reviewCount: productData.reviewCount || 0,
              sku: productData.sku || ''
            }
          });
        } else {
          // Remove inactive products from wishlist
          await doc.ref.delete();
        }
      } else {
        // Remove products that no longer exist
        await doc.ref.delete();
      }
    }

    // Sort by createdAt in descending order (newest first) in JavaScript
    return wishlistItems.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return dateB - dateA;
    });
  }

  async clearWishlist(userId) {
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

  async getWishlistCount(userId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .get();

    return snapshot.size;
  }

  async moveToCart(userId, productId) {
    // This would require integration with cart service
    // For now, we'll just provide the interface
    const isInWishlist = await this.isProductInWishlist(userId, productId);
    
    if (!isInWishlist) {
      throw new Error('Product not found in wishlist');
    }

    // Remove from wishlist
    await this.removeFromWishlist(userId, productId);
    
    return {
      success: true,
      message: 'Product removed from wishlist. Add to cart functionality needs to be implemented with CartService.'
    };
  }

  async getWishlistByCategory(userId, category) {
    const wishlistItems = await this.getUserWishlist(userId);
    
    return wishlistItems.filter(item => 
      item.product.category?.toLowerCase() === category.toLowerCase()
    );
  }

  async getWishlistSummary(userId) {
    const wishlistItems = await this.getUserWishlist(userId);
    
    let totalValue = 0;
    let totalDiscount = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;
    const categories = new Set();

    wishlistItems.forEach(item => {
      const product = item.product;
      totalValue += product.finalPrice;
      
      if (product.discountPrice && product.price > product.discountPrice) {
        totalDiscount += (product.price - product.discountPrice);
      }
      
      if (product.isInStock) {
        inStockCount++;
      } else {
        outOfStockCount++;
      }
      
      if (product.category) {
        categories.add(product.category);
      }
    });

    return {
      totalItems: wishlistItems.length,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      inStockCount,
      outOfStockCount,
      categories: Array.from(categories),
      items: wishlistItems
    };
  }

  async bulkAddToWishlist(userId, productIds) {
    const results = [];
    const errors = [];

    for (const productId of productIds) {
      try {
        const result = await this.addToWishlist(userId, productId);
        results.push(result);
      } catch (error) {
        errors.push({
          productId,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: productIds.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  async bulkRemoveFromWishlist(userId, productIds) {
    const results = [];
    const errors = [];

    for (const productId of productIds) {
      try {
        await this.removeFromWishlist(userId, productId);
        results.push(productId);
      } catch (error) {
        errors.push({
          productId,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: productIds.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  async getRecentlyAdded(userId, limit = 5) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .get();

    const allItems = [];

    for (const doc of snapshot.docs) {
      const wishlistData = doc.data();
      const productDoc = await this.productsCollection.doc(wishlistData.productId).get();
      
      if (productDoc.exists) {
        const productData = productDoc.data();
        if (productData.isActive) {
          allItems.push({
            id: doc.id,
            productId: wishlistData.productId,
            addedAt: wishlistData.createdAt,
            product: {
              id: productDoc.id,
              name: productData.name,
              price: productData.price,
              discountPrice: productData.discountPrice,
              images: productData.images || [],
              category: productData.category
            }
          });
        }
      }
    }

    // Sort by createdAt in descending order and limit in JavaScript
    return allItems
      .sort((a, b) => {
        const dateA = a.addedAt?.toDate?.() || a.addedAt || new Date(0);
        const dateB = b.addedAt?.toDate?.() || b.addedAt || new Date(0);
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  async searchWishlist(userId, searchTerm) {
    const wishlistItems = await this.getUserWishlist(userId);
    const searchLower = searchTerm.toLowerCase();
    
    return wishlistItems.filter(item => {
      const product = item.product;
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    });
  }
}

module.exports = new WishlistService();
